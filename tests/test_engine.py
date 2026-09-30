"""
LunarSite Compass — Engine Test Suite
Tests ephemeris angle bounds, horizon masking behavior, and window solver streaks.
"""

import os
import sys
import unittest
import numpy as np
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from engine.lunar_ephemeris import LunarEphemeris, LUNAR_OBLIQUITY_DEG
from engine.lola_terrain import LOLATerrainEngine
from engine.mission_solver import MissionWindowSolver

class TestLunarEngine(unittest.TestCase):
    def setUp(self):
        self.ephemeris = LunarEphemeris()
        self.terrain = LOLATerrainEngine()
        self.solver = MissionWindowSolver()

    def test_ephemeris_subsolar_bounds(self):
        """Sub-solar latitude must never exceed lunar obliquity (±1.5424°)."""
        test_timestamps = [
            datetime(2026, 1, 1, tzinfo=timezone.utc).timestamp(),
            datetime(2026, 6, 1, tzinfo=timezone.utc).timestamp(),
            datetime(2026, 11, 15, tzinfo=timezone.utc).timestamp(),
        ]
        for ts in test_timestamps:
            sub_lat, sub_lon = self.ephemeris.get_subsolar_coordinates(ts)
            self.assertLessEqual(abs(sub_lat), LUNAR_OBLIQUITY_DEG + 0.01)
            self.assertTrue(-180.0 <= sub_lon <= 180.0)

    def test_polar_solar_elevation(self):
        """At lunar pole (lat -90°), Sun elevation should always be within ±2° of horizontal."""
        ts = datetime(2026, 11, 15, 12, 0, 0, tzinfo=timezone.utc).timestamp()
        az, el = self.ephemeris.get_solar_vector(-90.0, 0.0, ts)
        self.assertLessEqual(abs(el), 2.5)

    def test_haworth_psr_elevation(self):
        """Haworth crater interior should have high horizon obstruction (> 4.0°)."""
        for az in [0, 90, 180, 270]:
            h_el = self.terrain.get_horizon_elevation("haworth_psr", az)
            self.assertGreater(h_el, 4.0)

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
