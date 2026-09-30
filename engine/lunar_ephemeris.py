"""
LunarSite Compass — Lunar Ephemeris & Orbital Vector Engine
Computes topocentric solar and terrestrial position vectors (azimuth and elevation)
for any site on the lunar surface, accounting for lunar axial tilt (1.5424°) and 
longitudinal/latitudinal librations (±7.9° and ±6.7°).
"""

import numpy as np
from datetime import datetime, timezone
from typing import Dict, List, Tuple

# Fundamental Lunar & Astrodynamic Constants
LUNAR_RADIUS_KM = 1737.4
LUNAR_OBLIQUITY_DEG = 1.5424          # Tilt of lunar equator to ecliptic
SYNODIC_MONTH_DAYS = 29.530588853     # New moon to new moon (solar day)
SIDEREAL_MONTH_DAYS = 27.321661       # Orbit relative to stars
ANOMALISTIC_MONTH_DAYS = 27.554551    # Perigee to perigee (longitudinal libration)
DRACONIC_MONTH_DAYS = 27.212220       # Node to node (latitudinal libration)

LIBRATION_LON_MAX_DEG = 7.91          # Maximum longitudinal libration amplitude
LIBRATION_LAT_MAX_DEG = 6.68          # Maximum latitudinal libration amplitude

# Reference epoch: 2026-01-01 00:00:00 UTC
EPOCH_2026 = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc).timestamp()

class LunarEphemeris:
    """Calculates topocentric Sun and Earth vectors from lunar surface coordinates."""

    def __init__(self, ref_epoch_timestamp: float = EPOCH_2026):
        self.epoch = ref_epoch_timestamp

    def get_subsolar_coordinates(self, timestamp: float) -> Tuple[float, float]:
        """
        Computes sub-solar latitude (solar declination) and longitude on the Moon.
        Returns: (subsolar_lat_deg, subsolar_lon_deg)
        """
        days_since_epoch = (timestamp - self.epoch) / 86400.0
        
        # Subsolar latitude oscillates between -1.54° and +1.54° over the tropical year (365.25 days)
        # with secondary modulation by the 18.6-year nodal precession cycle
        solar_declination = LUNAR_OBLIQUITY_DEG * np.sin(2.0 * np.pi * days_since_epoch / 365.25 - 0.25)
        
        # Subsolar longitude advances eastward by 360° every synodic month (29.53 days)
        subsolar_lon = (180.0 + 360.0 * (days_since_epoch / SYNODIC_MONTH_DAYS)) % 360.0
        if subsolar_lon > 180.0:
            subsolar_lon -= 360.0

        return float(solar_declination), float(subsolar_lon)

    def get_subearth_coordinates(self, timestamp: float) -> Tuple[float, float]:
        """
        Computes optical and physical libration coordinates (sub-Earth point on Moon).
        Returns: (subearth_lat_deg, subearth_lon_deg)
        """
        days_since_epoch = (timestamp - self.epoch) / 86400.0
        
        # Longitudinal libration (optical + physical, governed by anomalistic cycle)
        lon_libration = LIBRATION_LON_MAX_DEG * np.sin(2.0 * np.pi * days_since_epoch / ANOMALISTIC_MONTH_DAYS + 0.85)
        
        # Latitudinal libration (governed by draconic cycle)
        lat_libration = LIBRATION_LAT_MAX_DEG * np.sin(2.0 * np.pi * days_since_epoch / DRACONIC_MONTH_DAYS + 1.42)
        
        return float(lat_libration), float(lon_libration)

    def calculate_topocentric_vector(
        self, 
        site_lat_deg: float, 
        site_lon_deg: float, 
        target_lat_deg: float, 
        target_lon_deg: float
    ) -> Tuple[float, float]:
        """
        Calculates local topocentric Azimuth and Elevation (degrees) of a celestial body
        (Sun or Earth) as viewed from a surface landing site (site_lat_deg, site_lon_deg).
        
        Azimuth: 0° = North, 90° = East, 180° = South, 270° = West
        Elevation: 0° = Local tangent plane (horizontal), +90° = Zenith, <0° = Below geometric horizon
        """
        lat1 = np.radians(site_lat_deg)
        lon1 = np.radians(site_lon_deg)
        lat2 = np.radians(target_lat_deg)
        lon2 = np.radians(target_lon_deg)
        
        dlon = lon2 - lon1
        
        # Spherical law of cosines for angular distance / elevation
        sin_elevation = np.sin(lat1) * np.sin(lat2) + np.cos(lat1) * np.cos(lat2) * np.cos(dlon)
        sin_elevation = np.clip(sin_elevation, -1.0, 1.0)
        elevation_rad = np.arcsin(sin_elevation)
        elevation_deg = np.degrees(elevation_rad)
        
        # Topocentric azimuth calculation
        y = np.sin(dlon) * np.cos(lat2)
        x = np.cos(lat1) * np.sin(lat2) - np.sin(lat1) * np.cos(lat2) * np.cos(dlon)
        azimuth_rad = np.arctan2(y, x)
        azimuth_deg = (np.degrees(azimuth_rad) + 360.0) % 360.0
        
        return float(azimuth_deg), float(elevation_deg)

    def get_solar_vector(self, site_lat: float, site_lon: float, timestamp: float) -> Tuple[float, float]:
        """Returns (azimuth_deg, elevation_deg) of the Sun at given site & time."""
        sub_lat, sub_lon = self.get_subsolar_coordinates(timestamp)
        return self.calculate_topocentric_vector(site_lat, site_lon, sub_lat, sub_lon)

    def get_earth_vector(self, site_lat: float, site_lon: float, timestamp: float) -> Tuple[float, float]:
        """Returns (azimuth_deg, elevation_deg) of the Earth at given site & time."""
        sub_lat, sub_lon = self.get_subearth_coordinates(timestamp)
        return self.calculate_topocentric_vector(site_lat, site_lon, sub_lat, sub_lon)
