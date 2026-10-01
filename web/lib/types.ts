export interface CandidateSite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  slope_deg: number;
  mission_context: string;
  scientific_interest: string;
}

export interface SiteSummary {
  site_id: string;
  site_name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  slope_deg: number;
  mission_context: string;
  total_duration_days: number;
  total_hours: number;
  illumination_hours: number;
  illumination_percentage: number;
  max_continuous_illumination_hours: number;
  max_continuous_illumination_days: number;
  comm_hours: number;
  comm_percentage: number;
  max_continuous_comm_hours: number;
  max_continuous_comm_days: number;
  dual_operational_hours: number;
  dual_operational_percentage: number;
  max_continuous_dual_hours: number;
  max_continuous_dual_days: number;
  max_continuous_night_hours: number;
  blackout_hours: number;
  clps_suitability_score: number;
}

export interface TelemetryPoint {
  dt: string;
  t: number;
  sAz: number;
  sEl: number;
  sHz: number;
  eAz: number;
  eEl: number;
  eHz: number;
  sun: boolean;
  comm: boolean;
  dual: boolean;
  state: "Dual Operational" | "Sun Only" | "Comm Only" | "Blackout";
}

export interface EpochSiteState {
  st: "Dual Operational" | "Sun Only" | "Comm Only" | "Blackout";
  sEl: number;
  eEl: number;
  sAz: number;
  eAz: number;
}

export interface TimelineEpoch {
  dt: string;
  t: number;
  sites: Record<string, EpochSiteState>;
}

export interface PsrProximity {
  psr_id: string;
  psr_name: string;
  distance_km: number;
  temperature_k: number;
  volatiles: string[];
  wall_slope_deg: number;
  traverse_class: string;
  feasibility_score: number;
}

export interface SiteIsruAnalysis {
  site_id: string;
  site_name: string;
  nearest_psr_name: string;
  nearest_psr_distance_km: number;
  nearest_psr_temperature_k: number;
  nearest_psr_volatiles: string[];
  traverse_classification: string;
  isru_accessibility_index: number;
  all_psr_proximity: PsrProximity[];
}

export interface SeasonalBenchmark {
  site_id: string;
  site_name: string;
  season: string;
  latitude: number;
  longitude: number;
  slope_deg: number;
  illumination_percentage: number;
  max_continuous_illumination_days: number;
  comm_percentage: number;
  max_continuous_comm_days: number;
  dual_operational_percentage: number;
  max_continuous_night_hours: number;
  clps_suitability_score: number;
}

export interface DescentStep {
  time_s: number;
  altitude_m: number;
  velocity_ms: number;
  downrange_km: number;
  earth_clearance_deg: number;
  dte_link_margin_db: number;
  doppler_shift_khz: number;
  is_comm_locked: boolean;
}

export interface DescentTrajectoryResult {
  site_lat: number;
  site_lon: number;
  site_elevation_m: number;
  burn_duration_s: number;
  comm_lock_percentage: number;
  final_touchdown_snr_db: number;
  min_elevation_clearance_deg: number;
  flight_comm_status: "NOMINAL LOCK" | "DEGRADED" | "BLACKOUT HAZARD";
  profile_steps: DescentStep[];
}

export interface LolaRadialPoint {
  distance_m: number;
  elevation_m: number;
}

export interface LolaSiteMetrics {
  min_horizon_elevation_deg: number;
  max_horizon_elevation_deg: number;
  mean_horizon_elevation_deg: number;
  dominant_obstacle_azimuth_deg: number;
  estimated_local_slope_deg: number;
}

export interface LolaSiteData {
  site_id: string;
  site_name: string;
  latitude_deg: number;
  longitude_deg: number;
  center_lola_elevation_m: number;
  dem_pixel_coords: [number, number];
  horizon_mask_5deg: Record<string, number>;
  radial_topography_profiles: Record<string, LolaRadialPoint[]>;
  metrics: LolaSiteMetrics;
}

export interface LolaDemMetadata {
  source: string;
  dataset_id: string;
  product_id: string;
  dem_image_url: string;
  dem_label_url: string;
  catalog_url: string;
  pds_geosciences_url: string;
  projection: string;
  map_scale_m_per_pixel: number;
  observer_mast_height_m: number;
  generated_utc: string;
  status: string;
}

export interface LolaDemDataset {
  metadata: LolaDemMetadata;
  sites: Record<string, LolaSiteData>;
}

