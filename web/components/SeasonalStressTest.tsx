"use client";

import React, { useState, useMemo } from "react";
import { SeasonalBenchmark } from "../lib/types";
import { Snowflake, Sun, Radio, Activity, AlertTriangle, ArrowUpDown, ChevronRight } from "lucide-react";

interface SeasonalStressTestProps {
  seasonalData: SeasonalBenchmark[];
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
}

export const SeasonalStressTest: React.FC<SeasonalStressTestProps> = ({
  seasonalData,
  selectedSiteId,
  onSelectSite,
}) => {
  const seasons = useMemo(() => {
    return Array.from(new Set(seasonalData.map((d) => d.season)));
  }, [seasonalData]);

  const [activeSeason, setActiveSeason] = useState<string>(seasons[0] || "Summer Solstice (Peak Sun)");

  const filteredSeasonData = useMemo(() => {
    return seasonalData
      .filter((d) => d.season === activeSeason)
      .sort((a, b) => b.clps_suitability_score - a.clps_suitability_score);
  }, [seasonalData, activeSeason]);

  // Seasonal trends across all 4 seasons for each site
  const siteTrends = useMemo(() => {
    const map: Record<string, { name: string; seasons: Record<string, number> }> = {};
    seasonalData.forEach((d) => {
      if (!map[d.site_id]) {
        map[d.site_id] = { name: d.site_name, seasons: {} };
      }
      map[d.site_id].seasons[d.season] = d.illumination_percentage;
    });
    return Object.values(map);
  }, [seasonalData]);

  return (
    <div className="w-full space-y-5">
      {/* Header Banner */}
      <div className="rounded-2xl bg-space-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Snowflake className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Four-Season Orbital Stress Test & Cryogenic Night Survival
                <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300">
                  Annual Oscillation: ±1.54°
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Libration and solar declination shifts alter continuous sunlight from peak summer to extreme winter darkness
              </p>
            </div>
          </div>

          {/* Season Switcher Pills */}
          <div className="flex items-center gap-1 bg-space-950 p-1 rounded-xl border border-slate-800 text-xs">
            {seasons.map((season) => (
              <button
                key={season}
                onClick={() => setActiveSeason(season)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeSeason === season
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {season.split("(")[0].trim()}
              </button>
            ))}
          </div>
        </div>

        {/* Season Impact Summary Note */}
        <div className="p-3 rounded-xl bg-space-950/70 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Orbital Precession & Declination Vulnerability:</strong> While Peak Near Shackleton (Peak B) maintains over 86% sunlight even during Winter Solstice due to extreme relief (+4,200m), low-elevation plateau sites like Mons Mouton undergo severe illumination drops (down to 12% in deep winter), requiring nuclear RHUs or high-capacity cryogenic battery reserves.
          </div>
        </div>
      </div>

      {/* Season Benchmark Table */}
      <div className="rounded-2xl bg-space-900/90 border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 sm:px-5 border-b border-slate-800 bg-space-950/60 flex items-center justify-between">
          <h4 className="text-sm font-bold text-white">
            Performance Metrics: {activeSeason}
          </h4>
          <span className="text-xs font-mono text-slate-400">
            Sorted by Seasonal Suitability Score
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-space-950 text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Landing Site</th>
                <th className="py-3 px-4">Sunlight (%)</th>
                <th className="py-3 px-4">Max Continuous Sun</th>
                <th className="py-3 px-4">Earth Comm (%)</th>
                <th className="py-3 px-4">Max Continuous Comm</th>
                <th className="py-3 px-4">Dual-Op (%)</th>
                <th className="py-3 px-4">Max Cryo Night</th>
                <th className="py-3 px-4 text-right">Season Score (/100)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredSeasonData.map((row) => {
                const isSelected = row.site_id === selectedSiteId;
                return (
                  <tr
                    key={row.site_id}
                    onClick={() => onSelectSite(row.site_id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-indigo-950/40 text-indigo-200"
                        : "hover:bg-slate-800/50 text-slate-300"
                    }`}
                  >
                    <td className="py-3 px-4 font-sans font-medium text-white">
                      {row.site_name}
                    </td>
                    <td className="py-3 px-4 text-amber-300 font-bold">
                      {row.illumination_percentage}%
                    </td>
                    <td className="py-3 px-4 text-amber-400/90">
                      {row.max_continuous_illumination_days.toFixed(1)} days
                    </td>
                    <td className="py-3 px-4 text-cyan-300 font-bold">
                      {row.comm_percentage}%
                    </td>
                    <td className="py-3 px-4 text-cyan-400/90">
                      {row.max_continuous_comm_days.toFixed(1)} days
                    </td>
                    <td className="py-3 px-4 text-emerald-300 font-bold">
                      {row.dual_operational_percentage}%
                    </td>
                    <td className="py-3 px-4 text-rose-300">
                      {row.max_continuous_night_hours.toFixed(0)} hours
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-block px-2.5 py-1 rounded-md font-bold text-xs bg-slate-800 border border-slate-700 text-white">
                        {row.clps_suitability_score.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seasonal Sunlight Retention Bar Comparison */}
      <div className="rounded-2xl bg-space-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl space-y-3">
        <h4 className="text-sm font-bold text-white">
          Cross-Season Sunlight Retention Comparison
        </h4>
        <div className="space-y-3">
          {siteTrends.map((site) => (
            <div key={site.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-300">{site.name}</span>
                <span className="font-mono text-slate-400">
                  {Object.entries(site.seasons)
                    .map(([s, val]) => `${s.split(" ")[0]}: ${val}%`)
                    .join(" | ")}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-space-950 border border-slate-800 flex overflow-hidden">
                {seasons.map((s, idx) => {
                  const val = site.seasons[s] || 0;
                  const colors = ["bg-amber-400", "bg-emerald-400", "bg-cyan-400", "bg-indigo-400"];
                  return (
                    <div
                      key={s}
                      style={{ width: "25%" }}
                      className="h-full border-r border-slate-900/40 relative group"
                      title={`${s}: ${val}%`}
                    >
                      <div
                        className={`h-full ${colors[idx % colors.length]}`}
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
