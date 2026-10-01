"""
Export LunarSite Compass datasets to web/data/ for Next.js frontend
"""
import os
import json
import pandas as pd

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    web_data_dir = os.path.join(base_dir, "web", "data")
    os.makedirs(web_data_dir, exist_ok=True)

    # 1. Copy sites.json
    with open(os.path.join(data_dir, "sites.json"), "r", encoding="utf-8") as f:
        sites = json.load(f)
    with open(os.path.join(web_data_dir, "sites.json"), "w", encoding="utf-8") as f:
        json.dump(sites, f, indent=2)

    # 2. Copy mission_summary_matrix.json
    with open(os.path.join(data_dir, "mission_summary_matrix.json"), "r", encoding="utf-8") as f:
        summaries = json.load(f)
    with open(os.path.join(web_data_dir, "mission_summary_matrix.json"), "w", encoding="utf-8") as f:
        json.dump(summaries, f, indent=2)

    # 3. Copy seasonal_benchmark_analysis.json
    with open(os.path.join(data_dir, "seasonal_benchmark_analysis.json"), "r", encoding="utf-8") as f:
        seasons = json.load(f)
    with open(os.path.join(web_data_dir, "seasonal_benchmark_analysis.json"), "w", encoding="utf-8") as f:
        json.dump(seasons, f, indent=2)

    # 4. Copy sites_isru_analysis.json
    with open(os.path.join(data_dir, "sites_isru_analysis.json"), "r", encoding="utf-8") as f:
        isru = json.load(f)
    with open(os.path.join(web_data_dir, "sites_isru_analysis.json"), "w", encoding="utf-8") as f:
        json.dump(isru, f, indent=2)

    # 5. Process mission_telemetry_2026.csv into per-site grouped JSON
    csv_path = os.path.join(data_dir, "mission_telemetry_2026.csv")
    df = pd.read_csv(csv_path)

    # Round numeric columns to save space while maintaining high precision
    telemetry_by_site = {}
    unique_epochs = []
    
    for site_id, group in df.groupby("site_id"):
        records = []
        for _, row in group.iterrows():
            records.append({
                "dt": row["datetime"],
                "t": int(row["timestamp"]),
                "sAz": round(float(row["sun_azimuth_deg"]), 2),
                "sEl": round(float(row["sun_elevation_deg"]), 2),
                "sHz": round(float(row["sun_horizon_deg"]), 2),
                "eAz": round(float(row["earth_azimuth_deg"]), 2),
                "eEl": round(float(row["earth_elevation_deg"]), 2),
                "eHz": round(float(row["earth_horizon_deg"]), 2),
                "sun": bool(row["is_illuminated"]),
                "comm": bool(row["has_earth_comm"]),
                "dual": bool(row["dual_operational"]),
                "state": row["state"]
            })
        telemetry_by_site[site_id] = records

    # Save compact telemetry
    with open(os.path.join(web_data_dir, "telemetry_by_site.json"), "w", encoding="utf-8") as f:
        json.dump(telemetry_by_site, f)

    # Also build a lightweight epoch slice index for scrubbing across all sites (at 1h intervals)
    epochs_data = []
    epoch_groups = df.groupby("datetime")
    for dt, group in epoch_groups:
        states = {}
        for _, r in group.iterrows():
            states[r["site_id"]] = {
                "st": r["state"],
                "sEl": round(float(r["sun_elevation_deg"]), 2),
                "eEl": round(float(r["earth_elevation_deg"]), 2),
                "sAz": round(float(r["sun_azimuth_deg"]), 2),
                "eAz": round(float(r["earth_azimuth_deg"]), 2)
            }
        epochs_data.append({
            "dt": dt,
            "t": int(group.iloc[0]["timestamp"]),
            "sites": states
        })
        
    with open(os.path.join(web_data_dir, "timeline_epochs.json"), "w", encoding="utf-8") as f:
        json.dump(epochs_data, f)

    print(f"Data export complete! Files created in {web_data_dir}:")
    for fname in os.listdir(web_data_dir):
        fsize = os.path.getsize(os.path.join(web_data_dir, fname)) / 1024
        print(f"  - {fname}: {fsize:.1f} KB")

if __name__ == "__main__":
    main()
