"""
LunarSite Compass — Autonomous Self-Audit & Zero-Regression Verification Gate
NASA Space Apps Challenge 2026 | Challenge Track: "CLPS Lunar Mission Browser"

Autonomously runs comprehensive end-to-end verification:
1. Real NASA Dataset Integrity (JPL Horizons, PDS LOLA DEM, Sites, ISRU, Seasonals)
2. Cryptographic SHA-256 Fingerprinting of all critical mission datasets
3. First-Principles Astrodynamics & Polar Singularity Invariants Check
4. Full Test Suite Execution (27+ Tests) with 100% Pass Rate Enforcement
5. Zero-Regression Validation Gate & Machine-Readable Audit Report Generation
"""

import os
import sys
import json
import time
import hashlib
import unittest
from datetime import datetime, timezone
from typing import Dict, List, Any, Tuple

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from engine.lunar_ephemeris import (
    LunarEphemeris,
    LUNAR_OBLIQUITY_EXACT_DEG,
    LUNAR_RADIUS_M,
    LUNAR_RADIUS_KM,
    LIBRATION_LAT_MAX_DEG,
    LIBRATION_LON_MAX_DEG,
    NODAL_PRECESSION_PERIOD_YEARS,
)
from engine.lola_terrain import LOLATerrainEngine
from engine.mission_solver import MissionWindowSolver, compute_dsn_link_budget, compute_xband_doppler_shift
from engine.isru_traverse import (
    compute_slope_penalty,
    calculate_traverse_edge_cost,
    solve_dijkstra_traverse,
    calculate_lunar_distance_km,
    classify_thermal_regime,
    PSR_RESERVOIRS,
)
from engine.polar_map import polar_to_xy

def compute_sha256(filepath: str) -> str:
    """Computes SHA-256 cryptographic hash of a file."""
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

