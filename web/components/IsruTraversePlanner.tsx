"use client";

import React, { useState, useMemo } from "react";
import { CandidateSite, SiteIsruAnalysis, PsrProximity } from "../lib/types";
import { calculateLunarDistanceKm, CRATER_FEATURES } from "../lib/physics";
import { 
  Compass, 
  MapPin, 
  Thermometer, 
  Droplet, 
  Navigation, 
  Layers, 
  Clock, 
  BatteryCharging, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";

interface IsruPlannerProps {
  site: CandidateSite;
  isruAnalysis?: SiteIsruAnalysis;
}

export const IsruTraversePlanner: React.FC<IsruPlannerProps> = ({
  site,
  isruAnalysis,
}) => {
  const [selectedPsrId, setSelectedPsrId] = useState<string>(
    isruAnalysis?.all_psr_proximity[0]?.psr_id || "shackleton_floor"
  );
  const [roverSpeedKmh, setRoverSpeedKmh] = useState<number>(0.2); // nominal 200 m/h VIPER speed

  const currentPsr = useMemo(() => {
    return isruAnalysis?.all_psr_proximity.find((p) => p.psr_id === selectedPsrId) ||
      isruAnalysis?.all_psr_proximity[0];
  }, [isruAnalysis, selectedPsrId]);

  // Traverse calculation
  const distanceKm = currentPsr?.distance_km || 15.0;
  const driveHours = (distanceKm / roverSpeedKmh).toFixed(1);
  const chargingStops = Math.max(1, Math.round(distanceKm / 4.0));
  const estimatedDays = (parseFloat(driveHours) / 8.0).toFixed(1); // 8h drive per day

  // Color mapping based on temperature & thermal stability
  const getTempBadge = (tempK: number) => {
    if (tempK <= 40) {
      return {
        label: `${tempK} K (Super-Volatile Trap)`,
        color: "bg-cyan-950/80 border-cyan-500/50 text-cyan-300",
      };
    } else if (tempK <= 70) {
      return {
        label: `${tempK} K (H2O Permafrost Stable)`,
        color: "bg-blue-950/80 border-blue-500/50 text-blue-300",
      };
    } else {
      return {
        label: `${tempK} K (Sub-Surface Trap Only)`,
        color: "bg-slate-800 border-slate-700 text-slate-300",
      };
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Overview Banner */}
      <div className="rounded-2xl bg-space-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Droplet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                ISRU Volatile Cold Trap Proximity & Rover Traverse Planner
                <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300">
                  Site: {site.name}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                LOLA slope traversability • Thermal stability regimes (T &lt; 40K to 70K) • Multi-stage route planning
              </p>
            </div>
          </div>

          {/* Overall ISRU Score Badge */}
          {isruAnalysis && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-space-950 border border-slate-800">
              <span className="text-xs text-slate-400">ISRU Accessibility:</span>
              <span className="font-mono font-bold text-sm text-cyan-300">
                {isruAnalysis.isru_accessibility_index.toFixed(1)} / 100
              </span>
            </div>
          )}
        </div>

        {/* Target Cold Trap Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {isruAnalysis?.all_psr_proximity.map((psr) => {
            const isSelected = psr.psr_id === selectedPsrId;
            const tempInfo = getTempBadge(psr.temperature_k);
            return (
              <div
                key={psr.psr_id}
                onClick={() => setSelectedPsrId(psr.psr_id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-blue-950/40 border-cyan-400 shadow-glow"
                    : "bg-space-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                    {psr.psr_name}
                  </span>
                  <span className="font-mono font-bold text-cyan-300">
                    {psr.distance_km.toFixed(1)} km
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${tempInfo.color}`}>
                    {tempInfo.label}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    Wall: {psr.wall_slope_deg}°
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  Volatiles: <strong className="text-slate-200">{psr.volatiles.join(", ")}</strong>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{psr.traverse_class}</span>
                  <span className="font-mono font-semibold text-white">
                    Score: {psr.feasibility_score.toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Route Simulation & Waypoint Elevation Profile */}
      {currentPsr && (
        <div className="rounded-2xl bg-space-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Navigation className="h-4 w-4 text-cyan-400" />
                Rover Traverse Mission Profile: {site.name} → {currentPsr.psr_name}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates solar recharge availability, slope hazards, and scientific sample return.
              </p>
            </div>

            {/* Rover Speed Control */}
            <div className="flex items-center gap-2 bg-space-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">Rover Speed:</span>
              <span className="font-mono text-cyan-300 font-bold">{(roverSpeedKmh * 1000).toFixed(0)} m/h</span>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={roverSpeedKmh}
                onChange={(e) => setRoverSpeedKmh(parseFloat(e.target.value))}
                className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 ml-1"
              />
            </div>
          </div>

          {/* Mission Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-space-950/60 border border-slate-800">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Total Distance</div>
              <div className="text-xl font-bold font-mono text-white mt-0.5">
                {distanceKm.toFixed(1)} <span className="text-xs text-slate-400 font-normal">km</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Great-circle surface path</div>
            </div>

            <div className="p-3 rounded-xl bg-space-950/60 border border-slate-800">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Drive Duration</div>
              <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
                {driveHours} <span className="text-xs text-slate-400 font-normal">hours</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">~{estimatedDays} operational sols</div>
            </div>

            <div className="p-3 rounded-xl bg-space-950/60 border border-slate-800">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Recharge Stops</div>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-0.5">
                {chargingStops} <span className="text-xs text-slate-400 font-normal">waypoints</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Sunlit ridge peaks</div>
            </div>

            <div className="p-3 rounded-xl bg-space-950/60 border border-slate-800">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Traversability</div>
              <div className="text-sm font-bold font-mono text-cyan-300 mt-1 line-clamp-1">
                {currentPsr.traverse_class.split("(")[0].trim()}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Wall slope: {currentPsr.wall_slope_deg}°
              </div>
            </div>
          </div>

          {/* Waypoint Route Steps */}
          <div className="space-y-2 pt-2">
            <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Nominal Waypoint Sequence
            </h5>
            <div className="space-y-2">
              {/* Waypoint 0: Landing Site */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-space-950/60 border border-slate-800 text-xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold font-mono">
                  W0
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">Landing Zone Deployment ({site.name})</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Elevation: +{site.elevation_m}m • Local slope: {site.slope_deg}° • Direct high-bandwidth comms
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold">0.0 km</span>
              </div>

              {/* Intermediate Waypoints */}
              {Array.from({ length: chargingStops }).map((_, idx) => {
                const stopDist = ((idx + 1) * distanceKm) / (chargingStops + 1);
                return (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-space-950/40 border border-slate-800 text-xs">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-bold font-mono">
                      W{idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-200">
                        Ridge Waypoint #{idx + 1} — Solar Power & Relay Station
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Elevation saddle (+{Math.round(site.elevation_m - (idx + 1) * 200)}m) • Battery recharge & thermal warm-up
                      </div>
                    </div>
                    <span className="text-xs font-mono text-amber-300 font-bold">
                      +{stopDist.toFixed(1)} km
                    </span>
                  </div>
                );
              })}

              {/* Destination Cold Trap */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 font-bold font-mono">
                  W{chargingStops + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-cyan-200 flex items-center gap-2">
                    {currentPsr.psr_name} Volatile Reservoir
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/60 border border-cyan-600/40 text-cyan-300">
                      Target Cold Trap
                    </span>
                  </div>
                  <div className="text-[11px] text-cyan-400/80 font-mono">
                    Cryo temp: {currentPsr.temperature_k} K • Volatiles: {currentPsr.volatiles.join(", ")}
                  </div>
                </div>
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  {distanceKm.toFixed(1)} km
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
