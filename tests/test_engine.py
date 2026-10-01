"""
LunarSite Compass — Engine Test Suite
Tests astronomical ephemeris first principles, topocentric parallax,
planetary curvature ray-casting, LOLA horizon masking, and mission solvers.
"""

import os
import sys
import json
import unittest
import numpy as np
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from engine.lunar_ephemeris import (
    LunarEphemeris,
    LUNAR_OBLIQUITY_DEG,
    LUNAR_OBLIQUITY_EXACT_DEG,
    LUNAR_RADIUS_KM,
    LUNAR_RADIUS_M,
    LIBRATION_LAT_MAX_DEG,
    LIBRATION_LON_MAX_DEG,
    NODAL_PRECESSION_PERIOD_YEARS,
    NODAL_PRECESSION_RATE_DEG_CENTURY,
)
from engine.lola_terrain import LOLATerrainEngine, LOLA_DEM_20M
from engine.mission_solver import MissionWindowSolver
from engine.isru_traverse import run_isru_analysis_all_sites, evaluate_site_isru_potential

class TestLunarEngine(unittest.TestCase):
    def setUp(self):
        self.ephemeris = LunarEphemeris()
        self.terrain = LOLATerrainEngine()
        self.solver = MissionWindowSolver()
        sites_path = os.path.join(BASE_DIR, "data", "sites.json")
        with open(sites_path, "r", encoding="utf-8") as f:
            self.sites = json.load(f)

    def test_ephemeris_subsolar_bounds(self):
        """Sub-solar latitude must never exceed lunar obliquity (±1.5424°)."""
        test_timestamps = [
            datetime(2026, 1, 1, tzinfo=timezone.utc).timestamp(),
            datetime(2026, 6, 1, tzinfo=timezone.utc).timestamp(),
            datetime(2026, 11, 15, tzinfo=timezone.utc).timestamp(),
            datetime(2027, 3, 20, tzinfo=timezone.utc).timestamp(),
            datetime(2027, 9, 23, tzinfo=timezone.utc).timestamp(),
        ]
        for ts in test_timestamps:
            sub_lat, sub_lon = self.ephemeris.get_subsolar_coordinates(ts)
            self.assertLessEqual(abs(sub_lat), LUNAR_OBLIQUITY_EXACT_DEG + 0.001)
            self.assertTrue(-180.0 <= sub_lon <= 180.0)

    def test_first_principles_nodal_precession(self):
        """Precession of the ascending node must regress at -1934.136°/cy (18.613-year period)."""
        ts_2026 = datetime(2026, 1, 1, tzinfo=timezone.utc).timestamp()
        # Advance by exactly 1 Julian century (36525 days)
        ts_2126 = ts_2026 + (36525.0 * 86400.0)
        
        st1 = self.ephemeris.get_ephemeris_state(ts_2026)
        st2 = self.ephemeris.get_ephemeris_state(ts_2126)
        
        d_omega = (st2["node_omega"] - st1["node_omega"]) % 360.0
        expected_d_omega = NODAL_PRECESSION_RATE_DEG_CENTURY % 360.0
        
        self.assertAlmostEqual(d_omega, expected_d_omega, places=1)
        # Verify 18.6-year period constant
        self.assertAlmostEqual(NODAL_PRECESSION_PERIOD_YEARS, 18.613, places=2)

    def test_first_principles_librations(self):
        """Earth libration angles must remain strictly bounded by optical + physical theory."""
        test_dates = [
            datetime(2026, m, 15, 12, 0, tzinfo=timezone.utc).timestamp()
            for m in range(1, 13)
        ]
        for ts in test_dates:
            lat_lib, lon_lib = self.ephemeris.get_subearth_coordinates(ts)
            self.assertLessEqual(abs(lat_lib), LIBRATION_LAT_MAX_DEG + 0.1)
            self.assertLessEqual(abs(lon_lib), LIBRATION_LON_MAX_DEG + 0.1)

    def test_topocentric_parallax_correction(self):
        """Topocentric Earth vector must exhibit ~0.26° parallax relative to infinite line-of-sight."""
        ts = datetime(2026, 11, 15, 12, 0, 0, tzinfo=timezone.utc).timestamp()
        state = self.ephemeris.get_ephemeris_state(ts)
        
        # Site: IM-2 Mons Mouton (-84.7906°S, 29.1957°E, 6000m)
        az_topo, el_topo = self.ephemeris.get_earth_vector(-84.7906, 29.1957, ts, site_elev_m=6000.0)
        az_inf, el_inf = self.ephemeris.calculate_topocentric_vector(
            -84.7906, 29.1957, state["subearth_lat"], state["subearth_lon"],
            site_elev_m=0.0, target_dist_km=None
        )
        
        parallax_diff_deg = el_inf - el_topo
        # Lunar topocentric parallax for Earth: asin(R_Moon / Dist) ~ asin(1737.4 / 384400) ~ 0.259°
        self.assertGreater(parallax_diff_deg, 0.20)
        self.assertLess(parallax_diff_deg, 0.32)

    def test_polar_solar_elevation(self):
        """At lunar pole (lat -90°), Sun elevation should always be within ±1.6° of horizontal."""
        ts = datetime(2026, 11, 15, 12, 0, 0, tzinfo=timezone.utc).timestamp()
        az, el = self.ephemeris.get_solar_vector(-90.0, 0.0, ts)
        self.assertLessEqual(abs(el), LUNAR_OBLIQUITY_EXACT_DEG + 0.01)

    def test_lola_raycast_planetary_curvature(self):
        """LOLA ray-casting must strictly enforce -r^2 / 2R_M curvature drop."""
        # Flat surface (z = 0) at observer elevation 0m
        r_grid = np.array([10000.0, 20000.0, 50000.0, 100000.0]) # 10 km to 100 km
        z_profile = np.zeros_like(r_grid)
        
        # Test curvature drop calculation
        curvature_drops = (r_grid ** 2) / (2.0 * LUNAR_RADIUS_M)
        # At 20 km: 20000^2 / (2 * 1737400) = 400000000 / 3474800 = 115.11 m
        self.assertAlmostEqual(curvature_drops[1], 115.11, places=1)
        # At 50 km: 50000^2 / (2 * 1737400) = 2500000000 / 3474800 = 719.47 m
        self.assertAlmostEqual(curvature_drops[2], 719.47, places=1)
        
        # Ray-casting with a 1,000m ridge at 20 km
        z_ridge = np.array([0.0, 1000.0, 0.0, 0.0])
        theta_parabolic = self.terrain.compute_raycast_horizon(0.0, r_grid, z_ridge, use_exact_spherical=False)
        theta_exact = self.terrain.compute_raycast_horizon(0.0, r_grid, z_ridge, use_exact_spherical=True)
        
        # Both must agree to within 0.005°
        self.assertAlmostEqual(theta_parabolic, theta_exact, places=2)
        # Effective height: 1000 - 115.11 = 884.89 m. Angle: atan(884.89 / 20000) = 2.534°
        self.assertAlmostEqual(theta_parabolic, 2.53, places=1)

    def test_lola_radial_sampling_grid(self):
        """Radial sampling grid must match physical LOLA 20m resolution."""
        grid = self.terrain.generate_radial_sampling_grid(max_range_m=1000.0, step_m=LOLA_DEM_20M)
        self.assertEqual(len(grid), 50)
        self.assertEqual(grid[0], 20.0)
        self.assertEqual(grid[-1], 1000.0)

    def test_haworth_psr_elevation(self):
        """Haworth crater interior should have high horizon obstruction (> 4.0° across all headings)."""
        for az in [0, 45, 90, 135, 180, 225, 270, 315]:
            h_el = self.terrain.get_horizon_elevation("haworth_psr_control", az)
            self.assertGreater(h_el, 4.0)
            # Also test backward compatibility alias
            h_el_alias = self.terrain.get_horizon_elevation("haworth_psr", az)
            self.assertEqual(h_el, h_el_alias)

    def test_all_eight_landing_sites_integrity(self):
        """All 8 official landing sites in sites.json must compute valid, bounded vectors."""
        self.assertEqual(len(self.sites), 8)
        ts = datetime(2026, 11, 15, 12, 0, 0, tzinfo=timezone.utc).timestamp()
        
        for s in self.sites:
            lat = s["latitude"]
            lon = s["longitude"]
            elev = s["elevation_m"]
            sid = s["id"]
            
            # Ephemeris vectors
            s_az, s_el = self.ephemeris.get_solar_vector(lat, lon, ts, site_elev_m=elev, site_id=sid)
            e_az, e_el = self.ephemeris.get_earth_vector(lat, lon, ts, site_elev_m=elev, site_id=sid)
            
            self.assertTrue(0.0 <= s_az <= 360.0)
            self.assertTrue(-90.0 <= s_el <= 90.0)
            self.assertTrue(0.0 <= e_az <= 360.0)
            self.assertTrue(-90.0 <= e_el <= 90.0)
            
            # LOLA horizon obstacle
            s_hz = self.terrain.get_horizon_elevation(sid, s_az)
            e_hz = self.terrain.get_horizon_elevation(sid, e_az)
            self.assertGreaterEqual(s_hz, 0.0)
            self.assertGreaterEqual(e_hz, 0.0)

    def test_real_nasa_telemetry_integration(self):
        """Tests seamless activation of real NASA JPL Horizons ephemeris and PDS LOLA DEM topography."""
        self.assertTrue(self.ephemeris.is_real_ephemeris_active())
        self.assertTrue(self.terrain.is_real_lola_active())
        
        # Verify JPL Horizons topocentric vectors for IM-2 Mons Mouton on Nov 1 2026 00:00 UTC
        ts_nov1 = datetime(2026, 11, 1, 0, 0, 0, tzinfo=timezone.utc).timestamp()
        s_az, s_el = self.ephemeris.get_solar_vector(-84.7906, 29.1957, ts_nov1, site_id="im2_mons_mouton")
        e_az, e_el = self.ephemeris.get_earth_vector(-84.7906, 29.1957, ts_nov1, site_id="im2_mons_mouton")
        
        self.assertAlmostEqual(s_az, 255.86, places=1)
        self.assertAlmostEqual(s_el, 0.19, places=1)
        self.assertAlmostEqual(e_az, 334.54, places=1)
        self.assertAlmostEqual(e_el, 7.65, places=1)
        
        # Verify NASA PDS LOLA DEM elevation for IM-2 Mons Mouton
        meta = self.terrain.get_site_terrain_metadata("im2_mons_mouton")
        self.assertIsNotNone(meta)
        self.assertAlmostEqual(meta["center_lola_elevation_m"], 5319.6, places=1)
        
        # Verify real radial cross sections
        profile = self.terrain.get_radial_profile("im2_mons_mouton", 0.0)
        self.assertIsNotNone(profile)
        self.assertGreater(len(profile), 50)

    def test_isru_analysis_all_sites(self):
        """ISRU volatile proximity must correctly link to verified crater floor cold traps."""
        results = run_isru_analysis_all_sites(self.sites)
        self.assertEqual(len(results), 8)
        
        # Haworth control benchmark distance to Haworth floor must be 0.0 km
        haworth_res = next(r for r in results if r["site_id"] == "haworth_psr_control")
        self.assertAlmostEqual(haworth_res["nearest_psr_distance_km"], 0.0, places=1)
        
        # Shackleton Peak B on rim crest links to Shackleton floor within 20 km
        shack_res = next(r for r in results if r["site_id"] == "shackleton_peak_b")
        self.assertEqual(shack_res["nearest_psr_name"], "Shackleton Crater Floor")
        self.assertLess(shack_res["nearest_psr_distance_km"], 25.0)

    def test_max_consecutive_streaks(self):
        """Test consecutive boolean counter logic."""
        arr = np.array([True, True, True, False, True, True, False])
        self.assertEqual(MissionWindowSolver._max_consecutive(arr), 3)
        
        arr_all_false = np.array([False, False, False])
        self.assertEqual(MissionWindowSolver._max_consecutive(arr_all_false), 0)

    def test_polar_stereographic_projection(self):
        """Test polar stereographic cartesian conversion accuracy."""
        from engine.polar_map import polar_to_xy
        # South pole exact (90°S) must be (0, 0)
        x_pole, y_pole = polar_to_xy(-90.0, 0.0)
        self.assertAlmostEqual(x_pole, 0.0, places=2)
        self.assertAlmostEqual(y_pole, 0.0, places=2)

        # 0° longitude points along negative Y (toward Earth)
        x_earth, y_earth = polar_to_xy(-85.0, 0.0)
        self.assertAlmostEqual(x_earth, 0.0, places=2)
        self.assertLess(y_earth, -100.0)

        # 90°E points along positive X
        x_east, y_east = polar_to_xy(-85.0, 90.0)
        self.assertGreater(x_east, 100.0)
        self.assertAlmostEqual(y_east, 0.0, places=2)

    def test_descent_trajectory_simulation(self):
        """Test powered descent simulation and comm link margin calculations."""
        from engine.descent_trajectory import DescentTrajectorySimulator
        sim = DescentTrajectorySimulator(burn_time_s=600.0)
        res = sim.compute_trajectory(
            site_lat=-84.79,
            site_lon=29.2,
            site_elev_m=6000.0,
            earth_elev_deg=5.0,
            earth_az_deg=40.0,
            horizon_elev_deg=0.5
        )
        self.assertEqual(res["flight_comm_status"], "NOMINAL LOCK")
        self.assertGreaterEqual(res["comm_lock_percentage"], 99.0)
        self.assertGreater(res["final_touchdown_snr_db"], 10.0)
        self.assertEqual(len(res["profile_steps"]), 61)

    def test_horizon_panorama_profile(self):
        """Test 360-degree synthetic horizon panorama generation."""
        from engine.horizon_panorama import HorizonPanoramaGenerator
        gen = HorizonPanoramaGenerator()
        profile = gen.generate_skyline_profile("haworth_psr_control", step_deg=5.0)
        self.assertEqual(len(profile["azimuths_deg"]), 73)
        self.assertGreater(profile["mean_horizon_deg"], 5.0)
        self.assertGreater(profile["max_horizon_deg"], 8.0)

if __name__ == "__main__":
    unittest.main()
