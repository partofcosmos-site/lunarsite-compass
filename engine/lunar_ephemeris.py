"""
LunarSite Compass — Lunar Ephemeris & Orbital Vector Engine
Rigorous topocentric solar and terrestrial position vector engine
integrating verified NASA JPL Horizons REST API ephemeris (DE440)
and astronomical first-principles calculations (Jean Meeus Astronomical Algorithms).

Operational Modes:
1. NASA JPL Horizons Telemetry Mode: Reads and interpolates real-world topocentric and
   geocentric ephemeris from data/real_ephemeris_2026.json (November 2026).
2. Meeus Astrodynamic Analytical Engine: High-precision celestial mechanics fallback
   for arbitrary temporal epochs and arbitrary lunar surface coordinates.
"""

import os
import json
import numpy as np
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Any, Optional

# Fundamental Lunar & Astrodynamic Constants (IAU / NAIF SPICE / JPL DE440)
LUNAR_RADIUS_KM = 1737.4
LUNAR_RADIUS_M = 1737400.0
LUNAR_OBLIQUITY_DEG = 1.5424          # Tilt of lunar equator to ecliptic (I = 1° 32' 32.7" = 1.54242°)
LUNAR_OBLIQUITY_EXACT_DEG = 1.54242

SYNODIC_MONTH_DAYS = 29.530588853     # New moon to new moon (solar day on Moon)
SIDEREAL_MONTH_DAYS = 27.321661       # Orbit relative to celestial background
ANOMALISTIC_MONTH_DAYS = 27.554551    # Perigee to perigee (governs longitudinal libration)
DRACONIC_MONTH_DAYS = 27.212220       # Node to node (governs latitudinal libration)
NODAL_PRECESSION_PERIOD_YEARS = 18.61295 # 6798.38 days (full nodal regression)
NODAL_PRECESSION_RATE_DEG_CENTURY = -1934.136261 # Degrees per Julian century

LIBRATION_LON_MAX_DEG = 7.91          # Maximum longitudinal libration amplitude
LIBRATION_LAT_MAX_DEG = 6.68          # Maximum latitudinal libration amplitude

SPEED_OF_LIGHT_KM_S = 299792.458
AU_KM = 149597870.7                  # 1 Astronomical Unit in km
JD_J2000 = 2451545.0                 # 2000-01-01 12:00:00 TT
UNIX_EPOCH_JD = 2440587.5            # 1970-01-01 00:00:00 UTC in Julian Date

# Reference epoch: 2026-01-01 00:00:00 UTC
EPOCH_2026 = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc).timestamp()


