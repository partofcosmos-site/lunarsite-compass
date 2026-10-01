"use client";

import React, { useState, useMemo } from "react";
import { CandidateSite, SiteSummary } from "../lib/types";
import { simulatePdiTrajectory } from "../lib/physics";
import { 
  Rocket, 
  Activity, 
  Radio, 
  Sliders, 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldCheck, 
  ShieldAlert,
  Wifi,
  WifiOff
} from "lucide-react";

interface DescentSimulatorProps {
  site: CandidateSite;
  summary: SiteSummary;
  earthElevation: number;
  earthAzimuth: number;
}

export const DescentSimulator: React.FC<DescentSimulatorProps> = ({
  site,
  summary,
  earthElevation,
  earthAzimuth,
}) => {
  // Flight dynamics parameters
  const [pdiAltM, setPdiAltM] = useState<number>(15000);
  const [pdiVelMs, setPdiVelMs] = useState<number>(1690);
  const [burnDurationS, setBurnDurationS] = useState<number>(720);
  const [currentTimeS, setCurrentTimeS] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Compute terrain obstruction threshold
  const horizonElev = Math.max(0.1, 1.2 - summary.elevation_m / 5000.0);

  // Run powered descent physics simulation
  const result = useMemo(() => {
    return simulatePdiTrajectory({
      siteLat: site.latitude,
      siteLon: site.longitude,
      siteElevM: site.elevation_m,
      earthElevDeg: earthElevation,
      earthAzDeg: earthAzimuth,
      horizonElevDeg: horizonElev,
      pdiAltM,
      pdiVelMs,
      burnDurationS,
      stepS: 5.0, // 5s high resolution step
    });
  }, [site, summary, earthElevation, earthAzimuth, pdiAltM, pdiVelMs, burnDurationS, horizonElev]);

  // Current active step
  const activeStep = useMemo(() => {
    const stepIdx = Math.min(
      result.profile_steps.length - 1,
      Math.max(0, Math.floor(currentTimeS / 5.0))
    );
    return result.profile_steps[stepIdx] || result.profile_steps[0];
  }, [result, currentTimeS]);

  // Playback timer
  React.useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTimeS((prev) => {
        if (prev >= burnDurationS) {
          setIsPlaying(false);
          return burnDurationS;
        }
        return prev + 5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, burnDurationS]);

  // Chart dimensions
  const chartW = 800;
  const chartH = 260;
  const pad = { top: 20, right: 50, bottom: 35, left: 55 };
  const plotW = chartW - pad.left - pad.right;
  const plotH = chartH - pad.top - pad.bottom;

  // Chart coordinate mappers
  const getX = (t: number) => pad.left + (t / burnDurationS) * plotW;
  const getAltY = (alt: number) => pad.top + plotH - (alt / pdiAltM) * plotH;
  const getSnrY = (snr: number) => {
    const minSnr = -35.0;
    const maxSnr = 20.0;
    return pad.top + plotH - ((snr - minSnr) / (maxSnr - minSnr)) * plotH;
  };

  const altPath = useMemo(() => {
    return result.profile_steps
      .map((s, i) => `${i === 0 ? "M" : "L"} ${getX(s.time_s).toFixed(1)} ${getAltY(s.altitude_m).toFixed(1)}`)
      .join(" ");
  }, [result, burnDurationS, pdiAltM]);

  const snrPath = useMemo(() => {
    return result.profile_steps
      .map((s, i) => `${i === 0 ? "M" : "L"} ${getX(s.time_s).toFixed(1)} ${getSnrY(s.dte_link_margin_db).toFixed(1)}`)
      .join(" ");
  }, [result, burnDurationS]);

  const zeroSnrY = getSnrY(0);

  return (
    <div className="w-full space-y-4">
      {/* Flight Dynamics HUD Bar */}
      <div className="rounded-2xl bg-space-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Powered Descent Initiation (PDI) Flight Dynamics & Link Budget
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    result.flight_comm_status === "NOMINAL LOCK"
                      ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-300"
                      : result.flight_comm_status === "DEGRADED"
                      ? "bg-amber-950/70 border-amber-500/40 text-amber-300"
                      : "bg-rose-950/70 border-rose-500/40 text-rose-300"
                  }`}
                >
                  {result.flight_comm_status}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                15 km altitude deceleration to touchdown • Topocentric Doppler shift & DSN 8.4 GHz link margin
              </p>
            </div>
          </div>

          {/* Play/Pause Trajectory */}
          <div className="flex items-center gap-2 bg-space-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
              title={isPlaying ? "Pause Descent" : "Play Descent"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentTimeS(0);
              }}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
              title="Reset PDI"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <span className="font-mono text-xs text-cyan-300 font-bold ml-1">
              T+{activeStep.time_s}s / {burnDurationS}s
            </span>
          </div>
        </div>

        {/* Real-time Telemetry HUD Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-space-950/70 border border-slate-800">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Altitude</div>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-0.5">
              {(activeStep.altitude_m / 1000.0).toFixed(2)}{" "}
              <span className="text-xs font-normal text-slate-400">km</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {activeStep.altitude_m.toFixed(0)} m AGL
            </div>
          </div>

          <div className="p-3 rounded-xl bg-space-950/70 border border-slate-800">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Velocity</div>
            <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
              {activeStep.velocity_ms.toFixed(1)}{" "}
              <span className="text-xs font-normal text-slate-400">m/s</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {((activeStep.velocity_ms * 3600) / 1000).toFixed(0)} km/h
            </div>
          </div>

          <div className="p-3 rounded-xl bg-space-950/70 border border-slate-800">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Downrange</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">
              {activeStep.downrange_km.toFixed(1)}{" "}
              <span className="text-xs font-normal text-slate-400">km</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">To touchdown</div>
          </div>

          <div className="p-3 rounded-xl bg-space-950/70 border border-slate-800">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Doppler Shift</div>
            <div className="text-xl font-bold font-mono text-indigo-300 mt-0.5">
              {activeStep.doppler_shift_khz >= 0 ? `+${activeStep.doppler_shift_khz.toFixed(1)}` : activeStep.doppler_shift_khz.toFixed(1)}{" "}
              <span className="text-xs font-normal text-slate-400">kHz</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">8.4 GHz X-Band</div>
          </div>

          <div className="p-3 rounded-xl bg-space-950/70 border border-slate-800">
            <div className="text-[10px] uppercase font-semibold text-slate-400">DSN Link Margin</div>
            <div
              className={`text-xl font-bold font-mono mt-0.5 ${
                activeStep.dte_link_margin_db > 0 ? "text-emerald-300" : "text-rose-400"
              }`}
            >
              {activeStep.dte_link_margin_db > 0 ? `+${activeStep.dte_link_margin_db.toFixed(1)}` : activeStep.dte_link_margin_db.toFixed(1)}{" "}
              <span className="text-xs font-normal text-slate-400">dB</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {activeStep.is_comm_locked ? "CARRIER LOCKED" : "BLACKOUT HAZARD"}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-space-950/70 border border-slate-800">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Comm Continuity</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">
              {result.comm_lock_percentage}%
            </div>
            <div className="text-[10px] text-emerald-400 font-mono">
              Min Clr: {result.min_elevation_clearance_deg}°
            </div>
          </div>
        </div>

        {/* Descent Scrubber Slider */}
        <div className="space-y-1 mb-4">
          <input
            type="range"
            min="0"
            max={burnDurationS}
            step="5"
            value={currentTimeS}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentTimeS(parseInt(e.target.value));
            }}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>PDI Start (T+0s, 15 km)</span>
            <span>Pitchover & Terminal Deceleration</span>
            <span>Touchdown (T+{burnDurationS}s, 0 m)</span>
          </div>
        </div>

        {/* Trajectory Profile Chart (Altitude & Link Margin) */}
        <div className="relative w-full overflow-x-auto bg-space-950 rounded-xl p-3 border border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                Descent Altitude Profile (km)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                DSN Carrier Link Margin (dB)
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              0 dB = Communication Threshold
            </span>
          </div>

          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto min-w-[650px] select-none">
            {/* Zero Margin Line */}
            <line
              x1={pad.left}
              y1={zeroSnrY}
              x2={chartW - pad.right}
              y2={zeroSnrY}
              stroke="#EF4444"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text x={chartW - pad.right + 6} y={zeroSnrY + 4} fill="#EF4444" fontSize="10" fontFamily="monospace">
              0 dB Threshold
            </text>

            {/* Time Ticks */}
            {[0, 120, 240, 360, 480, 600, 720].map((t) => {
              if (t > burnDurationS) return null;
              const x = getX(t);
              return (
                <g key={t}>
                  <line x1={x} y1={pad.top} x2={x} y2={pad.top + plotH} stroke="#1E293B" strokeWidth="1" strokeDasharray="2 3" />
                  <text x={x} y={pad.top + plotH + 18} fill="#64748B" fontSize="10" textAnchor="middle" fontFamily="monospace">
                    T+{t}s
                  </text>
                </g>
              );
            })}

            {/* Altitude Curve */}
            <path d={altPath} fill="none" stroke="#38BDF8" strokeWidth="2.5" />

            {/* SNR Link Margin Curve */}
            <path d={snrPath} fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="3 2" />

            {/* Current scrubber needle */}
            <line
              x1={getX(activeStep.time_s)}
              y1={pad.top}
              x2={getX(activeStep.time_s)}
              y2={pad.top + plotH}
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            <circle cx={getX(activeStep.time_s)} cy={getAltY(activeStep.altitude_m)} r="5" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Flight Parameter Tuning Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
          <div className="bg-space-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">PDI Initial Altitude</span>
              <span className="font-mono text-cyan-300 font-bold">{(pdiAltM / 1000).toFixed(1)} km</span>
            </div>
            <input
              type="range"
              min="10000"
              max="25000"
              step="500"
              value={pdiAltM}
              onChange={(e) => setPdiAltM(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="bg-space-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">PDI Initial Velocity</span>
              <span className="font-mono text-amber-300 font-bold">{pdiVelMs} m/s</span>
            </div>
            <input
              type="range"
              min="1400"
              max="1800"
              step="10"
              value={pdiVelMs}
              onChange={(e) => setPdiVelMs(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          <div className="bg-space-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Total Burn Duration</span>
              <span className="font-mono text-emerald-300 font-bold">{burnDurationS} s</span>
            </div>
            <input
              type="range"
              min="500"
              max="900"
              step="20"
              value={burnDurationS}
              onChange={(e) => setBurnDurationS(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
