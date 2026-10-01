"""
LunarSite Compass — Four-Season Climate & Illumination Stress Test
Simulates all 8 South Pole landing candidate sites across 4 cardinal solar seasons:
1. Southern Summer Solstice (Dec 2026) - Maximum solar elevation & peak sunlight
2. Autumnal Equinox (Mar 2027) - Transition geometry
3. Southern Winter Solstice (Jun 2027) - Deep polar night & extreme shadow conditions
4. Spring Equinox (Sep 2027) - Transition geometry
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import json
import pandas as pd
from datetime import datetime, timezone
from engine.mission_solver import MissionWindowSolver

def run_seasonal_test():
    sites_path = os.path.join(BASE_DIR, "data", "sites.json")
    with open(sites_path, "r", encoding="utf-8") as f:
        sites = json.load(f)

    seasons = [
        ("Southern Summer Solstice", datetime(2026, 12, 1, 0, 0, 0, tzinfo=timezone.utc), 14),
        ("Autumnal Equinox", datetime(2027, 3, 1, 0, 0, 0, tzinfo=timezone.utc), 14),
        ("Southern Winter Solstice", datetime(2027, 6, 1, 0, 0, 0, tzinfo=timezone.utc), 14),
        ("Spring Equinox", datetime(2027, 9, 1, 0, 0, 0, tzinfo=timezone.utc), 14)
    ]

    solver = MissionWindowSolver()
    seasonal_results = []

    print("==================================================================")
    print("   LUNARSITE COMPASS — FOUR-SEASON ORBITAL STRESS TEST RUN")
    print("==================================================================")

    for season_name, start_dt, duration in seasons:
        print(f"\n[*] Evaluating Season: {season_name} ({start_dt.strftime('%Y-%m-%d')}, {duration} days)...")
        for s in sites:
            site_id = s["id"]
            site_name = s["name"]
            lat = s["latitude"]
            lon = s["longitude"]
            elev = s.get("elevation_m", 0.0)

            df, metrics = solver.evaluate_site_window(
                site_id=site_id,
                site_name=site_name,
                lat_deg=lat,
                lon_deg=lon,
                start_date=start_dt,
                duration_days=duration,
                step_hours=1.0,
                site_elev_m=elev
            )

            metrics["season"] = season_name
            metrics["slope_deg"] = s["slope_deg"]
            seasonal_results.append(metrics)
            print(f"    - {site_name[:32]:32} | Sun: {metrics['illumination_percentage']:5.1f}% | Comm: {metrics['comm_percentage']:5.1f}% | Dual: {metrics['dual_operational_percentage']:5.1f}%")

    out_file = os.path.join(BASE_DIR, "data", "seasonal_benchmark_analysis.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(seasonal_results, f, indent=2)

    print(f"\n[OK] Completed 4-season stress test across {len(sites)} sites. Exported to {out_file}")
    return seasonal_results

if __name__ == "__main__":
    run_seasonal_test()
