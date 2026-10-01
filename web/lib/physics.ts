import { DescentTrajectoryResult, DescentStep } from "./types";

export const R_MOON_KM = 1737.4;
export const LUNAR_RADIUS_M = 1737400.0;
export const SPEED_OF_LIGHT_MS = 299792458.0;
export const X_BAND_FREQ_HZ = 8.4e9; // 8.4 GHz NASA DSN carrier frequency

/**
 * Projects Selenographic coordinates (latitude, longitude) to
 * standard Lunar South Pole Stereographic coordinates (X, Y in km).
 * Origin (0,0) is the Lunar South Pole (90°S).
 * Y-axis negative direction aligns with 0° Longitude (facing Earth).
 * X-axis positive direction aligns with 90° East Longitude.
 */
export function polarToXy(latDeg: number, lonDeg: number): [number, number] {
  const colatRad = ((90.0 - Math.abs(latDeg)) * Math.PI) / 180.0;
  const lonRad = (lonDeg * Math.PI) / 180.0;
  const r = 2.0 * R_MOON_KM * Math.tan(colatRad / 2.0);
  const x = r * Math.sin(lonRad);
  const y = -r * Math.cos(lonRad);
  return [x, y];
}

/**
 * Inverse polar stereographic projection from X, Y (km) back to Lat, Lon (deg)
 */
export function xyToPolar(x: number, y: number): [number, number] {
  const r = Math.sqrt(x * x + y * y);
  if (r < 1e-6) return [-90.0, 0.0];
  const colatRad = 2.0 * Math.atan(r / (2.0 * R_MOON_KM));
  const lat = -(90.0 - (colatRad * 180.0) / Math.PI);
  let lon = (Math.atan2(x, -y) * 180.0) / Math.PI;
  if (lon < 0) lon += 360.0;
  return [lat, lon];
}

/**
 * Great-Circle distance on the lunar sphere (R = 1737.4 km)
 */
export function calculateLunarDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = (lat1 * Math.PI) / 180.0;
  const phi2 = (lat2 * Math.PI) / 180.0;
  const dphi = ((lat2 - lat1) * Math.PI) / 180.0;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180.0;

  const a =
    Math.sin(dphi / 2.0) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2.0) ** 2;
  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1.0 - a)));
  return R_MOON_KM * c;
}

export interface CraterFeature {
  name: string;
  lat: number;
  lon: number;
  radiusKm: number;
  psr: boolean;
  depthKm?: number;
  tempK?: number;
  volatiles?: string[];
}

export const CRATER_FEATURES: CraterFeature[] = [
  { name: "Shackleton", lat: -89.67, lon: 129.78, radiusKm: 10.5, psr: true, depthKm: 4.2, tempK: 38, volatiles: ["H2O Ice", "CO2", "NH3"] },
  { name: "Faustini", lat: -87.1, lon: 84.3, radiusKm: 19.5, psr: true, depthKm: 3.1, tempK: 42, volatiles: ["H2O Ice", "CH4", "H2S"] },
  { name: "Shoemaker", lat: -88.1, lon: 45.9, radiusKm: 25.5, psr: true, depthKm: 2.8, tempK: 40, volatiles: ["H2O Frost", "SO2"] },
  { name: "Haworth", lat: -87.5, lon: 354.8, radiusKm: 25.5, psr: true, depthKm: 3.5, tempK: 35, volatiles: ["Super-Volatiles (CO, Ar)", "H2O"] },
  { name: "Amundsen", lat: -84.4, lon: 83.1, radiusKm: 51.5, psr: false, depthKm: 3.0 },
  { name: "Nobile", lat: -85.3, lon: 53.3, radiusKm: 39.5, psr: false, depthKm: 2.5 },
  { name: "de Gerlache", lat: -88.3, lon: 271.3, radiusKm: 16.0, psr: true, depthKm: 3.8, tempK: 45, volatiles: ["H2O Ice"] },
  { name: "Mons Mouton", lat: -84.9, lon: 32.0, radiusKm: 35.0, psr: false, depthKm: 0.35, tempK: 65, volatiles: ["Shallow Buried Ice", "OH Minerals"] },
];

/**
 * Powered Descent Initiation (PDI) Trajectory Simulation
 * Simulates descent from 15 km altitude to touchdown over burn duration.
 */
