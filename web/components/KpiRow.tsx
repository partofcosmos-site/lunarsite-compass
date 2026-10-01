"use client";

import React from "react";
import { SiteSummary } from "../lib/types";
import { Sun, Radio, Activity, Moon, Award, Mountain, Compass, ShieldAlert } from "lucide-react";

interface KpiRowProps {
  summary: SiteSummary;
  currentStatus?: "Dual Operational" | "Sun Only" | "Comm Only" | "Blackout";
  sunElevation?: number;
  earthElevation?: number;
}

export const KpiRow: React.FC<KpiRowProps> = ({
  summary,
  currentStatus = "Dual Operational",
  sunElevation,
  earthElevation,
}) => {
  const statusColors = {
    "Dual Operational": {
      bg: "bg-emerald-950/60 border-emerald-500/40 text-emerald-300",
      dot: "bg-emerald-400 animate-pulse",
      label: "Dual Operational (Power + Comm)",
    },
    "Sun Only": {
      bg: "bg-amber-950/60 border-amber-500/40 text-amber-300",
      dot: "bg-amber-400",
      label: "Solar Power Only (Earth Occulted)",
    },
    "Comm Only": {
      bg: "bg-cyan-950/60 border-cyan-500/40 text-cyan-300",
      dot: "bg-cyan-400",
      label: "Direct Comm Only (Cryo Darkness)",
    },
    Blackout: {
      bg: "bg-rose-950/60 border-rose-500/40 text-rose-300",
      dot: "bg-rose-500 animate-ping",
      label: "Mission Blackout (Critical Battery)",
    },
  };

  const activeStatus = statusColors[currentStatus] || statusColors["Dual Operational"];

  return (
    <div className="w-full space-y-3">
      {/* Site Metadata & Real-time Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-space-900/80 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">
                {summary.site_name}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                {summary.site_id}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-0.5">
              <span>
                Coordinates: <strong className="text-slate-200">{Math.abs(summary.latitude).toFixed(3)}°S, {summary.longitude.toFixed(3)}°E</strong>
              </span>
              <span>
                Elevation: <strong className="text-slate-200">+{summary.elevation_m} m</strong>
              </span>
              <span className="flex items-center gap-1">
                Slope: 
                <strong className={summary.slope_deg < 10 ? "text-emerald-400" : summary.slope_deg < 15 ? "text-amber-400" : "text-rose-400"}>
                  {summary.slope_deg}° {summary.slope_deg < 10 ? "(Safe <10°)" : "(Steep)"}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Snapshot Badge */}
        <div className="flex flex-wrap items-center gap-2">
          {sunElevation !== undefined && (
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5 text-amber-400" />
              Sun: <strong>{sunElevation >= 0 ? `+${sunElevation.toFixed(2)}` : sunElevation.toFixed(2)}°</strong>
            </span>
          )}
          {earthElevation !== undefined && (
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-cyan-400" />
              Earth: <strong>{earthElevation >= 0 ? `+${earthElevation.toFixed(2)}` : earthElevation.toFixed(2)}°</strong>
            </span>
          )}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${activeStatus.bg}`}>
            <span className={`h-2 w-2 rounded-full ${activeStatus.dot}`} />
            {activeStatus.label}
          </div>
        </div>
      </div>

      {/* 5 High-Impact Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: Continuous Sunlight */}
        <div className="p-3.5 rounded-xl bg-space-900/60 border border-slate-800 hover:border-amber-500/40 transition shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition text-amber-400">
            <Sun className="h-12 w-12" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sun className="h-3.5 w-3.5 text-amber-400" />
            Max Sun Window
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-300">
              {summary.max_continuous_illumination_days.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-medium">days</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-400/90 font-mono">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              {summary.illumination_percentage}% total daylight
            </span>
          </div>
        </div>

        {/* Metric 2: Continuous Earth Comm */}
        <div className="p-3.5 rounded-xl bg-space-900/60 border border-slate-800 hover:border-cyan-500/40 transition shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition text-cyan-400">
            <Radio className="h-12 w-12" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-cyan-400" />
            Max Earth Comm
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-cyan-300">
              {summary.max_continuous_comm_days.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-medium">days</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-cyan-400/90 font-mono">
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
              {summary.comm_percentage}% total contact
            </span>
          </div>
        </div>

        {/* Metric 3: Dual-Op Window */}
        <div className="p-3.5 rounded-xl bg-space-900/60 border border-slate-800 hover:border-emerald-500/40 transition shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition text-emerald-400">
            <Activity className="h-12 w-12" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            Dual-Op Window
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-300">
              {summary.max_continuous_dual_days.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-medium">days</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400/90 font-mono">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              {summary.dual_operational_percentage}% overlap
            </span>
          </div>
        </div>

        {/* Metric 4: Max Dark Survival */}
        <div className="p-3.5 rounded-xl bg-space-900/60 border border-slate-800 hover:border-rose-500/40 transition shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition text-rose-400">
            <Moon className="h-12 w-12" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Moon className="h-3.5 w-3.5 text-rose-400" />
            Max Night Duration
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-300">
              {summary.max_continuous_night_hours.toFixed(0)}
            </span>
            <span className="text-xs text-slate-400 font-medium">hours</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400/90 font-mono">
            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
              {summary.blackout_hours}h total blackout
            </span>
          </div>
        </div>

        {/* Metric 5: CLPS Suitability Score */}
        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-gradient-to-br from-space-900/80 to-cyan-950/30 border border-cyan-500/30 hover:border-cyan-400/60 transition shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition text-cyan-300">
            <Award className="h-12 w-12" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-cyan-400" />
            CLPS Suitability
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">
              {summary.clps_suitability_score.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ 100</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                summary.clps_suitability_score >= 80
                  ? "bg-gradient-to-r from-cyan-400 to-emerald-400"
                  : summary.clps_suitability_score >= 60
                  ? "bg-gradient-to-r from-amber-400 to-cyan-400"
                  : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(100, summary.clps_suitability_score)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
