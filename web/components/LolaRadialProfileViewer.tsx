"use client";

import React, { useState, useMemo } from "react";
import { LolaSiteData, LolaRadialPoint } from "../lib/types";
import { getLolaDataForSite, CANDIDATE_SITES } from "../lib/data";
import {
  Compass,
  Mountain,
  Eye,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Info,
  Maximize2,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Radio,
} from "lucide-react";

export const COMPASS_DIRECTIONS = [
  { key: "0", label: "0° N", name: "North", deg: 0 },
  { key: "45", label: "45° NE", name: "Northeast", deg: 45 },
  { key: "90", label: "90° E", name: "East", deg: 90 },
  { key: "135", label: "135° SE", name: "Southeast", deg: 135 },
  { key: "180", label: "180° S", name: "South", deg: 180 },
  { key: "225", label: "225° SW", name: "Southwest", deg: 225 },
  { key: "270", label: "270° W", name: "West", deg: 270 },
  { key: "315", label: "315° NW", name: "Northwest", deg: 315 },
] as const;

export interface LolaRadialProfileViewerProps {
  siteId: string;
  siteName?: string;
  sunAzimuth?: number;
  sunElevation?: number;
  earthAzimuth?: number;
  earthElevation?: number;
  onSelectSite?: (siteId: string) => void;
  className?: string;
}

