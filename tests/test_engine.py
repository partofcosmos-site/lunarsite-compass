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
from engine.mission_solver import (
    MissionWindowSolver,
    compute_dsn_link_budget,
    compute_xband_doppler_shift,
)
from engine.isru_traverse import (
    run_isru_analysis_all_sites,
    evaluate_site_isru_potential,
    compute_slope_penalty,
    calculate_traverse_edge_cost,
    solve_dijkstra_traverse,
    classify_thermal_regime,
    calculate_lunar_distance_km,
    PSR_RESERVOIRS,
)
from engine.polar_map import polar_to_xy

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

    def test_seasonal_stress_solstices_illumination_difference(self):
        """Seasonal stress: Southern Summer Solstice (Dec 2026) must provide significantly higher illumination than Winter Solstice (Jun 2027)."""
        shackleton = next(s for s in self.sites if s["id"] == "shackleton_peak_b")
        
        # Southern Summer Solstice (Peak Sun)
        dt_summer = datetime(2026, 12, 1, 0, 0, 0, tzinfo=timezone.utc)
        _, m_summer = self.solver.evaluate_site_window(
            site_id=shackleton["id"],
            site_name=shackleton["name"],
            lat_deg=shackleton["latitude"],
            lon_deg=shackleton["longitude"],
            start_date=dt_summer,
            duration_days=14,
            step_hours=1.0,
            site_elev_m=shackleton["elevation_m"]
        )
        
        # Southern Winter Solstice (Deep Polar Night)
        dt_winter = datetime(2027, 6, 1, 0, 0, 0, tzinfo=timezone.utc)
        _, m_winter = self.solver.evaluate_site_window(
            site_id=shackleton["id"],
            site_name=shackleton["name"],
            lat_deg=shackleton["latitude"],
            lon_deg=shackleton["longitude"],
            start_date=dt_winter,
            duration_days=14,
            step_hours=1.0,
            site_elev_m=shackleton["elevation_m"]
        )
        
        self.assertGreater(m_summer["illumination_percentage"], m_winter["illumination_percentage"])
        self.assertGreater(m_summer["clps_suitability_score"], m_winter["clps_suitability_score"])
        self.assertGreater(m_winter["max_continuous_night_hours"], m_summer["max_continuous_night_hours"])

    def test_seasonal_stress_equinox_transitions(self):
        """Seasonal stress: Both transition equinoxes (Mar 2027 and Sep 2027) represent intermediate orbital geometries between solstices."""
        # Solstices: peak positive (+1.54°) in winter and peak negative (-1.54°) in summer
        ts_summer = datetime(2026, 12, 1, 0, 0, 0, tzinfo=timezone.utc).timestamp()
        ts_winter = datetime(2027, 6, 1, 0, 0, 0, tzinfo=timezone.utc).timestamp()
        ts_autumn = datetime(2027, 3, 1, 0, 0, 0, tzinfo=timezone.utc).timestamp()
        ts_spring = datetime(2027, 9, 1, 0, 0, 0, tzinfo=timezone.utc).timestamp()
        
        sub_lat_summer, _ = self.ephemeris.get_subsolar_coordinates(ts_summer)
        sub_lat_winter, _ = self.ephemeris.get_subsolar_coordinates(ts_winter)
        sub_lat_autumn, _ = self.ephemeris.get_subsolar_coordinates(ts_autumn)
        sub_lat_spring, _ = self.ephemeris.get_subsolar_coordinates(ts_spring)
        
        # Summer solstice has negative subsolar latitude (Sun tilted toward South Pole)
        self.assertLess(sub_lat_summer, -1.0)
        # Winter solstice has positive subsolar latitude (Sun tilted toward North Pole)
        self.assertGreater(sub_lat_winter, 1.0)
        # All subsolar latitudes strictly bounded by lunar obliquity
        for s_lat in [sub_lat_summer, sub_lat_winter, sub_lat_autumn, sub_lat_spring]:
            self.assertLessEqual(abs(s_lat), LUNAR_OBLIQUITY_EXACT_DEG + 0.001)
        
        # Nodal crossing in 2027: subsolar latitude crosses 0.0° during the year
        ts_crossing = datetime(2027, 7, 31, 0, 0, 0, tzinfo=timezone.utc).timestamp()
        sub_lat_cross, _ = self.ephemeris.get_subsolar_coordinates(ts_crossing)
        self.assertLessEqual(abs(sub_lat_cross), 0.2)
        
        # Verify 360° solar diurnal sweep over 29.5-day synodic period starting at equinox
        az_samples = []
        for d in range(30):
            ts = ts_autumn + (d * 86400.0)
            az, _ = self.ephemeris.get_solar_vector(-89.0, 0.0, ts)
            az_samples.append(az)
        
        # Azimuth span should cover the full quadrant range (> 300° range)
        az_span = max(az_samples) - min(az_samples)
        self.assertGreater(az_span, 300.0)

    def test_seasonal_stress_deep_psr_zero_illumination(self):
        """Seasonal stress: Haworth PSR control site must maintain 0.0% solar illumination across ALL 4 seasons."""
        haworth = next(s for s in self.sites if s["id"] == "haworth_psr_control")
        cardinal_seasons = [
            datetime(2026, 12, 1, tzinfo=timezone.utc),  # Summer Solstice
            datetime(2027, 3, 1, tzinfo=timezone.utc),   # Autumnal Equinox
            datetime(2027, 6, 1, tzinfo=timezone.utc),   # Winter Solstice
            datetime(2027, 9, 1, tzinfo=timezone.utc),   # Spring Equinox
        ]
        for dt_season in cardinal_seasons:
            _, metrics = self.solver.evaluate_site_window(
                site_id=haworth["id"],
                site_name=haworth["name"],
                lat_deg=haworth["latitude"],
                lon_deg=haworth["longitude"],
                start_date=dt_season,
                duration_days=7,
                step_hours=2.0,
                site_elev_m=haworth["elevation_m"]
            )
            self.assertEqual(metrics["illumination_hours"], 0.0)
            self.assertEqual(metrics["illumination_percentage"], 0.0)
            self.assertEqual(metrics["dual_operational_hours"], 0.0)

    def test_seasonal_stress_dual_operational_stability(self):
        """Seasonal stress: Elevated rim sites must provide significant continuous dual-operational windows during summer."""
        im2 = next(s for s in self.sites if s["id"] == "im2_mons_mouton")
        dt_summer = datetime(2026, 11, 15, tzinfo=timezone.utc)
        _, metrics = self.solver.evaluate_site_window(
            site_id=im2["id"],
            site_name=im2["name"],
            lat_deg=im2["latitude"],
            lon_deg=im2["longitude"],
            start_date=dt_summer,
            duration_days=14,
            step_hours=1.0,
            site_elev_m=im2["elevation_m"]
        )
        self.assertGreater(metrics["dual_operational_percentage"], 30.0)
        self.assertGreater(metrics["max_continuous_dual_hours"], 48.0)
        self.assertGreater(metrics["clps_suitability_score"], 60.0)

    def test_isru_slope_penalty_mobility_curve(self):
        """ISRU Terramechanics: Slope penalty curve must be 0 on flat, non-linear up to 15.0°, and infinite beyond."""
        # Flat surface: zero penalty, cost = distance
        self.assertEqual(compute_slope_penalty(0.0), 0.0)
        self.assertEqual(calculate_traverse_edge_cost(100.0, 0.0), 100.0)
        
        # 5.0° slope: slight penalty ~ (5/15)^2 ~ 0.111
        p_5 = compute_slope_penalty(5.0, critical_slope_deg=15.0)
        self.assertAlmostEqual(p_5, (5.0 / 15.0) ** 2, places=3)
        self.assertAlmostEqual(calculate_traverse_edge_cost(100.0, 5.0), 100.0 * (1.0 + p_5), places=2)
        
        # 10.0° slope: moderate penalty ~ (10/15)^2 ~ 0.444
        p_10 = compute_slope_penalty(10.0, critical_slope_deg=15.0)
        self.assertAlmostEqual(p_10, (10.0 / 15.0) ** 2, places=3)
        self.assertGreater(p_10, p_5)
        
        # Critical threshold (15.0°): infinite penalty & cost (tipping hazard)
        self.assertEqual(compute_slope_penalty(15.0, critical_slope_deg=15.0), float("inf"))
        self.assertEqual(calculate_traverse_edge_cost(100.0, 15.0), float("inf"))
        
        # Above critical threshold (22.0°): infinite penalty & cost
        self.assertEqual(compute_slope_penalty(22.0, critical_slope_deg=15.0), float("inf"))
        self.assertEqual(calculate_traverse_edge_cost(100.0, 22.0), float("inf"))
        
        # Negative slope: handled safely
        self.assertEqual(compute_slope_penalty(-2.0), 0.0)

    def test_isru_dijkstra_traverse_cost_optimal_detour(self):
        """ISRU Dijkstra: Algorithm must find the lower-cost detour around an impassable 25° ridge obstacle."""
        # Create a 5x5 slope grid:
        # Row 0: Start at (0, 2), flat
        # Row 2, Col 2: Impassable ridge (25° slope)
        # Left and Right flanks (Cols 0 and 4): Flat (2° slope)
        grid = np.full((5, 5), 2.0, dtype=np.float64)
        grid[2, 1:4] = 25.0  # Impassable barrier wall across middle
        
        result = solve_dijkstra_traverse(
            slope_grid=grid,
            start=(0, 2),
            goal=(4, 2),
            cell_size_m=20.0,
            critical_slope_deg=15.0
        )
        
        self.assertTrue(result["success"])
        self.assertLess(result["max_slope_deg"], 15.0)
        self.assertGreaterEqual(result["num_waypoints"], 5)
        self.assertLess(result["total_cost"], float("inf"))
        
        # Path must detour around the obstacle: none of the waypoints should be on the ridge
        ridge_cells = {(2, 1), (2, 2), (2, 3)}
        for wp in result["path"]:
            self.assertNotIn(tuple(wp), ridge_cells)

    def test_isru_dijkstra_unpassable_cliff_wall(self):
        """ISRU Dijkstra: Goal encircled by 30° cliff walls must return success=False and infinite cost."""
        grid = np.full((5, 5), 2.0, dtype=np.float64)
        # Encircle goal (4, 4) with 30° slopes
        grid[3, 3:5] = 30.0
        grid[4, 3] = 30.0
        
        result = solve_dijkstra_traverse(
            slope_grid=grid,
            start=(0, 0),
            goal=(4, 4),
            cell_size_m=20.0,
            critical_slope_deg=15.0
        )
        
        self.assertFalse(result["success"])
        self.assertEqual(result["total_cost"], float("inf"))
        self.assertEqual(len(result["path"]), 0)

    def test_isru_thermal_stability_and_volatile_classification(self):
        """ISRU Volatiles: Reservoirs must be classified into accurate cryogenic thermal stability regimes."""
        for psr in PSR_RESERVOIRS:
            temp = psr["temperature_k"]
            regime = classify_thermal_regime(temp)
            if temp <= 40.0:
                self.assertEqual(regime, "Super-Volatile Cryogenic Cold Trap")
                self.assertIn("H2O", " ".join(psr["volatile_types"]))
            elif temp <= 70.0:
                self.assertEqual(regime, "H2O Permafrost Thermal Stability Zone")
            
            # Physical lunar cold trap limits
            self.assertGreaterEqual(temp, 25.0)
            self.assertLessEqual(temp, 85.0)
            self.assertGreater(psr["depth_km"], 0.1)

    def test_mission_solver_pdi_link_budget_curve(self):
        """Mission Solver: PDI descent burn DSN link budget must exhibit geometric dip and carrier margin drop."""
        # Use compute_pdi_descent_profile from MissionWindowSolver
        pdi_profile = self.solver.compute_pdi_descent_profile(
            site_lat=-84.7906,
            site_lon=29.1957,
            site_elev_m=5319.6,
            earth_elev_deg=6.0,
            earth_az_deg=45.0,
            horizon_elev_deg=0.8,
            burn_time_s=720.0,
            step_s=10.0
        )
        
        self.assertEqual(pdi_profile["flight_comm_status"], "NOMINAL LOCK")
        self.assertGreaterEqual(pdi_profile["comm_lock_percentage"], 95.0)
        self.assertGreater(pdi_profile["final_touchdown_snr_db"], 10.0)
        
        # Test compute_dsn_link_budget analytical function directly
        clearance_high, snr_high, los_high = compute_dsn_link_budget(
            altitude_m=15000.0, earth_elev_deg=5.0, horizon_elev_deg=1.0, normalized_time=0.0
        )
        clearance_low, snr_low, los_low = compute_dsn_link_budget(
            altitude_m=0.0, earth_elev_deg=5.0, horizon_elev_deg=1.0, normalized_time=1.0
        )
        
        self.assertTrue(los_high)
        self.assertTrue(los_low)
        self.assertGreater(clearance_high, clearance_low) # Geometric dip drops horizon at high altitude
        self.assertAlmostEqual(snr_high, 14.5, places=1)
        self.assertAlmostEqual(snr_low, 12.0, places=1)
        
        # Test obstructed LOS produces -30 dB blackout
        _, snr_blocked, los_blocked = compute_dsn_link_budget(
            altitude_m=0.0, earth_elev_deg=0.5, horizon_elev_deg=3.0, normalized_time=1.0
        )
        self.assertFalse(los_blocked)
        self.assertEqual(snr_blocked, -30.0)

    def test_mission_solver_pdi_xband_doppler_dynamics(self):
        """Mission Solver: X-band Doppler shift curves must monotonically decelerate during PDI burn."""
        pdi_profile = self.solver.compute_pdi_descent_profile(
            site_lat=-84.7906,
            site_lon=29.1957,
            site_elev_m=5319.6,
            earth_elev_deg=6.0,
            earth_az_deg=45.0,
            horizon_elev_deg=0.8,
            burn_time_s=720.0,
            step_s=10.0
        )
        
        steps = pdi_profile["profile_steps"]
        doppler_shifts = [s["doppler_shift_khz"] for s in steps]
        
        # Initial Doppler at 1690 m/s PDI initiation
        self.assertGreater(doppler_shifts[0], 25.0)
        # Final Doppler at 1 m/s touchdown
        self.assertLess(doppler_shifts[-1], 0.1)
        
        # Monotonically non-increasing trend
        for i in range(len(doppler_shifts) - 1):
            self.assertGreaterEqual(doppler_shifts[i], doppler_shifts[i+1] - 0.01)
            
        # Analytical helper function test
        d_init = compute_xband_doppler_shift(velocity_ms=1690.0, earth_az_deg=180.0, normalized_time=0.0)
        d_touch = compute_xband_doppler_shift(velocity_ms=1.0, earth_az_deg=180.0, normalized_time=1.0)
        self.assertGreater(d_init, 45.0)
        self.assertAlmostEqual(d_touch, 0.0, places=2)

    def test_polar_singularity_exact_south_pole(self):
        """Polar Singularity: Exact South Pole (-90.0° latitude) must behave consistently across all longitudes."""
        # 1. Great-circle distance from South Pole to South Pole must be exactly 0.0 km
        self.assertAlmostEqual(calculate_lunar_distance_km(-90.0, 0.0, -90.0, 180.0), 0.0, places=3)
        self.assertAlmostEqual(calculate_lunar_distance_km(-90.0, 45.0, -90.0, 225.0), 0.0, places=3)
        self.assertAlmostEqual(calculate_lunar_distance_km(-90.0, 350.0, -90.0, 710.0), 0.0, places=3)
        
        # 2. Polar stereographic projection must map (-90.0°, any lon) strictly to (0.0, 0.0)
        for test_lon in [0.0, 45.0, 90.0, 180.0, 270.0, 360.0, 720.0]:
            x, y = polar_to_xy(-90.0, test_lon)
            self.assertAlmostEqual(x, 0.0, places=4)
            self.assertAlmostEqual(y, 0.0, places=4)
            
        # 3. Topocentric vector calculations at -90.0° must output finite numbers without NaN or Inf
        ts = datetime(2026, 11, 15, 12, 0, 0, tzinfo=timezone.utc).timestamp()
        for test_lon in [0.0, 90.0, 180.0, 270.0]:
            az, el = self.ephemeris.get_solar_vector(-90.0, test_lon, ts)
            self.assertFalse(np.isnan(az))
            self.assertFalse(np.isnan(el))
            self.assertTrue(0.0 <= az <= 360.0)
            self.assertTrue(-90.0 <= el <= 90.0)

    def test_coordinate_wrapping_and_bounds_tolerance(self):
        """Coordinate Wrapping: Longitude periodic wrapping and micro-overshoot clamping must be seamless."""
        # Topocentric vectors with wrapped longitudes: 29.1957° vs 389.1957° vs -330.8043°
        az_base, el_base = self.ephemeris.calculate_topocentric_vector(-84.7906, 29.1957, 0.0, 0.0)
        az_wrap_pos, el_wrap_pos = self.ephemeris.calculate_topocentric_vector(-84.7906, 389.1957, 0.0, 0.0)
        az_wrap_neg, el_wrap_neg = self.ephemeris.calculate_topocentric_vector(-84.7906, -330.8043, 0.0, 0.0)
        
        self.assertAlmostEqual(az_base, az_wrap_pos, places=2)
        self.assertAlmostEqual(el_base, el_wrap_pos, places=2)
        self.assertAlmostEqual(az_base, az_wrap_neg, places=2)
        self.assertAlmostEqual(el_base, el_wrap_neg, places=2)
        
        # Great-circle distance with wrapped lon
        d_wrap = calculate_lunar_distance_km(-85.0, 10.0, -85.0, 370.0)
        self.assertAlmostEqual(d_wrap, 0.0, places=3)
        
        # Latitude clamping: micro-overshoot beyond -90.0°
        x_over, y_over = polar_to_xy(-90.0001, 45.0)
        self.assertAlmostEqual(x_over, 0.0, places=3)
        self.assertAlmostEqual(y_over, 0.0, places=3)

if __name__ == "__main__":
    unittest.main()

