"use client";

import React, { useState, useMemo } from "react";
import { Header } from "../components/Header";
import { KpiRow } from "../components/KpiRow";
import { PolarStereographicMap } from "../components/PolarStereographicMap";
import { TelemetryCharts } from "../components/TelemetryCharts";
import { ScorecardTradeStudy } from "../components/ScorecardTradeStudy";
import { DescentSimulator } from "../components/DescentSimulator";
import { IsruTraversePlanner } from "../components/IsruTraversePlanner";
import { SeasonalStressTest } from "../components/SeasonalStressTest";
import { MethodologyModal } from "../components/MethodologyModal";
import { CitationModal } from "../components/CitationModal";

import {
  CANDIDATE_SITES,
  MISSION_SUMMARIES,
  SEASONAL_BENCHMARKS,
  SITES_ISRU_ANALYSIS,
  TIMELINE_EPOCHS,
  getSiteById,
  getSummaryById,
  getTelemetryForSite,
  getIsruForSite,
} from "../lib/data";

import { 
  Compass, 
  Map, 
  Activity, 
  Award, 
  Rocket, 
  Droplet, 
  Snowflake, 
  ShieldCheck, 
  Info,
  ExternalLink,
  Quote
} from "lucide-react";

export default function Home() {
  const [selectedSiteId, setSelectedSiteId] = useState<string>("im2_mons_mouton");
  const [epochIndex, setEpochIndex] = useState<number>(120); // Default to T+120h (5 days in)
  const [activeTab, setActiveTab] = useState<
    "map" | "telemetry" | "scorecard" | "descent" | "isru" | "seasons"
  >("map");
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);
  const [isCitationOpen, setIsCitationOpen] = useState<boolean>(false);

  // Selected site and summary data
  const selectedSite = useMemo(() => {
    return getSiteById(selectedSiteId) || CANDIDATE_SITES[0];
  }, [selectedSiteId]);

  const selectedSummary = useMemo(() => {
    return getSummaryById(selectedSiteId) || MISSION_SUMMARIES[0];
  }, [selectedSiteId]);

  const siteTelemetry = useMemo(() => {
    return getTelemetryForSite(selectedSiteId);
  }, [selectedSiteId]);

  const siteIsru = useMemo(() => {
    return getIsruForSite(selectedSiteId);
  }, [selectedSiteId]);

  // Current epoch slice across all sites
  const currentEpoch = useMemo(() => {
    return TIMELINE_EPOCHS[epochIndex] || TIMELINE_EPOCHS[0];
  }, [epochIndex]);

  // Active site status and angles at current epoch
  const currentSiteState = currentEpoch?.sites[selectedSiteId];
  const currentStatus = currentSiteState?.st || "Dual Operational";
  const sunAzimuth = currentSiteState?.sAz ?? 160.0;
  const sunElevation = currentSiteState?.sEl ?? 1.18;
  const earthAzimuth = currentSiteState?.eAz ?? 238.0;
  const earthElevation = currentSiteState?.eEl ?? -4.0;
  const currentUtc = currentEpoch?.dt || "2026-11-01 00:00:00 UTC";

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col space-grid">
      {/* Top Aerospace Navigation Bar */}
      <Header
        sites={CANDIDATE_SITES}
        selectedSiteId={selectedSiteId}
        onSelectSite={setSelectedSiteId}
        epochIndex={epochIndex}
        totalEpochs={TIMELINE_EPOCHS.length}
        currentUtc={currentUtc}
        onEpochChange={setEpochIndex}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenCitation={() => setIsCitationOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* KPI Metrics Row & Live Status Banner */}
        <KpiRow
          summary={selectedSummary}
          currentStatus={currentStatus}
          sunElevation={sunElevation}
          earthElevation={earthElevation}
        />

        {/* Dashboard Navigation Tabs */}
        <div className="border-b border-slate-800 bg-space-900/60 rounded-xl p-1.5 backdrop-blur-sm shadow-md overflow-x-auto">
          <nav className="flex space-x-1 sm:space-x-2 text-xs sm:text-sm font-semibold whitespace-nowrap">
            <button
              onClick={() => setActiveTab("map")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === "map"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Map className="h-4 w-4" />
              Polar Geospatial Map
            </button>

            <button
              onClick={() => setActiveTab("telemetry")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === "telemetry"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Activity className="h-4 w-4" />
              Mission Telemetry & Horizon
            </button>

            <button
              onClick={() => setActiveTab("scorecard")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === "scorecard"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Award className="h-4 w-4" />
              Flight Director Scorecard
            </button>

            <button
              onClick={() => setActiveTab("descent")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === "descent"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Rocket className="h-4 w-4" />
              PDI Descent Trajectory
            </button>

            <button
              onClick={() => setActiveTab("isru")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === "isru"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Droplet className="h-4 w-4" />
              ISRU Traverse Planner
            </button>

            <button
              onClick={() => setActiveTab("seasons")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === "seasons"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Snowflake className="h-4 w-4" />
              Four-Season Stress Test
            </button>
          </nav>
        </div>

        {/* Tab 1: 2D/3D Conformal Polar Stereographic Map */}
        {activeTab === "map" && (
          <div className="space-y-4">
            <PolarStereographicMap
              sites={CANDIDATE_SITES}
              summaries={MISSION_SUMMARIES}
              selectedSiteId={selectedSiteId}
              onSelectSite={setSelectedSiteId}
              currentEpochStates={currentEpoch?.sites}
              sunAzimuth={sunAzimuth}
              sunElevation={sunElevation}
              earthAzimuth={earthAzimuth}
              earthElevation={earthElevation}
              utcDateString={currentUtc}
            />

            {/* Quick Context Summary Below Map */}
            <div className="p-4 rounded-xl bg-space-900/60 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <strong className="text-white">Active Demarcation Zone:</strong> Candidate landing corridor{" "}
                <span className="text-cyan-300 font-semibold">{selectedSite.name}</span>. Drag the temporal scrubber in the top bar to advance the mission clock and watch solar illumination and Earth visibility vectors sweep across polar crater massifs.
              </div>
              <button
                onClick={() => setActiveTab("telemetry")}
                className="text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 shrink-0 font-semibold"
              >
                Inspect Telemetry Chart &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Temporal Telemetry Charts & 360° Cylindrical Skyline */}
        {activeTab === "telemetry" && (
          <TelemetryCharts
            telemetry={siteTelemetry}
            summary={selectedSummary}
            currentEpochIndex={epochIndex}
            onEpochClick={setEpochIndex}
          />
        )}

        {/* Tab 3: Flight Director Scorecard & Trade Study */}
        {activeTab === "scorecard" && (
          <ScorecardTradeStudy
            summaries={MISSION_SUMMARIES}
            selectedSiteId={selectedSiteId}
            onSelectSite={setSelectedSiteId}
          />
        )}

        {/* Tab 4: PDI Powered Descent Trajectory Simulator */}
        {activeTab === "descent" && (
          <DescentSimulator
            site={selectedSite}
            summary={selectedSummary}
            earthElevation={earthElevation}
            earthAzimuth={earthAzimuth}
          />
        )}

        {/* Tab 5: ISRU Volatile Traverse Route Planner */}
        {activeTab === "isru" && (
          <IsruTraversePlanner
            site={selectedSite}
            isruAnalysis={siteIsru}
          />
        )}

        {/* Tab 6: Four-Season Orbital Stress Test */}
        {activeTab === "seasons" && (
          <SeasonalStressTest
            seasonalData={SEASONAL_BENCHMARKS}
            selectedSiteId={selectedSiteId}
            onSelectSite={setSelectedSiteId}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800 bg-space-950/80 px-4 py-4 sm:px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">LunarSite Compass</span>
            <span>• NASA CLPS Mission Browser & Flight Dynamics Suite</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
            <span>LOLA 20m DEM Topography</span>
            <span>•</span>
            <span>JPL Horizons DE440</span>
            <span>•</span>
            <button
              onClick={() => setIsCitationOpen(true)}
              className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition underline underline-offset-2"
            >
              <Quote className="h-3 w-3" />
              <span>Cite Platform</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Scientific Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      {/* Academic Citation Modal */}
      <CitationModal
        isOpen={isCitationOpen}
        onClose={() => setIsCitationOpen(false)}
      />
    </div>
  );
}
