"""
LunarSite Compass — Generate ISRU Volatile & Rover Traverse Dataset
"""

import os
import sys
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from engine.isru_traverse import run_isru_analysis_all_sites

def main():
    sites_path = os.path.join(BASE_DIR, "data", "sites.json")
    out_path = os.path.join(BASE_DIR, "data", "sites_isru_analysis.json")

    with open(sites_path, "r", encoding="utf-8") as f:
        sites = json.load(f)

    isru_results = run_isru_analysis_all_sites(sites)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(isru_results, f, indent=2)

    print(f"Generated ISRU analysis for {len(isru_results)} sites:")
    for r in isru_results:
        print(f"  * {r['site_name'][:30]:30s} | Score: {r['isru_accessibility_index']:4.1f} | Nearest: {r['nearest_psr_name'][:25]:25s} ({r['nearest_psr_distance_km']:5.1f} km) | {r['traverse_classification']}")

if __name__ == "__main__":
    main()