export const LolaRadialProfileViewer: React.FC<LolaRadialProfileViewerProps> = ({
  siteId,
  siteName,
  sunAzimuth,
  sunElevation,
  earthAzimuth,
  earthElevation,
  onSelectSite,
  className = "",
}) => {
  // Load real LOLA DEM topography dataset for the selected site
  const siteData: LolaSiteData | undefined = useMemo(() => {
    return getLolaDataForSite(siteId);
  }, [siteId]);

  // Determine site's dominant obstacle direction to preselect intelligently
  const dominantAzimuthDeg = siteData?.metrics?.dominant_obstacle_azimuth_deg ?? 90;
  const closestCompassKey = useMemo(() => {
    const azNorm = ((dominantAzimuthDeg % 360) + 360) % 360;
    const snapped = (Math.round(azNorm / 45.0) * 45) % 360;
    return String(snapped);
  }, [dominantAzimuthDeg]);

  const [selectedAzimuthKey, setSelectedAzimuthKey] = useState<string>("0");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showSightline, setShowSightline] = useState<boolean>(true);
  const [showOccultationZone, setShowOccultationZone] = useState<boolean>(true);
  const [showCurvature, setShowCurvature] = useState<boolean>(true);
  const [showLocalHorizontal, setShowLocalHorizontal] = useState<boolean>(true);
  const [showCelestialVectors, setShowCelestialVectors] = useState<boolean>(true);

  // Active direction descriptor
  const activeDirection = useMemo(() => {
    return (
      COMPASS_DIRECTIONS.find((d) => d.key === selectedAzimuthKey) ||
      COMPASS_DIRECTIONS[0]
    );
  }, [selectedAzimuthKey]);

  // Radial profile points (0 to ~20 km, sampled at 80m/240m resolution)
  const profilePoints: LolaRadialPoint[] = useMemo(() => {
    if (!siteData?.radial_topography_profiles) return [];
    return siteData.radial_topography_profiles[selectedAzimuthKey] || [];
  }, [siteData, selectedAzimuthKey]);

  // Physical constants
  const R_MOON_M = 1737400.0; // Lunar volumetric mean radius (m)
  const mastH0 = 2.0; // Observer mast height above local ground level (m)
  const groundElev0 = siteData?.center_lola_elevation_m ?? (profilePoints[0]?.elevation_m ?? 0);
  const observerElev0 = groundElev0 + mastH0;

  // Compute elevation angles and identify peak terrain obstacle
  const profileAnalysis = useMemo(() => {
    if (!profilePoints.length) {
      return {
        pointsWithAngles: [],
        peakPoint: null,
        peakAngleDeg: 0.0,
        peakDistanceKm: 0.0,
        peakElevationM: groundElev0,
        peakIndex: 0,
        minElev: groundElev0 - 200,
        maxElev: groundElev0 + 200,
        maxDistM: 20160,
      };
    }

    let maxAngle = -999.0;
    let peakPt: LolaRadialPoint | null = null;
    let peakIdx = 0;
    let minE = groundElev0;
    let maxE = groundElev0;
    let maxD = 0;

    const pointsWithAngles = profilePoints.map((pt, i) => {
      const r = pt.distance_m;
      const z = pt.elevation_m;
      minE = Math.min(minE, z);
      maxE = Math.max(maxE, z);
      maxD = Math.max(maxD, r);

      let angleDeg = 0.0;
      if (r > 0) {
        if (showCurvature) {
          // Lunar curvature drop: r^2 / (2 * R_MOON)
          const curvDrop = (r * r) / (2.0 * R_MOON_M);
          const effectiveH = z - observerElev0 - curvDrop;
          angleDeg = (Math.atan2(effectiveH, r) * 180.0) / Math.PI;
        } else {
          const effectiveH = z - observerElev0;
          angleDeg = (Math.atan2(effectiveH, r) * 180.0) / Math.PI;
        }

        if (angleDeg > maxAngle) {
          maxAngle = angleDeg;
          peakPt = pt;
          peakIdx = i;
        }
      }

      return {
        ...pt,
        angleDeg,
        index: i,
      };
    });

    if (!peakPt && profilePoints.length > 1) {
      peakPt = profilePoints[1];
      maxAngle = 0.0;
      peakIdx = 1;
    }

    return {
      pointsWithAngles,
      peakPoint: peakPt,
      peakAngleDeg: maxAngle,
      peakDistanceKm: ((peakPt as LolaRadialPoint | null)?.distance_m ?? 0) / 1000.0,
      peakElevationM: (peakPt as LolaRadialPoint | null)?.elevation_m ?? groundElev0,
      peakIndex: peakIdx,
      minElev: minE,
      maxElev: maxE,
      maxDistM: maxD > 0 ? maxD : 20160,
    };
  }, [profilePoints, groundElev0, observerElev0, showCurvature]);

  // SVG Chart Dimensions
  const chartWidth = 920;
  const chartHeight = 360;
  const padding = { top: 35, right: 35, bottom: 45, left: 70 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Distance range (X-axis: 0 to 20 km)
  const maxDistanceKm = Math.max(20.0, profileAnalysis.maxDistM / 1000.0);

  // Elevation range (Y-axis: rounded to clean intervals)
  const { yMin, yMax, yTicks } = useMemo(() => {
    const rawMin = profileAnalysis.minElev;
    const rawMax = profileAnalysis.maxElev;
    const span = Math.max(300, rawMax - rawMin);

    // Add 12% vertical padding
    const paddedMin = rawMin - span * 0.12;
    const paddedMax = rawMax + span * 0.18;

    // Pick a clean step (100, 200, 250, 500, or 1000)
    let step = 100;
    if (span > 3000) step = 1000;
    else if (span > 1500) step = 500;
    else if (span > 800) step = 250;
    else if (span > 400) step = 200;

    const niceMin = Math.floor(paddedMin / step) * step;
    const niceMax = Math.ceil(paddedMax / step) * step;

    const ticks: number[] = [];
    for (let t = niceMin; t <= niceMax; t += step) {
      ticks.push(t);
    }

    return { yMin: niceMin, yMax: niceMax, yTicks: ticks };
  }, [profileAnalysis.minElev, profileAnalysis.maxElev]);

  // Coordinate scaling helpers
  const getX = (distKm: number) => {
    return padding.left + (distKm / maxDistanceKm) * plotWidth;
  };

  const getY = (elevM: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, elevM));
    return padding.top + plotHeight - ((clamped - yMin) / (yMax - yMin)) * plotHeight;
  };

  // Surface polyline path
  const surfacePath = useMemo(() => {
    if (!profileAnalysis.pointsWithAngles.length) return "";
    return profileAnalysis.pointsWithAngles
      .map((p, i) => {
        const x = getX(p.distance_m / 1000.0);
        const y = getY(p.elevation_m);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [profileAnalysis.pointsWithAngles, maxDistanceKm, yMin, yMax]);

  // Filled terrain cross-section area path
  const terrainAreaPath = useMemo(() => {
    if (!profileAnalysis.pointsWithAngles.length) return "";
    const firstX = getX(0);
    const lastX = getX(profileAnalysis.maxDistM / 1000.0);
    const bottomY = padding.top + plotHeight;

    const surfacePoints = profileAnalysis.pointsWithAngles
      .map((p) => {
        const x = getX(p.distance_m / 1000.0);
        const y = getY(p.elevation_m);
        return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

    return `M ${firstX.toFixed(1)} ${bottomY.toFixed(1)} ${surfacePoints} L ${lastX.toFixed(1)} ${bottomY.toFixed(1)} Z`;
  }, [profileAnalysis.pointsWithAngles, maxDistanceKm, yMin, yMax, plotHeight]);

  // Line-of-sight sightline path
  // z_LOS(r) = z_mast + r * tan(theta_peak) + (r^2 / 2R)
  const sightlinePath = useMemo(() => {
    if (!profileAnalysis.peakPoint) return "";
    const thetaRad = (profileAnalysis.peakAngleDeg * Math.PI) / 180.0;
    const tanTheta = Math.tan(thetaRad);

    const steps = 60;
    const pathSegments: string[] = [];

    for (let s = 0; s <= steps; s++) {
      const rM = (s / steps) * profileAnalysis.maxDistM;
      const rKm = rM / 1000.0;
      const curv = showCurvature ? (rM * rM) / (2.0 * R_MOON_M) : 0.0;
      const zLos = observerElev0 + rM * tanTheta + curv;

      const x = getX(rKm);
      const y = getY(zLos);
      pathSegments.push(`${s === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }

    return pathSegments.join(" ");
  }, [profileAnalysis.peakPoint, profileAnalysis.peakAngleDeg, profileAnalysis.maxDistM, observerElev0, showCurvature, maxDistanceKm, yMin, yMax]);

  // 0-degree Local Horizontal tangent baseline
  // z_horiz(r) = z_mast + (r^2 / 2R)
  const localHorizontalPath = useMemo(() => {
    const steps = 40;
    const pathSegments: string[] = [];

    for (let s = 0; s <= steps; s++) {
      const rM = (s / steps) * profileAnalysis.maxDistM;
      const rKm = rM / 1000.0;
      const curv = showCurvature ? (rM * rM) / (2.0 * R_MOON_M) : 0.0;
      const zHoriz = observerElev0 + curv;

      const x = getX(rKm);
      const y = getY(zHoriz);
      pathSegments.push(`${s === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }

    return pathSegments.join(" ");
  }, [profileAnalysis.maxDistM, observerElev0, showCurvature, maxDistanceKm, yMin, yMax]);

  // Occultation shadow cone polygon
  const occultationShadowPath = useMemo(() => {
    if (!profileAnalysis.peakPoint || !showOccultationZone) return "";
    const peakIdx = profileAnalysis.peakIndex;
    const pts = profileAnalysis.pointsWithAngles;
    if (peakIdx >= pts.length) return "";

    const thetaRad = (profileAnalysis.peakAngleDeg * Math.PI) / 180.0;
    const tanTheta = Math.tan(thetaRad);

    // Forward path along the LOS ray from peak to max distance
    const losSegments: { x: number; y: number }[] = [];
    const steps = 30;
    const startRM = pts[peakIdx].distance_m;
    const endRM = profileAnalysis.maxDistM;

    for (let s = 0; s <= steps; s++) {
      const rM = startRM + (s / steps) * (endRM - startRM);
      const curv = showCurvature ? (rM * rM) / (2.0 * R_MOON_M) : 0.0;
      const zLos = observerElev0 + rM * tanTheta + curv;
      losSegments.push({ x: getX(rM / 1000.0), y: getY(zLos) });
    }

    // Backward path along terrain surface from max distance back to peak
    const terrainBack: { x: number; y: number }[] = [];
    for (let i = pts.length - 1; i >= peakIdx; i--) {
      terrainBack.push({
        x: getX(pts[i].distance_m / 1000.0),
        y: getY(pts[i].elevation_m),
      });
    }

    if (!losSegments.length || !terrainBack.length) return "";

    const pathStr =
      `M ${losSegments[0].x.toFixed(1)} ${losSegments[0].y.toFixed(1)} ` +
      losSegments.slice(1).map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") +
      " " +
      terrainBack.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") +
      " Z";

    return pathStr;
  }, [profileAnalysis.peakPoint, profileAnalysis.peakIndex, profileAnalysis.pointsWithAngles, profileAnalysis.peakAngleDeg, profileAnalysis.maxDistM, observerElev0, showCurvature, showOccultationZone, maxDistanceKm, yMin, yMax]);

  // Hover point details
  const activeHoverPoint = useMemo(() => {
    if (hoverIndex === null || !profileAnalysis.pointsWithAngles[hoverIndex]) {
      return null;
    }
    const pt = profileAnalysis.pointsWithAngles[hoverIndex];
    const prev = hoverIndex > 0 ? profileAnalysis.pointsWithAngles[hoverIndex - 1] : pt;
    const dDist = Math.max(1, pt.distance_m - prev.distance_m);
    const dElev = pt.elevation_m - prev.elevation_m;
    const slopeDeg = (Math.atan2(Math.abs(dElev), dDist) * 180.0) / Math.PI;

    return {
      ...pt,
      distKm: (pt.distance_m / 1000.0).toFixed(2),
      elevM: pt.elevation_m.toFixed(1),
      deltaZ: (pt.elevation_m - groundElev0).toFixed(1),
      angleDeg: pt.angleDeg.toFixed(2),
      slopeDeg: slopeDeg.toFixed(1),
    };
  }, [hoverIndex, profileAnalysis.pointsWithAngles, groundElev0]);

  // Check if Sun and Earth vectors are in this direction sector
  const celestialStatus = useMemo(() => {
    if (sunAzimuth === undefined || sunElevation === undefined) return null;
    const dirDeg = activeDirection.deg;

    // Angular difference to direction
    const sunDiff = Math.abs(((sunAzimuth - dirDeg + 180) % 360) - 180);
    const isSunNear = sunDiff <= 45.0;
    const isSunClear = sunElevation >= profileAnalysis.peakAngleDeg;

    let earthInfo = null;
    if (earthAzimuth !== undefined && earthElevation !== undefined) {
      const earthDiff = Math.abs(((earthAzimuth - dirDeg + 180) % 360) - 180);
      const isEarthNear = earthDiff <= 45.0;
      const isEarthClear = earthElevation >= profileAnalysis.peakAngleDeg;
      earthInfo = {
        isNear: isEarthNear,
        isClear: isEarthClear,
        diff: earthDiff.toFixed(1),
        el: earthElevation.toFixed(2),
        az: earthAzimuth.toFixed(1),
      };
    }

    return {
      sun: {
        isNear: isSunNear,
        isClear: isSunClear,
        diff: sunDiff.toFixed(1),
        el: sunElevation.toFixed(2),
        az: sunAzimuth.toFixed(1),
      },
      earth: earthInfo,
    };
  }, [sunAzimuth, sunElevation, earthAzimuth, earthElevation, activeDirection.deg, profileAnalysis.peakAngleDeg]);

  // Fallback if no LOLA data exists
  if (!siteData) {
    return (
      <div className={`p-6 rounded-2xl bg-space-900 border border-slate-800 text-center space-y-3 ${className}`}>
        <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
        <h4 className="text-base font-semibold text-white">LOLA DEM Topography Not Found</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Physical LOLA elevation cross-sections for site <code className="text-cyan-300">{siteId}</code> could not be loaded from <code className="text-slate-300">web/data/real_lola_horizons.json</code>.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Controls & 8-Compass Direction Selector */}
      <div className="p-4 sm:p-5 rounded-2xl bg-space-900/95 border border-slate-800 shadow-xl space-y-4">
        {/* Header Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-inner">
              <Mountain className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  LOLA DEM Radial Topography Profile (20 km Cross-Section)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-semibold">
                  NASA PDS 80m GDR
                </span>
              </div>
              <p className="text-xs text-slate-400">
                High-resolution terrain elevation vs distance along 8 radial azimuth bearings from lander touchdown origin
              </p>
            </div>
          </div>

          {/* Site Quick Selector (if multi-site callback is provided) */}
          {onSelectSite && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">Site:</span>
              <select
                value={siteId}
                onChange={(e) => onSelectSite(e.target.value)}
                className="bg-space-950 border border-slate-700 text-xs rounded-lg px-2.5 py-1 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
              >
                {CANDIDATE_SITES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 8-Direction Compass Selector Buttons */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-cyan-400" />
              Select Radial Bearing (8 Compass Headings):
            </span>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span>Dominant Obstacle:</span>
              <span className="text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30">
                Az {siteData.metrics.dominant_obstacle_azimuth_deg}° (+{siteData.metrics.max_horizon_elevation_deg}°)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {COMPASS_DIRECTIONS.map((dir) => {
              const isSelected = selectedAzimuthKey === dir.key;
              const isDominantSector = dir.key === closestCompassKey;

              return (
                <button
                  key={dir.key}
                  onClick={() => {
                    setSelectedAzimuthKey(dir.key);
                    setHoverIndex(null);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all relative overflow-hidden ${
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-md shadow-cyan-950/50"
                      : "bg-space-950/70 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {/* Dominant sector marker badge */}
                  {isDominantSector && (
                    <span
                      title="Sector containing dominant topographic obstacle"
                      className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-400 animate-pulse"
                    />
                  )}

                  <span className="font-bold text-sm tracking-wider font-mono">
                    {dir.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {dir.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visibility & Model Display Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSightline(!showSightline)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                showSightline
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300 font-medium"
                  : "bg-slate-800/40 border-slate-700/60 text-slate-400"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              LOS Ray ({profileAnalysis.peakAngleDeg >= 0 ? `+${profileAnalysis.peakAngleDeg.toFixed(1)}` : profileAnalysis.peakAngleDeg.toFixed(1)}°)
            </button>

            <button
              onClick={() => setShowOccultationZone(!showOccultationZone)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                showOccultationZone
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-300 font-medium"
                  : "bg-slate-800/40 border-slate-700/60 text-slate-400"
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Occultation Cone
            </button>

            <button
              onClick={() => setShowLocalHorizontal(!showLocalHorizontal)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                showLocalHorizontal
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-medium"
                  : "bg-slate-800/40 border-slate-700/60 text-slate-400"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              0° Local Horizon
            </button>

            <button
              onClick={() => setShowCurvature(!showCurvature)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                showCurvature
                  ? "bg-purple-500/20 border-purple-500/40 text-purple-300 font-medium"
                  : "bg-slate-800/40 border-slate-700/60 text-slate-400"
              }`}
              title="Includes lunar spherical curvature drop (r^2 / 2R_moon)"
            >
              <Navigation className="h-3.5 w-3.5" />
              Lunar Curvature {showCurvature ? "(On)" : "(Flat)"}
            </button>
          </div>

          {/* Quick Stats readout for active direction */}
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300 bg-space-950 px-3 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400">Mast Elevation:</span>
            <span className="text-cyan-300 font-semibold">{observerElev0.toFixed(1)} m</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Peak Angle:</span>
            <span className={`font-semibold ${profileAnalysis.peakAngleDeg > 3.0 ? "text-rose-400" : profileAnalysis.peakAngleDeg > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {profileAnalysis.peakAngleDeg >= 0 ? `+${profileAnalysis.peakAngleDeg.toFixed(2)}` : profileAnalysis.peakAngleDeg.toFixed(2)}°
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Peak Dist:</span>
            <span className="text-white font-semibold">{profileAnalysis.peakDistanceKm.toFixed(2)} km</span>
          </div>
        </div>

        {/* Interactive SVG Cross-Section Profile */}
        <div className="relative w-full overflow-x-auto bg-space-950 rounded-xl p-3 border border-slate-800 select-none">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto min-w-[720px]"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = (clickX - padding.left) / plotWidth;
              if (ratio >= 0 && ratio <= 1 && profileAnalysis.pointsWithAngles.length > 0) {
                const idx = Math.min(
                  profileAnalysis.pointsWithAngles.length - 1,
                  Math.max(0, Math.round(ratio * (profileAnalysis.pointsWithAngles.length - 1)))
                );
                setHoverIndex(idx);
              }
            }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              {/* Terrain fill gradient */}
              <linearGradient id="lolaTerrainGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                <stop offset="40%" stopColor="#1E293B" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#0B0F17" stopOpacity="0.98" />
              </linearGradient>

              {/* Occultation cone pattern / gradient */}
              <linearGradient id="occultationGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.05" />
              </linearGradient>

              {/* Glow filter for peak obstacle indicator */}
              <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Elevation Gridlines */}
            {yTicks.map((elev) => {
              const y = getY(elev);
              const isDatum = elev === 0;
              const isLanderElev = Math.abs(elev - Math.round(groundElev0 / 100) * 100) < 50;

              return (
                <g key={elev}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke={isDatum ? "#64748B" : isLanderElev ? "#334155" : "#1E293B"}
                    strokeWidth={isDatum ? 1.5 : 1}
                    strokeDasharray={isDatum ? "4 4" : "none"}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3.5}
                    fill={isDatum ? "#E2E8F0" : "#64748B"}
                    fontSize="9.5"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {elev > 0 ? `+${elev.toLocaleString()}m` : `${elev.toLocaleString()}m`}
                  </text>
                </g>
              );
            })}

            {/* Vertical Distance Gridlines (Every 2.5 km) */}
            {[0, 2.5, 5.0, 7.5, 10.0, 12.5, 15.0, 17.5, 20.0].map((km) => {
              const x = getX(km);
              return (
                <g key={km}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + plotHeight}
                    stroke="#1E293B"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={x}
                    y={padding.top + plotHeight + 18}
                    fill="#94A3B8"
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {km.toFixed(1)} km
                  </text>
                </g>
              );
            })}

            {/* Occultation Shadow Cone Polygon */}
            {showOccultationZone && occultationShadowPath && (
              <path
                d={occultationShadowPath}
                fill="url(#occultationGrad)"
                stroke="#F43F5E"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}

            {/* Filled Terrain Area */}
            <path d={terrainAreaPath} fill="url(#lolaTerrainGrad)" />

            {/* Terrain Surface Profile Stroke */}
            <path
              d={surfacePath}
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 0° Local Horizontal Tangent Baseline */}
            {showLocalHorizontal && (
              <g>
                <path
                  d={localHorizontalPath}
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                <text
                  x={chartWidth - padding.right - 5}
                  y={getY(observerElev0 + (profileAnalysis.maxDistM * profileAnalysis.maxDistM) / (2.0 * R_MOON_M)) - 8}
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  Local Horizontal (0.0° Tangent)
                </text>
              </g>
            )}

            {/* Line-of-Sight Sightline Ray */}
            {showSightline && sightlinePath && (
              <g>
                <path
                  d={sightlinePath}
                  fill="none"
                  stroke={profileAnalysis.peakAngleDeg > 3.0 ? "#F43F5E" : "#F59E0B"}
                  strokeWidth="1.8"
                  strokeDasharray="5 3"
                  filter="url(#glowFilter)"
                />
              </g>
            )}

            {/* Peak Terrain Obstacle Point Marker */}
            {profileAnalysis.peakPoint && (
              <g>
                {/* Concentric indicator rings */}
                <circle
                  cx={getX(profileAnalysis.peakDistanceKm)}
                  cy={getY(profileAnalysis.peakElevationM)}
                  r="5"
                  fill="#F59E0B"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <circle
                  cx={getX(profileAnalysis.peakDistanceKm)}
                  cy={getY(profileAnalysis.peakElevationM)}
                  r="11"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  className="animate-pulse"
                />

                {/* Peak Obstacle Callout Flag */}
                <g transform={`translate(${getX(profileAnalysis.peakDistanceKm)}, ${getY(profileAnalysis.peakElevationM) - 18})`}>
                  <rect
                    x="-65"
                    y="-16"
                    width="130"
                    height="18"
                    rx="4"
                    fill="#0F172A"
                    stroke="#F59E0B"
                    strokeWidth="1"
                    fillOpacity="0.9"
                  />
                  <text
                    x="0"
                    y="-4"
                    fill="#FCD34D"
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    Peak: {profileAnalysis.peakAngleDeg >= 0 ? `+${profileAnalysis.peakAngleDeg.toFixed(2)}` : profileAnalysis.peakAngleDeg.toFixed(2)}° @ {profileAnalysis.peakDistanceKm.toFixed(2)}km
                  </text>
                </g>
              </g>
            )}

            {/* Lander Mast & Origin at r=0 */}
            <g>
              {/* Ground contact pad at (0, groundElev0) */}
              <circle
                cx={getX(0)}
                cy={getY(groundElev0)}
                r="4"
                fill="#64748B"
                stroke="#94A3B8"
                strokeWidth="1.5"
              />

              {/* Lander gold body rectangle */}
              <rect
                x={getX(0) - 7}
                y={getY(groundElev0) - 8}
                width="14"
                height="8"
                rx="2"
                fill="#D97706"
                stroke="#FCD34D"
                strokeWidth="1"
              />

              {/* Lander vertical mast rod (h0 = 2m) */}
              <line
                x1={getX(0)}
                y1={getY(groundElev0) - 8}
                x2={getX(0)}
                y2={getY(observerElev0)}
                stroke="#38BDF8"
                strokeWidth="2.5"
              />

              {/* Sensor head / mast antenna focal point */}
              <circle
                cx={getX(0)}
                cy={getY(observerElev0)}
                r="4.5"
                fill="#38BDF8"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(0)}
                cy={getY(observerElev0)}
                r="10"
                fill="#38BDF8"
                fillOpacity="0.25"
                className="animate-ping"
              />

              {/* Mast label banner */}
              <g transform={`translate(${getX(0) + 12}, ${getY(observerElev0) - 6})`}>
                <rect
                  x="0"
                  y="-14"
                  width="125"
                  height="26"
                  rx="4"
                  fill="#0B0F17"
                  stroke="#38BDF8"
                  strokeWidth="1"
                  fillOpacity="0.9"
                />
                <text
                  x="6"
                  y="-3"
                  fill="#7DD3FC"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  Lander Mast (h₀=2m)
                </text>
                <text
                  x="6"
                  y="8"
                  fill="#94A3B8"
                  fontSize="8.5"
                  fontFamily="monospace"
                >
                  Z = {observerElev0.toFixed(1)}m datum
                </text>
              </g>
            </g>

            {/* Hover inspection needle & reticle */}
            {activeHoverPoint && (
              <g>
                <line
                  x1={getX(Number(activeHoverPoint.distKm))}
                  y1={padding.top}
                  x2={getX(Number(activeHoverPoint.distKm))}
                  y2={padding.top + plotHeight}
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={getX(Number(activeHoverPoint.distKm))}
                  cy={getY(Number(activeHoverPoint.elevM))}
                  r="4.5"
                  fill="#FFFFFF"
                  stroke="#0284C7"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>

          {/* Interactive Floating Hover HUD */}
          {activeHoverPoint && (
            <div
              className="absolute pointer-events-none z-20 bg-space-950/95 border border-cyan-500/60 rounded-xl px-3 py-2 text-xs shadow-2xl backdrop-blur-md font-mono space-y-1"
              style={{
                left: `${Math.min(75, Math.max(15, (Number(activeHoverPoint.distKm) / maxDistanceKm) * 100))}%`,
                top: "16px",
              }}
            >
              <div className="flex items-center justify-between gap-3 text-cyan-300 font-bold border-b border-slate-800 pb-1">
                <span>Dist: {activeHoverPoint.distKm} km</span>
                <span className="text-slate-400">Az: {activeDirection.deg}°</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-300">
                <div>Elev: <span className="text-white font-semibold">{activeHoverPoint.elevM} m</span></div>
                <div>ΔZ: <span className="text-amber-300">{Number(activeHoverPoint.deltaZ) >= 0 ? `+${activeHoverPoint.deltaZ}` : activeHoverPoint.deltaZ} m</span></div>
                <div>LOS Angle: <span className="text-cyan-400 font-semibold">{Number(activeHoverPoint.angleDeg) >= 0 ? `+${activeHoverPoint.angleDeg}` : activeHoverPoint.angleDeg}°</span></div>
                <div>Local Slope: <span className="text-slate-400">{activeHoverPoint.slopeDeg}°</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Detailed Analysis & Obstacle Callout Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Card 1: Dominant Terrain Obstacle Callout (Global Site Metrics) */}
          <div className="p-3.5 rounded-xl bg-space-950/80 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Dominant Site Obstacle Callout
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-400 font-semibold">
                NASA LOLA
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Dominant Azimuth:</span>
                <span className="font-mono font-bold text-amber-300">
                  {siteData.metrics.dominant_obstacle_azimuth_deg}° ({getAzimuthCardinal(siteData.metrics.dominant_obstacle_azimuth_deg)})
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Peak Horizon Mask:</span>
                <span className="font-mono font-bold text-rose-400">
                  +{siteData.metrics.max_horizon_elevation_deg}°
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Mean 360° Horizon:</span>
                <span className="font-mono font-semibold text-slate-200">
                  +{siteData.metrics.mean_horizon_elevation_deg}°
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Local Terrain Slope:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {siteData.metrics.estimated_local_slope_deg}°
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Current Selected Bearing Topography Analysis */}
          <div className="p-3.5 rounded-xl bg-space-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-cyan-400" />
                Active Bearing {activeDirection.label} Analysis
              </span>
              <span className="font-mono text-[10px] text-cyan-400">
                {activeDirection.name}
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Bearing Peak Obstacle:</span>
                <span className={`font-mono font-bold ${profileAnalysis.peakAngleDeg > 3.0 ? "text-rose-400" : profileAnalysis.peakAngleDeg > 0 ? "text-amber-300" : "text-emerald-400"}`}>
                  {profileAnalysis.peakAngleDeg >= 0 ? `+${profileAnalysis.peakAngleDeg.toFixed(2)}` : profileAnalysis.peakAngleDeg.toFixed(2)}°
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Obstacle Downrange:</span>
                <span className="font-mono font-semibold text-white">
                  {profileAnalysis.peakDistanceKm.toFixed(2)} km
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Obstacle Elevation:</span>
                <span className="font-mono font-semibold text-white">
                  {profileAnalysis.peakElevationM.toFixed(1)} m (ΔZ {profileAnalysis.peakElevationM - groundElev0 >= 0 ? `+${(profileAnalysis.peakElevationM - groundElev0).toFixed(1)}` : (profileAnalysis.peakElevationM - groundElev0).toFixed(1)}m)
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Clearance Status:</span>
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                  {profileAnalysis.peakAngleDeg <= 0.0 ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      Unobstructed
                    </>
                  ) : profileAnalysis.peakAngleDeg <= 3.0 ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                      Low Ridge Mask
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                      High Massif Mask
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Real-Time Celestial Sightline Clearance */}
          <div className="p-3.5 rounded-xl bg-space-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-emerald-400" />
                Line-of-Sight Clearance
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                Touchdown Epoch
              </span>
            </div>

            {celestialStatus ? (
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Sun className="h-3.5 w-3.5 text-amber-400" />
                    Sun Vector:
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    El {celestialStatus.sun.el}° (Az {celestialStatus.sun.az}°)
                  </span>
                </div>
                {celestialStatus.earth && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Radio className="h-3.5 w-3.5 text-cyan-400" />
                      Earth Comm Vector:
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      El {celestialStatus.earth.el}° (Az {celestialStatus.earth.az}°)
                    </span>
                  </div>
                )}
                <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>
                    {celestialStatus.sun.isNear
                      ? celestialStatus.sun.isClear
                        ? `☀️ Sun bearing aligns with ${activeDirection.label}: CLEAR (+${(Number(celestialStatus.sun.el) - profileAnalysis.peakAngleDeg).toFixed(1)}°)`
                        : `⚠️ Sun bearing aligns with ${activeDirection.label}: OCCULTED by terrain`
                      : `Celestial vectors offset from this ${activeDirection.label} cross-section bearing.`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 space-y-1">
                <p>2.0m Mast clearance verified against 80m LOLA DEM elevation grid.</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Ray-casting accounts for Lunar spherical drop (ΔZ = {((20000 * 20000) / (2 * R_MOON_M)).toFixed(1)}m at 20km).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getAzimuthCardinal(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  if (norm >= 337.5 || norm < 22.5) return "N";
  if (norm >= 22.5 && norm < 67.5) return "NE";
  if (norm >= 67.5 && norm < 112.5) return "E";
  if (norm >= 112.5 && norm < 157.5) return "SE";
  if (norm >= 157.5 && norm < 202.5) return "S";
  if (norm >= 202.5 && norm < 247.5) return "SW";
  if (norm >= 247.5 && norm < 292.5) return "W";
  return "NW";
}
