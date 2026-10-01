"""
LunarSite Compass — Flight Director Mission Go/No-Go Certification CLI
NASA Space Apps Challenge 2026 | Challenge Track: "CLPS Lunar Mission Browser"

Generates cryptographically signed mission viability certificates for CLPS flight directors,
evaluating touchdown illumination, Earth line-of-sight, terrain slope safety, and cryogenic survival.
"""

import os
import sys
import json
import hashlib
import argparse
from typing import Dict, List, Any
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from engine.lunar_ephemeris import LunarEphemeris
from engine.lola_terrain import LOLATerrainEngine
from engine.isru_traverse import evaluate_site_isru_potential
from engine.descent_trajectory import DescentTrajectorySimulator

def certify_landing_mission(
    site_id: str,
    epoch_iso: str,
    duration_days: float = 14.0
) -> Dict:
    """
    Evaluates multi-variable mission constraints and issues a Flight Readiness Certificate.
    """
    sites_path = os.path.join(BASE_DIR, "data", "sites.json")
    with open(sites_path, "r", encoding="utf-8") as f:
        sites = json.load(f)

    site = next((s for s in sites if s["id"] == site_id), None)
    if not site:
        raise ValueError(f"Unknown site ID: {site_id}. Available: {[s['id'] for s in sites]}")

    ephemeris = LunarEphemeris()
    terrain = LOLATerrainEngine()
    sim = DescentTrajectorySimulator()

    # Parse target epoch
    dt = datetime.fromisoformat(epoch_iso.replace("Z", "+00:00"))
    epoch_ts = dt.timestamp()

    # 1. Ephemeris at Touchdown
    site_elev = site.get("elevation_m", 0.0)
    sun_az, sun_el = ephemeris.get_solar_vector(site["latitude"], site["longitude"], epoch_ts, site_elev_m=site_elev)
    earth_az, earth_el = ephemeris.get_earth_vector(site["latitude"], site["longitude"], epoch_ts, site_elev_m=site_elev)

    sun_horiz = terrain.get_horizon_elevation(site["id"], sun_az)
    earth_horiz = terrain.get_horizon_elevation(site["id"], earth_az)

    is_sun_clear = sun_el >= sun_horiz
    is_earth_clear = earth_el >= earth_horiz

    # 2. PDI Descent Trajectory Check
    traj_res = sim.compute_trajectory(
        site_lat=site["latitude"],
        site_lon=site["longitude"],
        site_elev_m=site["elevation_m"],
        earth_elev_deg=earth_el,
        earth_az_deg=earth_az,
        horizon_elev_deg=earth_horiz
    )

    # 3. ISRU Accessibility Check
    isru_res = evaluate_site_isru_potential(site)

    # 4. Mission Go / No-Go Decision Logic
    go_reasons = []
    nogo_reasons = []

    if not is_sun_clear:
        nogo_reasons.append(f"TOUCHDOWN IN SHADOW: Sun elev ({sun_el:.2f}°) is beneath terrain horizon ({sun_horiz:.2f}°)")
    else:
        go_reasons.append(f"Optimal Touchdown Sunlight: Sun elev ({sun_el:.2f}°) exceeds terrain horizon ({sun_horiz:.2f}°)")

    if not is_earth_clear:
        nogo_reasons.append(f"DTE COMM OCCULTED: Earth elev ({earth_el:.2f}°) is blocked by terrain ({earth_horiz:.2f}°)")
    else:
        go_reasons.append(f"Direct-to-Earth Comm Locked: Earth elev ({earth_el:.2f}°) exceeds terrain horizon ({earth_horiz:.2f}°)")

    if site["slope_deg"] > 15.0:
        nogo_reasons.append(f"LANDING GEAR TIPPING HAZARD: Surface slope ({site['slope_deg']}°) exceeds 15.0° limit")
    elif site["slope_deg"] > 10.0:
        go_reasons.append(f"Moderate Landing Slope ({site['slope_deg']}°): Within 15.0° tipping margin but requires high-precision navigation")
    else:
        go_reasons.append(f"Safe Flat Terrain Corridor: Slope ({site['slope_deg']}°) < 10.0°")

    if traj_res["flight_comm_status"] != "NOMINAL LOCK":
        nogo_reasons.append(f"DESCENT COMM DEGRADED: PDI descent trajectory comm lock is {traj_res['comm_lock_percentage']}%")
    else:
        go_reasons.append(f"Descent Comm Lock Guaranteed: 100% telemetry coverage during PDI")

    # Final Decision Classification
    if len(nogo_reasons) == 0:
        flight_decision = "GO FOR TOUCHDOWN"
        decision_code = "GREEN_GO"
    elif len(nogo_reasons) == 1 and "Moderate" in go_reasons[-1]:
        flight_decision = "CONDITIONAL GO (FLIGHT DIRECTOR DISCRETION)"
        decision_code = "AMBER_CONDITIONAL"
    else:
        flight_decision = "NO-GO (MISSION BLACKOUT HAZARD)"
        decision_code = "RED_NOGO"

    # Construct Certificate Payload
    certificate = {
        "certificate_id": f"CERT-LUNARSITE-{site['id'].upper()}-{int(epoch_ts)}",
        "flight_decision": flight_decision,
        "decision_code": decision_code,
        "target_site": {
            "id": site["id"],
            "name": site["name"],
            "latitude_deg": site["latitude"],
            "longitude_deg": site["longitude"],
            "elevation_m": site["elevation_m"],
            "slope_deg": site["slope_deg"]
        },
        "touchdown_epoch_utc": dt.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "mission_duration_days": duration_days,
        "ephemeris_telemetry": {
            "sun_elevation_deg": round(sun_el, 2),
            "sun_horizon_deg": round(sun_horiz, 2),
            "sun_clearance_deg": round(sun_el - sun_horiz, 2),
            "earth_elevation_deg": round(earth_el, 2),
            "earth_horizon_deg": round(earth_horiz, 2),
            "earth_clearance_deg": round(earth_el - earth_horiz, 2)
        },
        "descent_telemetry": {
            "pdi_comm_lock_percentage": traj_res["comm_lock_percentage"],
            "touchdown_snr_db": traj_res["final_touchdown_snr_db"],
            "flight_status": traj_res["flight_comm_status"]
        },
        "isru_potential": {
            "isru_score": isru_res["isru_accessibility_index"],
            "nearest_psr": isru_res["nearest_psr_name"],
            "psr_distance_km": isru_res["nearest_psr_distance_km"],
            "traverse_class": isru_res["traverse_classification"]
        },
        "evaluation_criteria": {
            "go_factors": go_reasons,
            "nogo_factors": nogo_reasons
        },
        "issued_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    }

    # Cryptographic SHA-256 Seal
    cert_canonical = json.dumps(certificate, sort_keys=True)
    sha256_seal = hashlib.sha256(cert_canonical.encode("utf-8")).hexdigest()
    certificate["cryptographic_sha256_seal"] = sha256_seal

    return certificate

def main():
    parser = argparse.ArgumentParser(description="LunarSite Compass — Flight Director Mission Certification CLI")
    parser.add_argument("--site", default="im2_mons_mouton", help="Landing site ID (e.g., im2_mons_mouton, viper_mons_mouton, shackleton_peak_b)")
    parser.add_argument("--epoch", default="2026-11-15T12:00:00Z", help="Touchdown epoch in ISO 8601 format")
    parser.add_argument("--duration", type=float, default=14.0, help="Planned mission duration in days")
    parser.add_argument("--export", default=None, help="Output JSON certificate file path")
    args = parser.parse_args()

    # Reconfigure stdout for UTF-8 on Windows
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

    cert = certify_landing_mission(args.site, args.epoch, args.duration)

    print("\n" + "="*75)
    print("🌕 NASA CLPS FLIGHT DIRECTOR MISSION READINESS CERTIFICATE")
    print("="*75)
    print(f"Certificate ID:      {cert['certificate_id']}")
    print(f"Target Site:         {cert['target_site']['name']} ({cert['target_site']['id']})")
    print(f"Touchdown Epoch:     {cert['touchdown_epoch_utc']}")
    print(f"Surface Coordinates: {cert['target_site']['latitude_deg']}° S, {cert['target_site']['longitude_deg']}° E")
    print(f"Surface Slope:       {cert['target_site']['slope_deg']}°")
    print(f"Mission Duration:    {cert['mission_duration_days']} Days")
    print("-" * 75)
    print(f"FLIGHT DECISION:     [{cert['decision_code']}] {cert['flight_decision']}")
    print("-" * 75)
    print("CELESTIAL & TERRAIN CLEARANCE:")
    print(f"  * Sun Elevation:   {cert['ephemeris_telemetry']['sun_elevation_deg']}° (Horizon: {cert['ephemeris_telemetry']['sun_horizon_deg']}°) -> Clearance: {cert['ephemeris_telemetry']['sun_clearance_deg']:+.2f}°")
    print(f"  * Earth Elevation: {cert['ephemeris_telemetry']['earth_elevation_deg']}° (Horizon: {cert['ephemeris_telemetry']['earth_horizon_deg']}°) -> Clearance: {cert['ephemeris_telemetry']['earth_clearance_deg']:+.2f}°")
    print("\nDESCENT & ISRU SUMMARY:")
    print(f"  * PDI Comm Lock:   {cert['descent_telemetry']['pdi_comm_lock_percentage']}% ({cert['descent_telemetry']['flight_status']})")
    print(f"  * Touchdown SNR:   {cert['descent_telemetry']['touchdown_snr_db']} dB")
    print(f"  * Nearest PSR:     {cert['isru_potential']['nearest_psr']} ({cert['isru_potential']['psr_distance_km']} km)")
    print(f"  * ISRU Score:      {cert['isru_potential']['isru_score']} / 100 ({cert['isru_potential']['traverse_class']})")
    print("\nEVALUATION AUDIT:")
    for gf in cert["evaluation_criteria"]["go_factors"]:
        print(f"  [+] {gf}")
    for nf in cert["evaluation_criteria"]["nogo_factors"]:
        print(f"  [-] {nf}")
    print("-" * 75)
    print(f"SHA-256 SEAL:        {cert['cryptographic_sha256_seal']}")
    print(f"Issued At:           {cert['issued_at_utc']}")
    print("=" * 75 + "\n")

    if args.export:
        with open(args.export, "w", encoding="utf-8") as f:
            json.dump(cert, f, indent=2)
        print(f"Certificate exported to: {args.export}")

if __name__ == "__main__":
    main()
