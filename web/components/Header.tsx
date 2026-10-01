"use client";

import React, { useState, useEffect } from "react";
import { CandidateSite, SiteSummary } from "../lib/types";
import { 
  Compass, 
  Satellite, 
  Sun, 
  Radio, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  Layers, 
  ShieldCheck,
  BookOpen
} from "lucide-react";

interface HeaderProps {
  sites: CandidateSite[];
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
  epochIndex: number;
  totalEpochs: number;
  currentUtc: string;
  onEpochChange: (index: number) => void;
  onOpenMethodology: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sites,
  selectedSiteId,
  onSelectSite,
  epochIndex,
  totalEpochs,
  currentUtc,
  onEpochChange,
  onOpenMethodology,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Playback loop for mission elapsed time scrubber
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      onEpochChange((prev) => (prev + 1) % totalEpochs);
    }, 400 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, totalEpochs, onEpochChange]);

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || sites[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-space-950/90 backdrop-blur-md px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand & Mission Status */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/40 text-amber-400 shadow-goldGlow">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                LunarSite Compass
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  CLPS 2026
                </span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 rounded-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ORBITAL LINK NOMINAL
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Temporal Illumination & Earth-Communication Window Browser • South Pole Demarcation
            </p>
          </div>
        </div>

        {/* Temporal Scrubber Control Hub */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 bg-space-900/90 border border-slate-800 rounded-xl px-3 py-2">
          {/* Play/Pause & Step Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1.5 rounded-lg border transition-all ${
                isPlaying 
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30" 
                  : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
              }`}
              title={isPlaying ? "Pause Timeline" : "Play Timeline"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                onEpochChange(0);
              }}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              title="Reset to T+0"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Scrubber slider */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={totalEpochs - 1}
              value={epochIndex}
              onChange={(e) => {
                setIsPlaying(false);
                onEpochChange(Number(e.target.value));
              }}
              className="w-28 sm:w-48 lg:w-64 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-xs font-mono font-medium text-slate-300 whitespace-nowrap">
              T+{epochIndex}h
            </span>
          </div>

          {/* Current UTC timestamp display */}
          <div className="hidden md:flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 whitespace-nowrap">
              {currentUtc || "2026-11-01 00:00 UTC"}
            </span>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
            {[1, 5, 20].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-1.5 py-0.5 rounded ${
                  playbackSpeed === spd
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                    : "hover:text-slate-200"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Site Selector Dropdown & Methodology Trigger */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSiteId}
            onChange={(e) => onSelectSite(e.target.value)}
            className="bg-space-900 border border-slate-700 text-slate-100 text-xs sm:text-sm rounded-lg px-3 py-2 font-medium focus:ring-1 focus:ring-cyan-400 focus:outline-none cursor-pointer shadow-sm hover:border-slate-600 transition"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} ({Math.abs(site.latitude).toFixed(1)}°S)
              </option>
            ))}
          </select>

          <button
            onClick={onOpenMethodology}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-700 bg-space-900 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition shadow-sm"
            title="Scientific Methodology & Ephemeris Math"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Methodology</span>
          </button>
        </div>
      </div>

      {/* Quick Access Site Chips */}
      <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mr-1 flex items-center gap-1 shrink-0">
          <Satellite className="h-3 w-3 text-cyan-400" />
          Candidate Corridors:
        </span>
        {sites.map((s) => {
          const isSelected = s.id === selectedSiteId;
          return (
            <button
              key={s.id}
              onClick={() => onSelectSite(s.id)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all border ${
                isSelected
                  ? "bg-cyan-500/15 border-cyan-400 text-cyan-200 font-medium shadow-sm"
                  : "bg-space-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              {s.name.split("(")[0].trim()}
            </button>
          );
        })}
      </div>
    </header>
  );
};