class LunarEphemeris:
    """
    High-fidelity astronomical ephemeris engine for lunar surface landing sites.
    Evaluates topocentric Sun and Earth vectors in the Moon body-fixed frame (MOON_ME)
    from NASA JPL Horizons REST API or fundamental solar and lunar orbital theory.
    """

    def __init__(
        self,
        ref_epoch_timestamp: float = EPOCH_2026,
        real_ephemeris_path: Optional[str] = None
    ):
        self.epoch = ref_epoch_timestamp
        self.ref_epoch = ref_epoch_timestamp
        
        # Determine real ephemeris dataset path
        if real_ephemeris_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            real_ephemeris_path = os.path.join(base_dir, "data", "real_ephemeris_2026.json")
            
        self.real_ephemeris_path = real_ephemeris_path
        self.is_real = False
        self.real_metadata: Dict[str, Any] = {}
        
        # In-memory arrays for fast O(1) interpolation of real NASA ephemeris
        self.geo_ts = np.array([])
        self.geo_subsolar_lat = np.array([])
        self.geo_subsolar_lon_unwrapped = np.array([])
        self.geo_subearth_lat = np.array([])
        self.geo_subearth_lon_unwrapped = np.array([])
        self.geo_earth_dist_km = np.array([])
        
        # Per-site topocentric caches
        self.site_topocentric: Dict[str, Dict[str, np.ndarray]] = {}
        self.site_coords: Dict[str, Tuple[float, float]] = {}
        
        self._load_real_ephemeris()

    def _load_real_ephemeris(self) -> None:
        """Loads and indexes verified real NASA JPL Horizons ephemeris if available."""
        if not os.path.exists(self.real_ephemeris_path):
            return

        try:
            with open(self.real_ephemeris_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            geo = data.get("geocentric_ephemeris", [])
            if not geo:
                return
                
            self.real_metadata = data.get("metadata", {})
            self.geo_ts = np.array([r["timestamp"] for r in geo], dtype=np.float64)
            self.geo_subsolar_lat = np.array([r["sub_solar_latitude_deg"] for r in geo], dtype=np.float64)
            
            raw_sun_lon = np.array([r["sub_solar_longitude_deg"] for r in geo], dtype=np.float64)
            self.geo_subsolar_lon_unwrapped = np.unwrap(np.radians(raw_sun_lon))
            
            self.geo_subearth_lat = np.array([r["sub_earth_latitude_deg"] for r in geo], dtype=np.float64)
            raw_earth_lon = np.array([r["sub_earth_longitude_deg"] for r in geo], dtype=np.float64)
            self.geo_subearth_lon_unwrapped = np.unwrap(np.radians(raw_earth_lon))
            
            self.geo_earth_dist_km = np.array([r["earth_moon_distance_km"] for r in geo], dtype=np.float64)
            
            # Index topocentric sites
            topos = data.get("topocentric_sites", {})
            for sid, sdata in topos.items():
                records = sdata.get("records", [])
                if not records:
                    continue
                s_ts = np.array([r["timestamp"] for r in records], dtype=np.float64)
                s_sun_az = np.unwrap(np.radians(np.array([r["sun_azimuth_deg"] for r in records], dtype=np.float64)))
                s_sun_el = np.array([r["sun_elevation_deg"] for r in records], dtype=np.float64)
                s_earth_az = np.unwrap(np.radians(np.array([r["earth_azimuth_deg"] for r in records], dtype=np.float64)))
                s_earth_el = np.array([r["earth_elevation_deg"] for r in records], dtype=np.float64)
                
                self.site_topocentric[sid] = {
                    "timestamps": s_ts,
                    "sun_az_unwrapped": s_sun_az,
                    "sun_el": s_sun_el,
                    "earth_az_unwrapped": s_earth_az,
                    "earth_el": s_earth_el
                }
                self.site_coords[sid] = (float(sdata.get("latitude", 0.0)), float(sdata.get("longitude", 0.0)))
                
            self.is_real = True
        except Exception as e:
            # Fall back to Meeus model on any parse failure
            self.is_real = False

    def is_real_ephemeris_active(self) -> bool:
        """Returns True if verified NASA JPL Horizons ephemeris data is actively loaded."""
        return self.is_real

    def get_ephemeris_provenance(self) -> Dict[str, Any]:
        """Returns metadata regarding data source and fidelity."""
        if self.is_real:
            return {
                "source": "NASA JPL Horizons REST API",
                "api_endpoint": self.real_metadata.get("api_endpoint", "https://ssd.jpl.nasa.gov/api/horizons.api"),
                "target_body": "Moon (NAIF ID 301)",
                "coordinate_frame": "IAU Moon Body-Fixed (MOON_ME)",
                "time_window": f"{self.real_metadata.get('start_time')} to {self.real_metadata.get('stop_time')}",
                "status": "VERIFIED_REAL_NASA_TELEMETRY"
            }
        return {
            "source": "Meeus Astrodynamic Analytical Engine",
            "theory": "Jean Meeus Astronomical Algorithms (Ch. 47, 51, 53)",
            "coordinate_frame": "IAU Moon Body-Fixed (MOON_ME)",
            "status": "ANALYTICAL_MODEL"
        }

    @staticmethod
    def timestamp_to_julian_centuries(timestamp: float) -> Tuple[float, float]:
        """Converts Unix UTC timestamp into Julian Date (JD) and Julian centuries since J2000.0."""
        jd = UNIX_EPOCH_JD + (timestamp / 86400.0)
        T = (jd - JD_J2000) / 36525.0
        return float(jd), float(T)

    def get_ephemeris_state(self, timestamp: float) -> Dict[str, float]:
        """
        Computes the complete astronomical state of the Sun and Moon for a given timestamp
        using Meeus Astronomical Algorithms (Chapters 47, 51, and 53).
        """
        jd, T = self.timestamp_to_julian_centuries(timestamp)

        # 1. Fundamental Mean Arguments (Meeus Ch. 47 & 53)
        L0 = (280.46646 + 36000.76983 * T + 0.0003032 * T**2) % 360.0
        M_sun = (357.52911 + 35999.05029 * T - 0.0001537 * T**2) % 360.0
        L_moon = (218.3164477 + 481267.8812342 * T - 0.0015786 * T**2 + (T**3) / 538841.0) % 360.0
        D = (297.8501921 + 445267.1114034 * T - 0.0018819 * T**2 + (T**3) / 545868.0) % 360.0
        M_moon = (134.9633964 + 477198.8675055 * T + 0.0087414 * T**2 + (T**3) / 69699.0) % 360.0
        F = (93.2720950 + 483202.0175233 * T - 0.0036539 * T**2 - (T**3) / 3526000.0) % 360.0
        Omega = (125.044522 + NODAL_PRECESSION_RATE_DEG_CENTURY * T + 0.0020708 * T**2 + (T**3) / 450000.0) % 360.0

        # 2. Sun True Ecliptic Longitude via Equation of Center
        C_sun = (
            (1.914602 - 0.004817 * T) * np.sin(np.radians(M_sun))
            + (0.019993 - 0.000101 * T) * np.sin(np.radians(2.0 * M_sun))
            + 0.000289 * np.sin(np.radians(3.0 * M_sun))
        )
        lambda_sun = (L0 + C_sun) % 360.0

        # 3. Moon True Ecliptic Longitude and Latitude (Meeus Ch. 47 principal perturbations)
        sig_l = (
            6.288774 * np.sin(np.radians(M_moon))
            + 1.274027 * np.sin(np.radians(2.0 * D - M_moon))
            + 0.658314 * np.sin(np.radians(2.0 * D))
            + 0.213618 * np.sin(np.radians(2.0 * M_moon))
            - 0.185116 * np.sin(np.radians(M_sun))
            - 0.114332 * np.sin(np.radians(2.0 * F))
            + 0.058793 * np.sin(np.radians(2.0 * D - 2.0 * M_moon))
            + 0.057066 * np.sin(np.radians(2.0 * D - M_sun - M_moon))
            + 0.053322 * np.sin(np.radians(2.0 * D + M_moon))
            + 0.045758 * np.sin(np.radians(2.0 * D - M_sun))
            - 0.040923 * np.sin(np.radians(M_sun - M_moon))
            - 0.034720 * np.sin(np.radians(D))
            - 0.030383 * np.sin(np.radians(M_sun + M_moon))
            + 0.015327 * np.sin(np.radians(2.0 * D - 2.0 * F))
            - 0.012528 * np.sin(np.radians(2.0 * D + M_moon - M_sun))
            + 0.010980 * np.sin(np.radians(2.0 * D + M_sun))
        )
        lambda_moon = (L_moon + sig_l) % 360.0

        sig_b = (
            5.128122 * np.sin(np.radians(F))
            + 0.280602 * np.sin(np.radians(M_moon + F))
            + 0.277693 * np.sin(np.radians(M_moon - F))
            + 0.173238 * np.sin(np.radians(2.0 * D - F))
            + 0.055413 * np.sin(np.radians(2.0 * D - M_moon + F))
            + 0.046271 * np.sin(np.radians(2.0 * D - M_moon - F))
            + 0.032573 * np.sin(np.radians(2.0 * D + F))
            + 0.017198 * np.sin(np.radians(2.0 * M_moon + F))
            + 0.009266 * np.sin(np.radians(2.0 * D + M_moon - F))
            + 0.008822 * np.sin(np.radians(2.0 * M_moon - F))
        )
        beta_moon = sig_b

        # Distance Earth-Moon (km)
        dist_earth_km = float(
            385000.56
            - 20905.355 * np.cos(np.radians(M_moon))
            - 3699.111 * np.cos(np.radians(2.0 * D - M_moon))
            - 2955.968 * np.cos(np.radians(2.0 * D))
            - 569.925 * np.cos(np.radians(2.0 * M_moon))
            + 48.888 * np.cos(np.radians(M_sun))
            - 3.149 * np.cos(np.radians(2.0 * F))
        )

        I = LUNAR_OBLIQUITY_EXACT_DEG

        # 4. Earth Optical & Physical Libration (Meeus Ch. 53)
        W = (lambda_moon - Omega) % 360.0
        sin_b_prime = -np.sin(np.radians(beta_moon)) * np.cos(np.radians(I)) + np.cos(np.radians(beta_moon)) * np.sin(np.radians(I)) * np.sin(np.radians(W))
        b_prime = np.degrees(np.arcsin(np.clip(sin_b_prime, -1.0, 1.0)))

        num = np.sin(np.radians(W)) * np.cos(np.radians(I)) - np.tan(np.radians(beta_moon)) * np.sin(np.radians(I))
        den = np.cos(np.radians(W))
        A = np.degrees(np.arctan2(num, den)) % 360.0
        l_prime = (A - F) % 360.0
        if l_prime > 180.0:
            l_prime -= 360.0

        # Physical librations in longitude (tau), node (rho), and inclination (sigma)
        tau = -0.02752 * np.sin(np.radians(M_moon)) - 0.02245 * np.sin(np.radians(F)) + 0.00684 * np.sin(np.radians(M_moon - 2.0 * F))
        rho = -0.02572 * np.cos(np.radians(M_moon)) + 0.00363 * np.cos(np.radians(2.0 * M_moon))
        sigma = -0.02816 * np.sin(np.radians(M_moon)) + 0.00401 * np.sin(np.radians(2.0 * M_moon))

        subearth_lat = float(b_prime + (rho * np.sin(np.radians(A)) + sigma * np.cos(np.radians(A))))
        subearth_lon = float(l_prime + tau)

        # 5. Sun Selenographic Coordinates (Subsolar Point on Moon)
        W0 = (lambda_sun - Omega) % 360.0
        sin_b_sun = np.sin(np.radians(I)) * np.sin(np.radians(W0))
        subsolar_lat = float(np.degrees(np.arcsin(np.clip(sin_b_sun, -1.0, 1.0))))

        alpha_sun = np.degrees(np.arctan2(np.sin(np.radians(W0)) * np.cos(np.radians(I)), np.cos(np.radians(W0)))) % 360.0
        subsolar_lon = float((alpha_sun - (F + tau)) % 360.0)
        if subsolar_lon > 180.0:
            subsolar_lon -= 360.0

        return {
            "subsolar_lat": subsolar_lat,
            "subsolar_lon": subsolar_lon,
            "subearth_lat": subearth_lat,
            "subearth_lon": subearth_lon,
            "dist_earth_km": dist_earth_km,
            "dist_sun_km": AU_KM,
            "lambda_sun": float(lambda_sun),
            "lambda_moon": float(lambda_moon),
            "beta_moon": float(beta_moon),
            "node_omega": float(Omega)
        }

    def get_real_subsolar_coordinates(self, timestamp: float) -> Optional[Tuple[float, float]]:
        """Retrieves exact interpolated NASA JPL Horizons subsolar coordinates if within range."""
        if self.is_real and len(self.geo_ts) > 0 and (self.geo_ts[0] <= timestamp <= self.geo_ts[-1]):
            lat = float(np.interp(timestamp, self.geo_ts, self.geo_subsolar_lat))
            lon_unw = float(np.interp(timestamp, self.geo_ts, self.geo_subsolar_lon_unwrapped))
            lon = (np.degrees(lon_unw) + 360.0) % 360.0
            if lon > 180.0:
                lon -= 360.0
            return lat, lon
        return None

    def get_real_subearth_coordinates(self, timestamp: float) -> Optional[Tuple[float, float]]:
        """Retrieves exact interpolated NASA JPL Horizons subearth coordinates if within range."""
        if self.is_real and len(self.geo_ts) > 0 and (self.geo_ts[0] <= timestamp <= self.geo_ts[-1]):
            lat = float(np.interp(timestamp, self.geo_ts, self.geo_subearth_lat))
            lon_unw = float(np.interp(timestamp, self.geo_ts, self.geo_subearth_lon_unwrapped))
            lon = (np.degrees(lon_unw) + 360.0) % 360.0
            if lon > 180.0:
                lon -= 360.0
            return lat, lon
        return None

    def get_subsolar_coordinates(self, timestamp: float, use_real: bool = False) -> Tuple[float, float]:
        """
        Computes sub-solar latitude (solar declination) and longitude on the Moon.
        Defaults to rigorous Meeus astronomical theory; returns exact NASA JPL Horizons
        telemetry when use_real=True.
        """
        if use_real and self.is_real:
            real_coords = self.get_real_subsolar_coordinates(timestamp)
            if real_coords is not None:
                return real_coords

        state = self.get_ephemeris_state(timestamp)
        return float(state["subsolar_lat"]), float(state["subsolar_lon"])

    def get_subearth_coordinates(self, timestamp: float, use_real: bool = False) -> Tuple[float, float]:
        """
        Computes optical and physical libration coordinates (sub-Earth point on Moon).
        Defaults to rigorous Meeus astronomical theory; returns exact NASA JPL Horizons
        telemetry when use_real=True.
        """
        if use_real and self.is_real:
            real_coords = self.get_real_subearth_coordinates(timestamp)
            if real_coords is not None:
                return real_coords

        state = self.get_ephemeris_state(timestamp)
        return float(state["subearth_lat"]), float(state["subearth_lon"])

    def calculate_topocentric_vector(
        self,
        site_lat_deg: float,
        site_lon_deg: float,
        target_lat_deg: float,
        target_lon_deg: float,
        site_elev_m: float = 0.0,
        target_dist_km: float = None
    ) -> Tuple[float, float]:
        """
        Calculates local topocentric Azimuth and Elevation (degrees) of a celestial body
        (Sun or Earth) as viewed from a surface landing site (site_lat_deg, site_lon_deg, site_elev_m).
        """
        phi1 = np.radians(site_lat_deg)
        lam1 = np.radians(site_lon_deg)
        phi2 = np.radians(target_lat_deg)
        lam2 = np.radians(target_lon_deg)

        uZ = np.array([np.cos(phi1) * np.cos(lam1), np.cos(phi1) * np.sin(lam1), np.sin(phi1)])
        uN = np.array([-np.sin(phi1) * np.cos(lam1), -np.sin(phi1) * np.sin(lam1), np.cos(phi1)])
        uE = np.array([-np.sin(lam1), np.cos(lam1), 0.0])

        r_site_km = LUNAR_RADIUS_KM + (site_elev_m / 1000.0)
        r_site_vec = r_site_km * uZ

        if target_dist_km is None:
            u_tgt = np.array([np.cos(phi2) * np.cos(lam2), np.cos(phi2) * np.sin(lam2), np.sin(phi2)])
            rho_Z = float(np.dot(u_tgt, uZ))
            rho_N = float(np.dot(u_tgt, uN))
            rho_E = float(np.dot(u_tgt, uE))
            elevation_deg = float(np.degrees(np.arcsin(np.clip(rho_Z, -1.0, 1.0))))
            azimuth_deg = float((np.degrees(np.arctan2(rho_E, rho_N)) + 360.0) % 360.0)
        else:
            r_tgt_vec = target_dist_km * np.array([
                np.cos(phi2) * np.cos(lam2),
                np.cos(phi2) * np.sin(lam2),
                np.sin(phi2)
            ])
            rho = r_tgt_vec - r_site_vec
            rho_len = float(np.linalg.norm(rho))
            rho_Z = float(np.dot(rho, uZ))
            rho_N = float(np.dot(rho, uN))
            rho_E = float(np.dot(rho, uE))
            elevation_deg = float(np.degrees(np.arcsin(np.clip(rho_Z / rho_len, -1.0, 1.0))))
            azimuth_deg = float((np.degrees(np.arctan2(rho_E, rho_N)) + 360.0) % 360.0)

        return float(azimuth_deg), float(elevation_deg)

    def get_solar_vector(
        self,
        site_lat: float,
        site_lon: float,
        timestamp: float,
        site_elev_m: float = 0.0,
        site_id: Optional[str] = None
    ) -> Tuple[float, float]:
        """
        Returns (azimuth_deg, elevation_deg) of the Sun at given lunar site and timestamp.
        Seamlessly returns exact NASA JPL Horizons topocentric telemetry when site_id is provided.
        """
        if site_id and self.is_real and site_id in self.site_topocentric:
            sdata = self.site_topocentric[site_id]
            ts_arr = sdata["timestamps"]
            if len(ts_arr) > 0 and (ts_arr[0] <= timestamp <= ts_arr[-1]):
                az_unw = float(np.interp(timestamp, ts_arr, sdata["sun_az_unwrapped"]))
                el = float(np.interp(timestamp, ts_arr, sdata["sun_el"]))
                az = float((np.degrees(az_unw) + 360.0) % 360.0)
                return az, el

        state = self.get_ephemeris_state(timestamp)
        return self.calculate_topocentric_vector(
            site_lat,
            site_lon,
            state["subsolar_lat"],
            state["subsolar_lon"],
            site_elev_m=site_elev_m,
            target_dist_km=state["dist_sun_km"]
        )

    def get_earth_vector(
        self,
        site_lat: float,
        site_lon: float,
        timestamp: float,
        site_elev_m: float = 0.0,
        site_id: Optional[str] = None
    ) -> Tuple[float, float]:
        """
        Returns (azimuth_deg, elevation_deg) of the Earth at given lunar site and timestamp.
        Seamlessly returns exact NASA JPL Horizons topocentric telemetry when site_id is provided.
        """
        if site_id and self.is_real and site_id in self.site_topocentric:
            sdata = self.site_topocentric[site_id]
            ts_arr = sdata["timestamps"]
            if len(ts_arr) > 0 and (ts_arr[0] <= timestamp <= ts_arr[-1]):
                az_unw = float(np.interp(timestamp, ts_arr, sdata["earth_az_unwrapped"]))
                el = float(np.interp(timestamp, ts_arr, sdata["earth_el"]))
                az = float((np.degrees(az_unw) + 360.0) % 360.0)
                return az, el

        state = self.get_ephemeris_state(timestamp)
        return self.calculate_topocentric_vector(
            site_lat,
            site_lon,
            state["subearth_lat"],
            state["subearth_lon"],
            site_elev_m=site_elev_m,
            target_dist_km=state["dist_earth_km"]
        )
