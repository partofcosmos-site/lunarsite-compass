"""
LunarSite Compass — CLPS Mission Planning & Temporal Window Solver
Computes hour-by-hour solar illumination, Direct-to-Earth communication line-of-sight,
and dual-operational availability windows by evaluating ephemeris vectors against LOLA terrain masks.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Tuple

from engine.lunar_ephemeris import LunarEphemeris
from engine.lola_terrain import LOLATerrainEngine

class MissionWindowSolver:
    """Evaluates landing site feasibility over arbitrary temporal mission windows."""

    def __init__(self):
        self.ephemeris = LunarEphemeris()
        self.terrain = LOLATerrainEngine()

    def evaluate_site_window(
        self,
        site_id: str,
        site_name: str,
        lat_deg: float,
        lon_deg: float,
        start_date: datetime,
        duration_days: int = 30,
        step_hours: float = 1.0
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Evaluates a single site over duration_days at step_hours intervals.
        Returns:
            - DataFrame with time-series telemetry (sun_el, sun_az, earth_el, earth_az, lit, comm, dual)
            - Summary dictionary with mission metrics (longest windows, blackout risk, suitability score)
        """
        timestamps = []
        dt_list = []
        
        current_time = start_date
        end_time = start_date + timedelta(days=duration_days)
        step_delta = timedelta(hours=step_hours)
        
        while current_time < end_time:
            timestamps.append(current_time.timestamp())
            dt_list.append(current_time)
            current_time += step_delta

        records = []
        
        for dt, ts in zip(dt_list, timestamps):
            sun_az, sun_el = self.ephemeris.get_solar_vector(lat_deg, lon_deg, ts)
            earth_az, earth_el = self.ephemeris.get_earth_vector(lat_deg, lon_deg, ts)
            
            sun_horizon_el = self.terrain.get_horizon_elevation(site_id, sun_az)
            earth_horizon_el = self.terrain.get_horizon_elevation(site_id, earth_az)
            
            is_lit = bool(sun_el >= sun_horizon_el)
            has_comm = bool(earth_el >= earth_horizon_el)
            dual_op = is_lit and has_comm
            
            records.append({
                "datetime": dt,
                "timestamp": ts,
                "site_id": site_id,
                "sun_azimuth_deg": round(sun_az, 2),
                "sun_elevation_deg": round(sun_el, 2),
                "sun_horizon_deg": round(sun_horizon_el, 2),
                "earth_azimuth_deg": round(earth_az, 2),
                "earth_elevation_deg": round(earth_el, 2),
                "earth_horizon_deg": round(earth_horizon_el, 2),
                "is_illuminated": is_lit,
                "has_earth_comm": has_comm,
                "dual_operational": dual_op,
                "state": "Dual Operational" if dual_op else ("Sun Only" if is_lit else ("Comm Only" if has_comm else "Blackout"))
            })
            
        df = pd.DataFrame(records)
        metrics = self._calculate_mission_metrics(df, step_hours, duration_days)
        metrics["site_id"] = site_id
        metrics["site_name"] = site_name
        metrics["latitude"] = lat_deg
        metrics["longitude"] = lon_deg
        
        return df, metrics

    def _calculate_mission_metrics(self, df: pd.DataFrame, step_hours: float, duration_days: int) -> Dict[str, Any]:
        """Calculates uninterrupted window spans and operational fractions."""
        total_steps = len(df)
        if total_steps == 0:
            return {}

        lit_hours = df["is_illuminated"].sum() * step_hours
        comm_hours = df["has_earth_comm"].sum() * step_hours
        dual_hours = df["dual_operational"].sum() * step_hours
        blackout_hours = (df["state"] == "Blackout").sum() * step_hours

        # Compute max consecutive streaks
        max_lit_streak = self._max_consecutive(df["is_illuminated"].values) * step_hours
        max_comm_streak = self._max_consecutive(df["has_earth_comm"].values) * step_hours
        max_dual_streak = self._max_consecutive(df["dual_operational"].values) * step_hours
        max_dark_streak = self._max_consecutive((~df["is_illuminated"]).values) * step_hours

        total_hours = duration_days * 24.0
        illum_fraction = lit_hours / total_hours
        comm_fraction = comm_hours / total_hours
        dual_fraction = dual_hours / total_hours

        # Multi-attribute CLPS suitability index (0 to 100)
        # Weights: 40% dual operations, 30% illumination fraction, 20% comm fraction, 10% dark survival penalty
        score = (
            (dual_fraction * 40.0) +
            (illum_fraction * 30.0) +
            (comm_fraction * 20.0) -
            (min(1.0, max_dark_streak / (14.0 * 24.0)) * 10.0)
        )
        suitability_score = max(0.0, min(100.0, score + 10.0))

        return {
            "total_duration_days": duration_days,
            "total_hours": total_hours,
            "illumination_hours": round(lit_hours, 1),
            "illumination_percentage": round(illum_fraction * 100.0, 1),
            "max_continuous_illumination_hours": round(max_lit_streak, 1),
            "max_continuous_illumination_days": round(max_lit_streak / 24.0, 2),
            "comm_hours": round(comm_hours, 1),
            "comm_percentage": round(comm_fraction * 100.0, 1),
            "max_continuous_comm_hours": round(max_comm_streak, 1),
            "max_continuous_comm_days": round(max_comm_streak / 24.0, 2),
            "dual_operational_hours": round(dual_hours, 1),
            "dual_operational_percentage": round(dual_fraction * 100.0, 1),
            "max_continuous_dual_hours": round(max_dual_streak, 1),
            "max_continuous_dual_days": round(max_dual_streak / 24.0, 2),
            "max_continuous_night_hours": round(max_dark_streak, 1),
            "blackout_hours": round(blackout_hours, 1),
            "clps_suitability_score": round(suitability_score, 1)
        }

    @staticmethod
    def _max_consecutive(bool_array: np.ndarray) -> int:
        """Finds length of longest consecutive True run."""
        max_count = 0
        current_count = 0
        for val in bool_array:
            if val:
                current_count += 1
                if current_count > max_count:
                    max_count = current_count
            else:
                current_count = 0
        return max_count
