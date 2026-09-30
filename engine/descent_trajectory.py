"""
LunarSite Compass — Powered Descent Initiation (PDI) & Flight Dynamics Engine
Models lunar lander descent trajectories from 15 km altitude PDI to touchdown,
computing topocentric terrain horizon clearance, DSN X-band Doppler shift,
and Direct-to-Earth (DTE) signal link margin.
"""

import numpy as np
from typing import Dict, List, Tuple

SPEED_OF_LIGHT_MS = 299792458.0
X_BAND_FREQ_HZ = 8.4e9  # 8.4 GHz NASA DSN carrier frequency
LUNAR_RADIUS_M = 1737400.0

class DescentTrajectorySimulator:
    """
    Simulates powered descent from PDI (15 km alt, ~1690 m/s) to touchdown (0 m, 1 m/s)
    over a nominal 720-second burn duration.
    """

    def __init__(self, pdi_alt_m: float = 15000.0, pdi_vel_ms: float = 1690.0, burn_time_s: float = 720.0):
        self.pdi_alt_m = pdi_alt_m
        self.pdi_vel_ms = pdi_vel_ms
        self.burn_time_s = burn_time_s

    def compute_trajectory(
        self,
        site_lat: float,
        site_lon: float,
        site_elev_m: float,
        earth_elev_deg: float,
        earth_az_deg: float,
        horizon_elev_deg: float,
        step_s: float = 10.0
    ) -> Dict:
        """
        Simulates the descent profile and evaluates DTE communications link margin
        and Doppler dynamics.
        """
        times = np.arange(0, self.burn_time_s + step_s, step_s)
        n_steps = len(times)

        # Non-linear deceleration and descent profiles
        normalized_time = times / self.burn_time_s
        altitudes = self.pdi_alt_m * (1.0 - normalized_time)**2.1
        velocities = self.pdi_vel_ms * (1.0 - normalized_time)**1.5 + 1.0  # Touchdown at 1 m/s

        # Ground downrange distance to touchdown (km)
        downrange_m = (self.pdi_vel_ms * self.burn_time_s / 2.5) * (1.0 - normalized_time)**2
        downrange_km = downrange_m / 1000.0

        # Effective horizon elevation from spacecraft vantage point:
        # At high altitude, horizon drops due to geometric dip: dip = sqrt(2*h/R)
        # As altitude -> 0, horizon approaches terrain obstacle angle H(phi)
        geometric_dip_deg = np.degrees(np.sqrt(2.0 * np.maximum(altitudes, 0.0) / LUNAR_RADIUS_M))
        effective_horizon_deg = horizon_elev_deg - geometric_dip_deg

        # DTE Line-of-sight elevation clearance
        clearance_deg = earth_elev_deg - effective_horizon_deg
        is_los_clear = clearance_deg >= 0.0

        # Doppler velocity along Earth line-of-sight vector
        # Projected radial velocity assuming approach along Earth azimuth
        approach_angle_rad = np.radians(abs(earth_az_deg - 180.0) % 90.0)
        radial_velocity_ms = velocities * np.cos(approach_angle_rad) * (1.0 - normalized_time)
        doppler_shift_khz = (radial_velocity_ms / SPEED_OF_LIGHT_MS) * X_BAND_FREQ_HZ / 1000.0

        # DSN X-Band RF Link Budget (dB)
        # Nominal PDI carrier SNR margin ~ 14.5 dB
        # Atmospheric/pointing loss ~ 1.5 dB
        base_snr_margin_db = 14.5 - 2.5 * normalized_time
        link_margins_db = np.where(is_los_clear, base_snr_margin_db, -30.0)  # -30 dB blackout

        # Aggregate metrics
        comm_lock_percentage = float(100.0 * np.sum(is_los_clear) / n_steps)
        final_touchdown_snr = float(link_margins_db[-1])
        min_clearance_deg = float(np.min(clearance_deg))

        # Time series records
        records = []
        for i, t in enumerate(times):
            records.append({
                "time_s": int(t),
                "altitude_m": round(float(altitudes[i]), 1),
                "velocity_ms": round(float(velocities[i]), 1),
                "downrange_km": round(float(downrange_km[i]), 2),
                "earth_clearance_deg": round(float(clearance_deg[i]), 2),
                "dte_link_margin_db": round(float(link_margins_db[i]), 1),
                "doppler_shift_khz": round(float(doppler_shift_khz[i]), 2),
                "is_comm_locked": bool(is_los_clear[i])
            })

        status = "NOMINAL LOCK" if comm_lock_percentage >= 95.0 else ("DEGRADED" if comm_lock_percentage >= 75.0 else "BLACKOUT HAZARD")

        return {
            "site_lat": site_lat,
            "site_lon": site_lon,
            "site_elevation_m": site_elev_m,
            "burn_duration_s": self.burn_time_s,
            "comm_lock_percentage": round(comm_lock_percentage, 1),
            "final_touchdown_snr_db": round(final_touchdown_snr, 1),
            "min_elevation_clearance_deg": round(min_clearance_deg, 2),
            "flight_comm_status": status,
            "profile_steps": records
        }