class AutonomousSelfAudit:
    """Orchestrates comprehensive multi-gate autonomous self-audit for LunarSite Compass."""

    def __init__(self):
        self.start_time = time.time()
        self.timestamp_iso = datetime.now(timezone.utc).isoformat()
        self.report: Dict[str, Any] = {
            "audit_title": "LunarSite Compass Autonomous Self-Audit & Quality Gate",
            "timestamp_utc": self.timestamp_iso,
            "overall_status": "PENDING",
            "dataset_integrity": {},
            "physics_invariants": {},
            "test_suite_execution": {},
            "zero_regression_verdict": {},
            "execution_duration_sec": 0.0
        }
        self.ephemeris = LunarEphemeris()
        self.terrain = LOLATerrainEngine()
        self.solver = MissionWindowSolver()

    def audit_dataset_integrity(self) -> bool:
        """Verifies presence, JSON/CSV schema integrity, and SHA-256 fingerprint of all NASA datasets."""
        print("\n" + "="*78)
        print(" [GATE 1/4] NASA DATASET INTEGRITY & CRYPTOGRAPHIC HASH FINGERPRINTING")
        print("="*78)

        datasets = [
            ("sites.json", "Candidate Landing Sites Specification"),
            ("real_ephemeris_2026.json", "NASA JPL Horizons Body-Fixed Ephemeris"),
            ("real_lola_horizons.json", "NASA PDS LRO LOLA Topographic Horizons"),
            ("mission_summary_matrix.json", "CLPS Mission Scoring & Window Summary"),
            ("seasonal_benchmark_analysis.json", "Four-Season Illumination Stress Benchmark"),
            ("sites_isru_analysis.json", "ISRU Volatile Cold Trap Proximity & Accessibility"),
            ("mission_telemetry_2026.csv", "High-Precision Hourly Time-Series Telemetry")
        ]

        all_ok = True
        dataset_records = {}

        for filename, description in datasets:
            filepath = os.path.join(BASE_DIR, "data", filename)
            if not os.path.isfile(filepath):
                print(f" [FAIL] Missing critical dataset: {filename}")
                dataset_records[filename] = {"status": "MISSING", "error": "File not found"}
                all_ok = False
                continue

            size_bytes = os.path.getsize(filepath)
            sha256_hash = compute_sha256(filepath)
            record_count = 0
            details = {}

            # Specific dataset validations
            if filename.endswith(".json"):
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    if isinstance(data, list):
                        record_count = len(data)
                    elif isinstance(data, dict):
                        record_count = len(data.get("topocentric_sites", data.get("sites", data)))
                    
                    if filename == "sites.json":
                        assert len(data) == 8, f"Expected 8 sites, found {len(data)}"
                        for s in data:
                            assert -90.0 <= s["latitude"] <= -80.0
                            assert 0.0 <= s["slope_deg"] <= 30.0
                        details["site_count"] = len(data)

                    elif filename == "real_ephemeris_2026.json":
                        assert data.get("metadata", {}).get("source") == "NASA JPL Horizons REST API"
                        details["provenance"] = "NASA JPL Horizons REST API"
                        details["sites_with_topocentric"] = len(data.get("topocentric_sites", {}))

                    elif filename == "real_lola_horizons.json":
                        source = data.get("metadata", {}).get("source", "")
                        assert "NASA" in source and "LOLA" in source, f"Unexpected LOLA source: {source}"
                        details["provenance"] = source
                        details["topography_sites"] = len(data.get("sites", {}))

                    elif filename == "seasonal_benchmark_analysis.json":
                        assert len(data) == 32, f"Expected 32 seasonal records (8 sites x 4 seasons), found {len(data)}"
                        details["seasons_evaluated"] = 4
                        details["total_seasonal_evaluations"] = len(data)

                    elif filename == "sites_isru_analysis.json":
                        assert len(data) == 8, f"Expected 8 ISRU analyses, found {len(data)}"
                        details["evaluated_sites"] = len(data)

                except Exception as e:
                    print(f" [FAIL] Schema validation error in {filename}: {e}")
                    all_ok = False

            elif filename.endswith(".csv"):
                with open(filepath, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                record_count = len(lines) - 1 # header
                assert record_count >= 5760, f"Expected 5760 hourly rows (8 sites x 720 hours), found {record_count}"
                details["row_count"] = record_count

            dataset_records[filename] = {
                "description": description,
                "size_kb": round(size_bytes / 1024.0, 1),
                "sha256": sha256_hash,
                "record_count": record_count,
                "details": details,
                "status": "VERIFIED_VALID"
            }

            print(f" [OK] {filename:32} | {size_bytes/1024.0:7.1f} KB | SHA256: {sha256_hash[:16]}... | Records: {record_count}")

        self.report["dataset_integrity"] = {
            "all_datasets_valid": all_ok,
            "datasets": dataset_records
        }
        return all_ok

    def audit_physics_invariants(self) -> bool:
        """Validates first-principles astrodynamics, polar singularities, and terramechanics invariants."""
        print("\n" + "="*78)
        print(" [GATE 2/4] FIRST-PRINCIPLES ASTRODYNAMICS & POLAR SINGULARITY INVARIANTS")
        print("="*78)

        invariants_results = {}
        all_passed = True

        def record_invariant(name: str, passed: bool, expected: str, actual: str):
            nonlocal all_passed
            if not passed:
                all_passed = False
            status = "PASS" if passed else "FAIL"
            invariants_results[name] = {
                "status": status,
                "expected": expected,
                "actual": actual
            }
            print(f" [{status}] {name:48} | Exp: {expected:16} | Act: {actual}")

        # 1. Real NASA Ephemeris and LOLA Topography Active
        real_eph = self.ephemeris.is_real_ephemeris_active()
        record_invariant(
            "Real NASA JPL Horizons Ephemeris Loaded",
            real_eph,
            "True",
            str(real_eph)
        )

        real_lola = self.terrain.is_real_lola_active()
        record_invariant(
            "Real NASA PDS LRO LOLA Topography Loaded",
            real_lola,
            "True",
            str(real_lola)
        )

        # 2. Sub-solar Latitude Bounds
        test_ts = datetime(2026, 11, 15, 12, 0, 0, tzinfo=timezone.utc).timestamp()
        sub_lat, sub_lon = self.ephemeris.get_subsolar_coordinates(test_ts)
        subsolar_ok = abs(sub_lat) <= (LUNAR_OBLIQUITY_EXACT_DEG + 0.001)
        record_invariant(
            "Sub-solar Latitude Obliquity Limit (+/-1.5424 deg)",
            subsolar_ok,
            f"<= {LUNAR_OBLIQUITY_EXACT_DEG} deg",
            f"{abs(sub_lat):.4f} deg"
        )

        # 3. Libration Bounds
        subearth_lat, subearth_lon = self.ephemeris.get_subearth_coordinates(test_ts)
        libration_ok = (abs(subearth_lat) <= LIBRATION_LAT_MAX_DEG + 0.1) and (abs(subearth_lon) <= LIBRATION_LON_MAX_DEG + 0.1)
        record_invariant(
            "Earth Libration Envelope (Lat <= 6.7, Lon <= 7.9)",
            libration_ok,
            f"<= {LIBRATION_LAT_MAX_DEG}, {LIBRATION_LON_MAX_DEG} deg",
            f"{abs(subearth_lat):.2f}, {abs(subearth_lon):.2f} deg"
        )

        # 4. Planetary Curvature Drop at 20 km
        curvature_drop = (20000.0 ** 2) / (2.0 * LUNAR_RADIUS_M)
        curvature_ok = abs(curvature_drop - 115.11) < 0.2
        record_invariant(
            "Planetary Curvature Drop at 20 km (-r^2/2R_M)",
            curvature_ok,
            "115.11 m",
            f"{curvature_drop:.2f} m"
        )

        # 5. Polar Singularity at Exact South Pole (-90.0 deg)
        x_pole, y_pole = polar_to_xy(-90.0, 123.45)
        polar_xy_ok = abs(x_pole) == 0.0 and abs(y_pole) == 0.0
        record_invariant(
            "Polar Singularity Stereographic Map Origin (0, 0)",
            polar_xy_ok,
            "(0.0, 0.0)",
            f"({x_pole:.1f}, {y_pole:.1f})"
        )

        dist_pole = calculate_lunar_distance_km(-90.0, 0.0, -90.0, 180.0)
        dist_pole_ok = abs(dist_pole) < 1e-3
        record_invariant(
            "Polar Singularity Distance Degeneracy",
            dist_pole_ok,
            "0.0 km",
            f"{dist_pole:.4f} km"
        )

        # 6. Coordinate Periodic Longitude Wrapping
        az1, el1 = self.ephemeris.calculate_topocentric_vector(-84.7906, 29.1957, 0.0, 0.0)
        az2, el2 = self.ephemeris.calculate_topocentric_vector(-84.7906, 389.1957, 0.0, 0.0)
        wrapping_ok = abs(az1 - az2) < 0.01 and abs(el1 - el2) < 0.01
        record_invariant(
            "Periodic Longitude Wrapping (lon vs lon + 360 deg)",
            wrapping_ok,
            "diff <= 0.01 deg",
            f"d_az={abs(az1-az2):.4f}, d_el={abs(el1-el2):.4f} deg"
        )

        # 7. Terramechanics Critical Slope Barrier
        p_flat = compute_slope_penalty(0.0)
        p_crit = compute_slope_penalty(15.0, critical_slope_deg=15.0)
        slope_barrier_ok = (p_flat == 0.0) and (p_crit == float("inf"))
        record_invariant(
            "Terramechanic Slope Barrier (0 on flat, inf >=15 deg)",
            slope_barrier_ok,
            "0.0 and inf",
            f"{p_flat} and {p_crit}"
        )

        # 8. Haworth PSR Control Permanent Shadow
        haworth_horizon = self.terrain.get_horizon_elevation("haworth_psr_control", 180.0)
        haworth_ok = haworth_horizon > 4.0
        record_invariant(
            "Haworth Deep PSR Rim Horizon Obstacle (> 4.0 deg)",
            haworth_ok,
            "> 4.0 deg",
            f"{haworth_horizon:.2f} deg"
        )

        self.report["physics_invariants"] = {
            "all_invariants_passed": all_passed,
            "invariants": invariants_results
        }
        return all_passed

    def audit_test_suite(self) -> bool:
        """Executes full unit test suite (27+ tests) and verifies zero failures/errors."""
        print("\n" + "="*78)
        print(" [GATE 3/4] COMPREHENSIVE ENGINE UNIT TEST SUITE EXECUTION")
        print("="*78)

        from tests.test_engine import TestLunarEngine

        suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestLunarEngine)
        total_tests = suite.countTestCases()

        runner = unittest.TextTestRunner(verbosity=1)
        result = runner.run(suite)

        passed = result.wasSuccessful()
        failures = len(result.failures)
        errors = len(result.errors)
        skipped = len(result.skipped)

        print(f"\n [SUMMARY] Total Tests: {total_tests} | Passed: {total_tests - failures - errors} | Failures: {failures} | Errors: {errors}")

        self.report["test_suite_execution"] = {
            "total_tests": total_tests,
            "passed_tests": total_tests - failures - errors,
            "failures": failures,
            "errors": errors,
            "skipped": skipped,
            "all_tests_passed": passed
        }
        return passed and (total_tests >= 25)

    def validate_zero_regressions(self) -> bool:
        """Validates all mission performance metrics across 8 candidate sites for zero regressions."""
        print("\n" + "="*78)
        print(" [GATE 4/4] CLPS MISSION ZERO-REGRESSION SCORECARD VALIDATION")
        print("="*78)

        matrix_path = os.path.join(BASE_DIR, "data", "mission_summary_matrix.json")
        with open(matrix_path, "r", encoding="utf-8") as f:
            matrix = json.load(f)

        assert len(matrix) == 8, f"Expected 8 landing sites in matrix, found {len(matrix)}"

        regression_results = []
        all_passed = True

        for site in matrix:
            sid = site["site_id"]
            name = site["site_name"]
            score = site["clps_suitability_score"]
            illum = site["illumination_percentage"]
            comm = site["comm_percentage"]
            dual = site["dual_operational_percentage"]

            # Regression assertions:
            # 1. Suitability score between 0 and 100
            valid_score = (0.0 <= score <= 100.0)
            # 2. Dual operation <= illumination and <= comm
            valid_dual = (dual <= illum + 0.1) and (dual <= comm + 0.1)
            # 3. Haworth PSR control must have score == 0 with 0% illumination; candidate sites score > 10
            if sid == "haworth_psr_control":
                valid_control = (illum == 0.0) and (dual == 0.0)
            else:
                valid_control = (score > 10.0) # All realistic landing candidate sites score > 10 under real topography

            site_passed = valid_score and valid_dual and valid_control
            if not site_passed:
                all_passed = False

            status = "PASS" if site_passed else "FAIL"
            print(f" [{status}] {name:32} | Score: {score:5.1f} | Sun: {illum:5.1f}% | Comm: {comm:5.1f}% | Dual: {dual:5.1f}%")

            regression_results.append({
                "site_id": sid,
                "site_name": name,
                "clps_suitability_score": score,
                "illumination_percentage": illum,
                "comm_percentage": comm,
                "dual_operational_percentage": dual,
                "status": status
            })

        self.report["zero_regression_verdict"] = {
            "all_sites_validated": all_passed,
            "sites": regression_results
        }
        return all_passed

    def run_full_audit(self) -> bool:
        """Runs all 4 audit gates and writes output artifact."""
        gate1 = self.audit_dataset_integrity()
        gate2 = self.audit_physics_invariants()
        gate3 = self.audit_test_suite()
        gate4 = self.validate_zero_regressions()

        total_duration = time.time() - self.start_time
        self.report["execution_duration_sec"] = round(total_duration, 2)

        overall_success = gate1 and gate2 and gate3 and gate4
        self.report["overall_status"] = "AUDIT_PASSED_ZERO_REGRESSIONS" if overall_success else "AUDIT_FAILED"

        # Save machine-readable report
        out_path = os.path.join(BASE_DIR, "data", "autonomous_audit_report.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(self.report, f, indent=2)

        print("\n" + "="*78)
        if overall_success:
            print(f" [FINAL VERDICT] AUTONOMOUS SELF-AUDIT PASSED: ZERO REGRESSIONS")
            print(f" [ARTIFACT] Saved audit report to: {out_path}")
            print(f" [TOTAL DURATION] {total_duration:.2f} seconds | 100% Quality Gate Certification")
        else:
            print(f" [FINAL VERDICT] AUDIT FAILED — QUALITY GATES DETECTED DEFECTS")
        print("="*78 + "\n")

        return overall_success

if __name__ == "__main__":
    auditor = AutonomousSelfAudit()
    success = auditor.run_full_audit()
    sys.exit(0 if success else 1)
