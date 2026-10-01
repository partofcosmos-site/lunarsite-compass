"use client";

import React, { useState, useMemo } from "react";
import { SiteSummary } from "../lib/types";
import { 
  Award, 
  Sliders, 
  ArrowUpDown, 
  Check, 
  Sun, 
  Radio, 
  Activity, 
  Moon, 
  Mountain,
  ChevronRight,
  TrendingUp,
  Download
} from "lucide-react";

interface ScorecardProps {
  summaries: SiteSummary[];
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
}

export const ScorecardTradeStudy: React.FC<ScorecardProps> = ({
  summaries,
  selectedSiteId,
  onSelectSite,
}) => {
  // Trade study weighting parameters (default NASA baseline)
  const [weights, setWeights] = useState({
    solar: 0.35,     // Weight for continuous sunlight
    comm: 0.25,      // Weight for Earth communication
    dual: 0.20,      // Weight for simultaneous dual-operation
    slope: 0.10,     // Weight for landing slope safety (<10° optimal)
    darkPenalty: 0.10 // Penalty weight for continuous cryo darkness
  });

  const [sortField, setSortField] = useState<string>("customScore");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Compute customized trade study score for each site
  const rankedSites = useMemo(() => {
    return summaries.map((s) => {
      // Normalize components (0 to 100)
      const sunScore = Math.min(100, (s.max_continuous_illumination_days / 30.0) * 100);
      const commScore = Math.min(100, (s.max_continuous_comm_days / 30.0) * 100);
      const dualScore = Math.min(100, (s.max_continuous_dual_days / 30.0) * 100);
      // Slope score: 0° is 100, 15° is 0
      const slopeScore = Math.max(0, 100 - (s.slope_deg / 15.0) * 100);
      // Night penalty: 0 hours is 100, 300 hours is 0
      const nightScore = Math.max(0, 100 - (s.max_continuous_night_hours / 250.0) * 100);

      const totalWeight = weights.solar + weights.comm + weights.dual + weights.slope + weights.darkPenalty;
      const customScore = totalWeight > 0 ? (
        (sunScore * weights.solar +
         commScore * weights.comm +
         dualScore * weights.dual +
         slopeScore * weights.slope +
         nightScore * weights.darkPenalty) / totalWeight
      ) : 0;

      return {
        ...s,
        customScore: Math.round(customScore * 10) / 10,
        sunScore: Math.round(sunScore),
        commScore: Math.round(commScore),
        dualScore: Math.round(dualScore),
        slopeScore: Math.round(slopeScore),
        nightScore: Math.round(nightScore),
      };
    }).sort((a, b) => {
      let valA: any = (a as any)[sortField];
      let valB: any = (b as any)[sortField];
      if (typeof valA === "number" && typeof valB === "number") {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [summaries, weights, sortField, sortAsc]);

  // Key triad comparison: Mons Mouton vs Shackleton vs Nobile
  const triadSites = useMemo(() => {
    const mouton = summaries.find((s) => s.site_id.includes("mons_mouton"));
    const shackleton = summaries.find((s) => s.site_id.includes("shackleton"));
    const nobile = summaries.find((s) => s.site_id.includes("nobile"));
    return { mouton, shackleton, nobile };
  }, [summaries]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Flight Director Head-to-Head Triad Spotlight */}
      <div className="rounded-2xl bg-space-900/90 border border-slate-800 p-4 sm:p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              Strategic Triad Trade Study: Mons Mouton vs Shackleton vs Nobile
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-criteria mission engineering tradeoffs for CLPS and Artemis human-robotic surface exploration.
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            JPL / LRO Benchmarked
          </span>
        </div>

        {/* 3-Column Triad Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Mons Mouton */}
          <div 
            onClick={() => triadSites.mouton && onSelectSite(triadSites.mouton.site_id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
              selectedSiteId.includes("mons_mouton")
                ? "bg-cyan-950/30 border-cyan-400 shadow-glow"
                : "bg-space-950/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Resource & Drill Hub
              </span>
              <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                Rank #{rankedSites.findIndex((s) => s.site_id.includes("mons_mouton")) + 1}
              </span>
            </div>
            <h4 className="text-base font-bold text-white">Mons Mouton Plateau</h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              TRIDENT / PRIME-1 & VIPER target. Expansive safe landing corridors with gentle 4.8°–5.2° slopes and direct shallow volatile beds.
            </p>
            <div className="mt-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Slope:</span>
                <strong className="text-emerald-400">5.2° (Ultra Safe)</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Max Sun Window:</span>
                <strong className="text-amber-400">16.2 d (54.7%)</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Max Comm Window:</span>
                <strong className="text-cyan-400">14.1 d (47.1%)</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Max Cryo Night:</span>
                <strong className="text-rose-400">222.0 h</strong>
              </div>
            </div>
          </div>

          {/* Card 2: Shackleton Rim */}
          <div 
            onClick={() => triadSites.shackleton && onSelectSite(triadSites.shackleton.site_id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
              selectedSiteId.includes("shackleton")
                ? "bg-amber-950/30 border-amber-400 shadow-goldGlow"
                : "bg-space-950/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Eternal Light Peak
              </span>
              <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                Rank #{rankedSites.findIndex((s) => s.site_id.includes("shackleton")) + 1}
              </span>
            </div>
            <h4 className="text-base font-bold text-white">Peak Near Shackleton (Peak B)</h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              100% continuous solar daylight across 30 days (+4,200m elevation). High scientific value overlooking 38K deep crater floor.
            </p>
            <div className="mt-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Slope:</span>
                <strong className="text-amber-400">13.8° (Narrow Rim)</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Max Sun Window:</span>
                <strong className="text-amber-400">30.0 d (100%)</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Max Comm Window:</span>
                <strong className="text-cyan-400">13.2 d (44.0%)</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Max Cryo Night:</span>
                <strong className="text-emerald-400">0.0 h (No Night)</strong>
              </div>
            </div>
          </div>

          {/* Card 3: Nobile Rim 1 */}
          <div 
            onClick={() => triadSites.nobile && onSelectSite(triadSites.nobile.site_id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
              selectedSiteId.includes("nobile")
                ? "bg-emerald-950/30 border-emerald-400 shadow-emeraldGlow"
                : "bg-space-950/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                High Comm Clearance
              </span>
              <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                Rank #{rankedSites.findIndex((s) => s.site_id.includes("nobile")) + 1}
              </span>
            </div>
            <h4 className="text-base font-bold text-white">Nobile West Rim 1</h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Balanced compromise site. Earth hovers 4°–6° above horizon, minimizing terrain masking while maintaining safe 5.5° slopes.
            </p>
            <div className="mt-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Slope:</span>
                <strong className="text-emerald-400">5.5° (Safe)</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Max Sun Window:</span>
                <strong className="text-amber-400">16.3 d (54.3%)</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Max Comm Window:</span>
                <strong className="text-cyan-400">14.1 d (47.1%)</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Max Cryo Night:</span>
                <strong className="text-rose-400">222.0 h</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Director Interactive Weights Control */}
      <div className="rounded-2xl bg-space-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">
              Flight Director Trade Study Weighting Engine
            </h4>
          </div>
          <button
            onClick={() => setWeights({ solar: 0.35, comm: 0.25, dual: 0.20, slope: 0.10, darkPenalty: 0.10 })}
            className="text-xs text-slate-400 hover:text-cyan-300 font-mono transition"
          >
            Reset NASA Baseline
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          {/* Solar Weight */}
          <div className="space-y-1.5 bg-space-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-amber-400 font-medium">Solar Window</span>
              <span className="font-mono text-white font-bold">{Math.round(weights.solar * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.solar}
              onChange={(e) => setWeights({ ...weights, solar: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Comm Weight */}
          <div className="space-y-1.5 bg-space-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-cyan-400 font-medium">Earth Comm</span>
              <span className="font-mono text-white font-bold">{Math.round(weights.comm * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.comm}
              onChange={(e) => setWeights({ ...weights, comm: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Dual-Op Weight */}
          <div className="space-y-1.5 bg-space-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-emerald-400 font-medium">Dual-Op Overlap</span>
              <span className="font-mono text-white font-bold">{Math.round(weights.dual * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.dual}
              onChange={(e) => setWeights({ ...weights, dual: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* Slope Safety Weight */}
          <div className="space-y-1.5 bg-space-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-indigo-400 font-medium">Slope Safety</span>
              <span className="font-mono text-white font-bold">{Math.round(weights.slope * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.slope}
              onChange={(e) => setWeights({ ...weights, slope: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>

          {/* Night Penalty Weight */}
          <div className="space-y-1.5 bg-space-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-rose-400 font-medium">Dark Avoidance</span>
              <span className="font-mono text-white font-bold">{Math.round(weights.darkPenalty * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.darkPenalty}
              onChange={(e) => setWeights({ ...weights, darkPenalty: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-400"
            />
          </div>
        </div>
      </div>

      {/* Comprehensive Ranked Sites Data Table */}
      <div className="rounded-2xl bg-space-900/90 border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 sm:px-5 border-b border-slate-800 bg-space-950/60 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white">
              Full Candidate Site Rankings & Trade Study Matrix
            </h4>
            <p className="text-xs text-slate-400">
              Click column header to sort • Click site row to inspect on map and telemetry chart
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-space-950 text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort("site_name")}>
                  Candidate Site <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort("slope_deg")}>
                  Slope (°) <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort("max_continuous_illumination_days")}>
                  Max Sun (d) <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort("max_continuous_comm_days")}>
                  Max Comm (d) <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort("max_continuous_dual_days")}>
                  Dual-Op (d) <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort("max_continuous_night_hours")}>
                  Night (h) <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-white text-right" onClick={() => toggleSort("customScore")}>
                  Trade Score (/100) <ArrowUpDown className="inline h-3 w-3 ml-1" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {rankedSites.map((site, index) => {
                const isSelected = site.site_id === selectedSiteId;
                return (
                  <tr
                    key={site.site_id}
                    onClick={() => onSelectSite(site.site_id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-cyan-950/40 text-cyan-200"
                        : "hover:bg-slate-800/50 text-slate-300"
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-white">
                      #{index + 1}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-white">
                      <div>{site.site_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {Math.abs(site.latitude).toFixed(2)}°S, {site.longitude.toFixed(2)}°E • +{site.elevation_m}m
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={site.slope_deg < 10 ? "text-emerald-400 font-bold" : "text-amber-400"}>
                        {site.slope_deg}°
                      </span>
                    </td>
                    <td className="py-3 px-4 text-amber-300">
                      {site.max_continuous_illumination_days.toFixed(1)}d ({site.illumination_percentage}%)
                    </td>
                    <td className="py-3 px-4 text-cyan-300">
                      {site.max_continuous_comm_days.toFixed(1)}d ({site.comm_percentage}%)
                    </td>
                    <td className="py-3 px-4 text-emerald-300">
                      {site.max_continuous_dual_days.toFixed(1)}d ({site.dual_operational_percentage}%)
                    </td>
                    <td className="py-3 px-4 text-rose-300">
                      {site.max_continuous_night_hours.toFixed(0)}h
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-block px-2.5 py-1 rounded-md font-bold text-xs bg-slate-800 border border-slate-700 text-white">
                        {site.customScore.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
