"use client";

import React, { useState, useMemo } from "react";
import { TelemetryPoint, SiteSummary } from "../lib/types";
import { generateHorizonProfile } from "../lib/physics";
import { 
  Sun, 
  Radio, 
  Layers, 
  Activity, 
  Maximize2, 
  Eye, 
  Calendar, 
  Compass,
  CheckCircle2,
  AlertTriangle,
  Mountain
} from "lucide-react";
import { LolaRadialProfileViewer } from "./LolaRadialProfileViewer";

interface TelemetryChartsProps {
  telemetry: TelemetryPoint[];
  summary: SiteSummary;
  currentEpochIndex: number;
  onEpochClick: (index: number) => void;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  telemetry,
  summary,
  currentEpochIndex,
  onEpochClick,
}) => {
  const [activeTab, setActiveTab] = useState<"elevation" | "skyline" | "radial">("elevation");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const currentPoint = telemetry[currentEpochIndex] || telemetry[0];

  // Pre-calculate summary stats for this site's telemetry
  const stateCounts = useMemo(() => {
    let dual = 0;
    let sun = 0;
    let comm = 0;
    let dark = 0;
    telemetry.forEach((t) => {
      if (t.state === "Dual Operational") dual++;
      else if (t.state === "Sun Only") sun++;
      else if (t.state === "Comm Only") comm++;
      else if (t.state === "Blackout") dark++;
    });
    const total = telemetry.length || 1;
    return {
      dualHours: dual,
      dualPct: ((dual / total) * 100).toFixed(1),
      sunHours: sun,
      sunPct: ((sun / total) * 100).toFixed(1),
      commHours: comm,
      commPct: ((comm / total) * 100).toFixed(1),
      darkHours: dark,
      darkPct: ((dark / total) * 100).toFixed(1),
    };
  }, [telemetry]);

  // Elevation Chart bounds
  const chartWidth = 900;
  const chartHeight = 320;
  const padding = { top: 25, right: 30, bottom: 40, left: 55 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Min and max elevations across 30 days
  const minEl = -6.0;
  const maxEl = 6.0;

  const getX = (index: number) => {
    return padding.left + (index / (telemetry.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minEl, Math.min(maxEl, val));
    return padding.top + plotHeight - ((clamped - minEl) / (maxEl - minEl)) * plotHeight;
  };

  const zeroY = getY(0);

  // Generate SVG path strings
  const sunPath = useMemo(() => {
    if (!telemetry.length) return "";
    return telemetry
      .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(p.sEl).toFixed(1)}`)
      .join(" ");
  }, [telemetry]);

  const sunHorizonPath = useMemo(() => {
    if (!telemetry.length) return "";
    return telemetry
      .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(p.sHz).toFixed(1)}`)
      .join(" ");
  }, [telemetry]);

  const earthPath = useMemo(() => {
    if (!telemetry.length) return "";
    return telemetry
      .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(p.eEl).toFixed(1)}`)
      .join(" ");
  }, [telemetry]);

  const earthHorizonPath = useMemo(() => {
    if (!telemetry.length) return "";
    return telemetry
      .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(p.eHz).toFixed(1)}`)
      .join(" ");
  }, [telemetry]);

  // 360-Degree Cylindrical Horizon Skyline Profile
  const skylinePoints = useMemo(() => {
    return generateHorizonProfile(summary.elevation_m, summary.slope_deg);
  }, [summary.elevation_m, summary.slope_deg]);

  const skylineWidth = 800;
  const skylineHeight = 240;
  const skylinePad = { top: 30, right: 30, bottom: 35, left: 45 };
  const skyPlotW = skylineWidth - skylinePad.left - skylinePad.right;
  const skyPlotH = skylineHeight - skylinePad.top - skylinePad.bottom;
  const maxSkyDeg = 5.0;

  const skyPath = useMemo(() => {
    return (
      `M ${skylinePad.left} ${skylinePad.top + skyPlotH} ` +
      skylinePoints
        .map((pt) => {
          const x = skylinePad.left + (pt.azimuth / 360.0) * skyPlotW;
          const y = skylinePad.top + skyPlotH - (pt.horizonDeg / maxSkyDeg) * skyPlotH;
          return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(" ") +
      ` L ${skylinePad.left + skyPlotW} ${skylinePad.top + skyPlotH} Z`
    );
  }, [skylinePoints]);

  return (
    <div className="w-full space-y-4">
      {/* Chart Container Panel */}
      <div className="rounded-2xl bg-space-900/90 border border-slate-800 shadow-xl overflow-hidden">
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:px-5 border-b border-slate-800 bg-space-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Real-Time Mission Telemetry & Obstruction Matrix
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  30-Day Window (720h)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Topocentric Solar/Earth Elevation Angles vs LOLA Terrain Horizon Mask
              </p>
            </div>
          </div>

          {/* View Mode Switch */}
          <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab("elevation")}
              className={`px-3 py-1 rounded-md transition whitespace-nowrap ${
                activeTab === "elevation"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Elevation vs Terrain Mask
            </button>
            <button
              onClick={() => setActiveTab("skyline")}
              className={`px-3 py-1 rounded-md transition whitespace-nowrap ${
                activeTab === "skyline"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              360° Cylindrical Skyline (TRN)
            </button>
            <button
              onClick={() => setActiveTab("radial")}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition whitespace-nowrap ${
                activeTab === "radial"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Mountain className="h-3 w-3 text-cyan-400" />
              LOLA Radial Cross-Section (20 km)
            </button>
          </div>
        </div>

        {/* Tab 1: Elevation vs Horizon Curves */}
        {activeTab === "elevation" ? (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Legend & Current Scrubbed Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-slate-300 font-medium">Sun Elevation (°)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 border-t-2 border-dashed border-amber-600" />
                  <span className="text-slate-400">Sun Terrain Obstacle H(θ)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-cyan-400" />
                  <span className="text-slate-300 font-medium">Earth Elevation (°)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 border-t-2 border-dashed border-blue-500" />
                  <span className="text-slate-400">Earth Terrain Obstacle H(θ)</span>
                </div>
              </div>

              {/* Instantaneous Scrub Value Readout */}
              <div className="flex items-center gap-2 font-mono text-xs text-slate-300 bg-space-950/80 px-3 py-1 rounded-lg border border-slate-800">
                <span className="text-amber-400">☀️ Sun: {currentPoint.sEl >= 0 ? `+${currentPoint.sEl}` : currentPoint.sEl}°</span>
                <span className="text-slate-600">|</span>
                <span className="text-cyan-400">🌍 Earth: {currentPoint.eEl >= 0 ? `+${currentPoint.eEl}` : currentPoint.eEl}°</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400 font-semibold">{currentPoint.state}</span>
              </div>
            </div>

            {/* SVG Elevation Chart */}
            <div className="relative w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto min-w-[700px] select-none"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = (clickX - padding.left) / plotWidth;
                  if (ratio >= 0 && ratio <= 1) {
                    const idx = Math.round(ratio * (telemetry.length - 1));
                    onEpochClick(idx);
                  }
                }}
              >
                {/* Horizontal Grid lines */}
                {[-6, -4, -2, 0, 2, 4, 6].map((deg) => {
                  const y = getY(deg);
                  const isZero = deg === 0;
                  return (
                    <g key={deg}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke={isZero ? "#64748B" : "#1E293B"}
                        strokeWidth={isZero ? 1.5 : 1}
                        strokeDasharray={isZero ? "4 4" : "none"}
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3}
                        fill={isZero ? "#E2E8F0" : "#64748B"}
                        fontSize="10"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {deg > 0 ? `+${deg}°` : `${deg}°`}
                      </text>
                    </g>
                  );
                })}

                {/* Day Vertical Ticks (Every 5 days = 120 hours) */}
                {[0, 5, 10, 15, 20, 25, 30].map((day) => {
                  const hourIdx = Math.min(day * 24, telemetry.length - 1);
                  const x = getX(hourIdx);
                  return (
                    <g key={day}>
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
                        fill="#64748B"
                        fontSize="10"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        Nov {day + 1} (D+{day})
                      </text>
                    </g>
                  );
                })}

                {/* Shading below zero (Occulted) */}
                <rect
                  x={padding.left}
                  y={zeroY}
                  width={plotWidth}
                  height={padding.top + plotHeight - zeroY}
                  fill="#F43F5E"
                  fillOpacity="0.04"
                />

                {/* Sun Elevation Line */}
                <path d={sunPath} fill="none" stroke="#F59E0B" strokeWidth="2.5" />
                {/* Sun Horizon Obstruction Line */}
                <path d={sunHorizonPath} fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Earth Elevation Line */}
                <path d={earthPath} fill="none" stroke="#38BDF8" strokeWidth="2.5" />
                {/* Earth Horizon Obstruction Line */}
                <path d={earthHorizonPath} fill="none" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Active Epoch Vertical Cursor Line */}
                <line
                  x1={getX(currentEpochIndex)}
                  y1={padding.top}
                  x2={getX(currentEpochIndex)}
                  y2={padding.top + plotHeight}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={getX(currentEpochIndex)}
                  cy={getY(currentPoint.sEl)}
                  r="4.5"
                  fill="#F59E0B"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <circle
                  cx={getX(currentEpochIndex)}
                  cy={getY(currentPoint.eEl)}
                  r="4.5"
                  fill="#38BDF8"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              </svg>
            </div>

            {/* 4-Way Operational State Timeline Bar (Continuous Gantt Strip) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  Continuous 30-Day Operational State Timeline
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Click anywhere on strip to scrub timeline
                </span>
              </div>

              {/* Timeline Strip */}
              <div
                className="w-full h-8 rounded-lg bg-space-950 border border-slate-800 flex overflow-hidden cursor-pointer relative shadow-inner"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = clickX / rect.width;
                  const idx = Math.min(telemetry.length - 1, Math.max(0, Math.floor(ratio * telemetry.length)));
                  onEpochClick(idx);
                }}
              >
                {telemetry.map((pt, i) => {
                  const stateColor =
                    pt.state === "Dual Operational"
                      ? "#10B981"
                      : pt.state === "Sun Only"
                      ? "#F59E0B"
                      : pt.state === "Comm Only"
                      ? "#0EA5E9"
                      : "#EF4444";
                  return (
                    <div
                      key={i}
                      style={{
                        backgroundColor: stateColor,
                        width: `${100 / telemetry.length}%`,
                      }}
                      className="h-full hover:opacity-80 transition-opacity"
                      title={`${pt.dt} | ${pt.state}`}
                    />
                  );
                })}

                {/* Scrubber needle */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-10"
                  style={{
                    left: `${(currentEpochIndex / telemetry.length) * 100}%`,
                  }}
                />
              </div>

              {/* State Breakdown Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Dual-Op Window
                  </span>
                  <span className="font-mono font-bold">
                    {stateCounts.dualHours}h ({stateCounts.dualPct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Solar Power Only
                  </span>
                  <span className="font-mono font-bold">
                    {stateCounts.sunHours}h ({stateCounts.sunPct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    Direct Comm Only
                  </span>
                  <span className="font-mono font-bold">
                    {stateCounts.commHours}h ({stateCounts.commPct}%)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Mission Blackout
                  </span>
                  <span className="font-mono font-bold">
                    {stateCounts.darkHours}h ({stateCounts.darkPct}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "skyline" ? (
          /* Tab 2: 360-Degree Cylindrical Skyline (Terrain Relative Navigation) */
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <p className="text-slate-300">
                Synthetic 360° LOLA terrain horizon mask surrounding the landing site. Used by optical cameras and TRN algorithms to verify celestial line-of-sight clearance.
              </p>
              <div className="flex items-center gap-3 font-mono text-xs text-slate-300">
                <span className="text-amber-400">Sun Az: {currentPoint.sAz.toFixed(1)}° | El: {currentPoint.sEl.toFixed(2)}°</span>
                <span className="text-cyan-400">Earth Az: {currentPoint.eAz.toFixed(1)}° | El: {currentPoint.eEl.toFixed(2)}°</span>
              </div>
            </div>

            <div className="relative w-full overflow-x-auto bg-space-950 rounded-xl p-2 border border-slate-800">
              <svg
                viewBox={`0 0 ${skylineWidth} ${skylineHeight}`}
                className="w-full h-auto min-w-[650px] select-none"
              >
                <defs>
                  <linearGradient id="terrainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#334155" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
                  </linearGradient>
                </defs>

                {/* Zero Horizon Line */}
                <line
                  x1={skylinePad.left}
                  y1={skylinePad.top + skyPlotH}
                  x2={skylinePad.left + skyPlotW}
                  y2={skylinePad.top + skyPlotH}
                  stroke="#64748B"
                  strokeWidth="1.5"
                />

                {/* Azimuth tick marks (North 0°, East 90°, South 180°, West 270°, North 360°) */}
                {[0, 45, 90, 135, 180, 225, 270, 315, 360].map((az) => {
                  const x = skylinePad.left + (az / 360.0) * skyPlotW;
                  const label =
                    az === 0 || az === 360
                      ? "N (0°)"
                      : az === 90
                      ? "E (90°)"
                      : az === 180
                      ? "S (180°)"
                      : az === 270
                      ? "W (270°)"
                      : `${az}°`;
                  return (
                    <g key={az}>
                      <line
                        x1={x}
                        y1={skylinePad.top}
                        x2={x}
                        y2={skylinePad.top + skyPlotH}
                        stroke="#1E293B"
                        strokeWidth="1"
                        strokeDasharray="2 3"
                      />
                      <text
                        x={x}
                        y={skylinePad.top + skyPlotH + 18}
                        fill="#94A3B8"
                        fontSize="10"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {/* Filled Terrain Profile */}
                <path d={skyPath} fill="url(#terrainGrad)" stroke="#64748B" strokeWidth="1.5" />

                {/* Sun Celestial Disc Position */}
                {(() => {
                  const sunX = skylinePad.left + ((currentPoint.sAz % 360) / 360.0) * skyPlotW;
                  const clampedEl = Math.max(-1.0, Math.min(maxSkyDeg, currentPoint.sEl));
                  const sunY = skylinePad.top + skyPlotH - (clampedEl / maxSkyDeg) * skyPlotH;
                  const isVisible = currentPoint.sEl >= currentPoint.sHz;

                  return (
                    <g>
                      <circle cx={sunX} cy={sunY} r="7" fill="#F59E0B" />
                      <circle cx={sunX} cy={sunY} r="14" fill="#F59E0B" fillOpacity="0.2" className="animate-ping" />
                      <text
                        x={sunX}
                        y={sunY - 12}
                        fill="#FCD34D"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        Sun ({isVisible ? "VISIBLE" : "BLOCKED"})
                      </text>
                    </g>
                  );
                })()}

                {/* Earth Celestial Disc Position */}
                {(() => {
                  const earthX = skylinePad.left + ((currentPoint.eAz % 360) / 360.0) * skyPlotW;
                  const clampedEl = Math.max(-1.0, Math.min(maxSkyDeg, currentPoint.eEl));
                  const earthY = skylinePad.top + skyPlotH - (clampedEl / maxSkyDeg) * skyPlotH;
                  const isVisible = currentPoint.eEl >= currentPoint.eHz;

                  return (
                    <g>
                      <circle cx={earthX} cy={earthY} r="6" fill="#38BDF8" />
                      <text
                        x={earthX}
                        y={earthY - 12}
                        fill="#7DD3FC"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        Earth ({isVisible ? "LINK OK" : "OCCULTED"})
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>
        ) : (
          /* Tab 3: Interactive LOLA DEM Radial Topography Profile (20 km Cross-Section) */
          <div className="p-3 sm:p-5">
            <LolaRadialProfileViewer
              siteId={summary.site_id}
              siteName={summary.site_name}
              sunAzimuth={currentPoint.sAz}
              sunElevation={currentPoint.sEl}
              earthAzimuth={currentPoint.eAz}
              earthElevation={currentPoint.eEl}
            />
          </div>
        )}
      </div>
    </div>
  );
};