export function simulatePdiTrajectory(params: {
  siteLat: number;
  siteLon: number;
  siteElevM: number;
  earthElevDeg: number;
  earthAzDeg: number;
  horizonElevDeg: number;
  pdiAltM?: number;
  pdiVelMs?: number;
  burnDurationS?: number;
  stepS?: number;
}): DescentTrajectoryResult {
  const pdiAlt = params.pdiAltM ?? 15000.0;
  const pdiVel = params.pdiVelMs ?? 1690.0;
  const burnTime = params.burnDurationS ?? 720.0;
  const step = params.stepS ?? 10.0;

  const nSteps = Math.floor(burnTime / step) + 1;
  const steps: DescentStep[] = [];
  let lockedCount = 0;
  let minClearance = 999.0;

  for (let i = 0; i < nSteps; i++) {
    const t = Math.min(i * step, burnTime);
    const normT = t / burnTime;

    // Non-linear deceleration and descent profiles
    const alt = pdiAlt * Math.pow(Math.max(0, 1.0 - normT), 2.1);
    const vel = pdiVel * Math.pow(Math.max(0, 1.0 - normT), 1.5) + 1.0;

    // Downrange distance in km
    const downrangeM = ((pdiVel * burnTime) / 2.5) * Math.pow(Math.max(0, 1.0 - normT), 2);
    const downrangeKm = downrangeM / 1000.0;

    // Geometric horizon dip angle: dip = sqrt(2 * h / R)
    const dipDeg = (Math.sqrt((2.0 * Math.max(0, alt)) / LUNAR_RADIUS_M) * 180.0) / Math.PI;
    const effHorizon = params.horizonElevDeg - dipDeg;

    // Line-of-sight clearance
    const clearance = params.earthElevDeg - effHorizon;
    if (clearance < minClearance) minClearance = clearance;

    const isLocked = clearance >= 0;
    if (isLocked) lockedCount++;

    // Projected radial velocity along Earth line-of-sight vector
    const approachAngleRad = ((Math.abs(params.earthAzDeg - 180.0) % 90.0) * Math.PI) / 180.0;
    const radialVel = vel * Math.cos(approachAngleRad) * Math.max(0, 1.0 - normT);
    const dopplerKhz = ((radialVel / SPEED_OF_LIGHT_MS) * X_BAND_FREQ_HZ) / 1000.0;

    // Link budget margin: base ~ 14.5 dB down to 12.0 dB at touchdown, -30 dB during occultation
    const baseMargin = 14.5 - 2.5 * normT;
    const linkMargin = isLocked ? baseMargin : -30.0;

    steps.push({
      time_s: Math.round(t),
      altitude_m: Math.round(alt * 10) / 10,
      velocity_ms: Math.round(vel * 10) / 10,
      downrange_km: Math.round(downrangeKm * 100) / 100,
      earth_clearance_deg: Math.round(clearance * 100) / 100,
      dte_link_margin_db: Math.round(linkMargin * 10) / 10,
      doppler_shift_khz: Math.round(dopplerKhz * 100) / 100,
      is_comm_locked: isLocked,
    });
  }

  const lockPct = Math.round((lockedCount / nSteps) * 1000) / 10;
  const finalSnr = steps[steps.length - 1].dte_link_margin_db;

  const status: "NOMINAL LOCK" | "DEGRADED" | "BLACKOUT HAZARD" =
    lockPct >= 95.0 ? "NOMINAL LOCK" : lockPct >= 75.0 ? "DEGRADED" : "BLACKOUT HAZARD";

  return {
    site_lat: params.siteLat,
    site_lon: params.siteLon,
    site_elevation_m: params.siteElevM,
    burn_duration_s: burnTime,
    comm_lock_percentage: lockPct,
    final_touchdown_snr_db: finalSnr,
    min_elevation_clearance_deg: Math.round(minClearance * 100) / 100,
    flight_comm_status: status,
    profile_steps: steps,
  };
}

/**
 * 360-degree synthetic horizon profile generator based on site elevation and local morphology
 */
export function generateHorizonProfile(siteElevM: number, slopeDeg: number): { azimuth: number; horizonDeg: number }[] {
  const points: { azimuth: number; horizonDeg: number }[] = [];
  const baseElev = Math.max(0.1, 1.2 - siteElevM / 5000.0);

  for (let az = 0; az <= 360; az += 2) {
    const rad = (az * Math.PI) / 180.0;
    // Harmonic terrain variation resembling crater rim peaks and valleys
    const wave =
      Math.sin(rad * 3 + 0.4) * 0.45 +
      Math.cos(rad * 5 - 0.2) * 0.25 +
      Math.sin(rad * 11 + 1.2) * 0.15;
    const rawH = baseElev + (slopeDeg / 20.0) * wave;
    points.push({
      azimuth: az,
      horizonDeg: Math.max(0.05, Math.round(rawH * 100) / 100),
    });
  }
  return points;
}
