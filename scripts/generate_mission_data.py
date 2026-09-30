"""
LunarSite Compass — Benchmark Mission Data Generator
Runs the complete temporal solver across all candidate lunar sites for the 
Artemis/CLPS November 2026 window, producing pre-computed telemetry CSV and summary JSON.
"""

import os
import sys

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import json
import pandas as pd
from datetime import datetime, timezone

from engine.mission_solver import MissionWindowSolver

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sites_path = os.path.join(base_dir, "data", "sites.json")
    
    with open(sites_path, "r", encoding="utf-8") as f:
        sites = json.load(f)

    # Mission evaluation window: November 1, 2026 to December 1, 2026 (30 days)
    # Corresponding to the official NASA Space Apps hackathon timeframe
    start_date = datetime(2026, 11, 1, 0, 0, 0, tzinfo=timezone.utc)
    duration_days = 30
    step_hours = 1.0

    solver = MissionWindowSolver()
    
    all_telemetry_dfs = []
    summaries = []

    print("==================================================================")
    print("   LUNARSITE COMPASS — COMPUTING TEMPORAL MISSION MATRICES")
    print(f"   Window: {start_date.strftime('%Y-%m-%d')} | Duration: {duration_days} days")
    print("==================================================================")

    for s in sites:
        site_id = s["id"]
        site_name = s["name"]
        lat = s["latitude"]
        lon = s["longitude"]
        
        print(f"[*] Solving site: {site_name} (Lat: {lat}°, Lon: {lon}°)...")
        df, metrics = solver.evaluate_site_window(
            site_id=site_id,
            site_name=site_name,
            lat_deg=lat,
            lon_deg=lon,
            start_date=start_date,
            duration_days=duration_days,
            step_hours=step_hours
        )
        
        metrics["slope_deg"] = s["slope_deg"]
        metrics["elevation_m"] = s["elevation_m"]
        metrics["mission_context"] = s["mission_context"]
        
        all_telemetry_dfs.append(df)
        summaries.append(metrics)
        
        print(f"    -> Illumination: {metrics['illumination_percentage']}% | Comm: {metrics['comm_percentage']}% | Dual Op: {metrics['dual_operational_percentage']}%")
        print(f"    -> Max Continuous Sun: {metrics['max_continuous_illumination_days']}d | Max Continuous Comm: {metrics['max_continuous_comm_days']}d")
        print(f"    -> CLPS Suitability Score: {metrics['clps_suitability_score']}/100")

    combined_df = pd.concat(all_telemetry_dfs, ignore_index=True)
    
    csv_out = os.path.join(base_dir, "data", "mission_telemetry_2026.csv")
    json_out = os.path.join(base_dir, "data", "mission_summary_matrix.json")
    
    combined_df.to_csv(csv_out, index=False)
    with open(json_out, "w", encoding="utf-8") as f:
        json.dump(summaries, f, indent=2)

    print("\n[OK] Generated pre-computed datasets:")
    print(f"     - Telemetry CSV: {csv_out} ({len(combined_df)} records)")
    print(f"     - Summary JSON:  {json_out} ({len(summaries)} sites)")

if __name__ == "__main__":
    main()
