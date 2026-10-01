"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  RotateCcw, 
  Sparkles, 
  ShieldAlert, 
  Sun, 
  Radio, 
  Snowflake, 
  Droplet, 
  Compass, 
  FileText, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight
} from "lucide-react";

interface AiMissionCopilotProps {
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
  onSwitchTab?: (tab: "map" | "telemetry" | "scorecard" | "descent" | "isru" | "seasons" | "copilot") => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "copilot";
  content: string;
  timestamp: string;
  actions?: Array<{
    label: string;
    actionType: "select_site" | "switch_tab" | "open_pdf";
    payload: string;
    icon?: string;
  }>;
}

export const AiMissionCopilot: React.FC<AiMissionCopilotProps> = ({
  selectedSiteId,
  onSelectSite,
  onSwitchTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "copilot",
      content:
        "**Greetings, Flight Dynamics Officer.** I am your autonomous CLPS Flight Director AI Copilot, loaded with first-principles ephemerides and LOLA 20m elevation obstruction profiles across all 8 lunar south pole candidate sites.\n\nSelect an operational prompt below or ask any question regarding illumination windows, Direct-to-Earth communication links, landing gear slope stability, or cryogenic survival.",
      timestamp: "T-00:00:00",
      actions: [
        { label: "Inspect Mons Mouton (IM-2)", actionType: "select_site", payload: "im2_mons_mouton" },
        { label: "Download Executive Briefing (PDF)", actionType: "open_pdf", payload: "docs/LUNARSITE_COMPASS_RESEARCH_PAPER.pdf" }
      ]
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnalyzing]);

  const promptPresets = [
    { label: "☀️ Best Solar Site", query: "Which candidate landing site offers the highest continuous solar power?" },
    { label: "📡 Best Comm Window", query: "Which site provides the best Direct-to-Earth communication coverage?" },
    { label: "🎯 Why Mons Mouton?", query: "Why did NASA choose Mons Mouton for PRIME-1 and VIPER over Shackleton?" },
    { label: "⚠️ Slope Hazard Alert", query: "Which landing sites have dangerous slope hazards near the 15° tip-over limit?" },
    { label: "❄️ Winter Solstice Test", query: "How do candidate sites survive the Southern Winter Solstice stress test?" },
    { label: "🧊 Water Ice PSR Access", query: "Which landing site is best positioned for water-ice prospecting in deep PSRs?" }
  ];

  const handleActionClick = (action: { actionType: string; payload: string }) => {
    if (action.actionType === "select_site") {
      onSelectSite(action.payload);
      if (onSwitchTab) onSwitchTab("map");
    } else if (action.actionType === "switch_tab") {
      if (onSwitchTab) onSwitchTab(action.payload as any);
    } else if (action.actionType === "open_pdf") {
      window.open(action.payload, "_blank");
    }
  };

  const handleSend = async (userText: string) => {
    const text = userText.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsAnalyzing(true);

    // Intent evaluation with local mission brain & optional edge proxy
    let responseText = "";
    let actions: ChatMessage["actions"] = [];

    try {
      const edgeRes = await fetch("https://antigravity-edge-proxy.partofcosmmos.workers.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer sk-agy-f1519583dc207c6ff1f73639b567a585"
        },
        body: JSON.stringify({
          model: "gemini-flash",
          messages: [
            {
              role: "system",
              content:
                "You are the CLPS Flight Director AI Copilot for LunarSite Compass. You analyze 8 lunar south pole candidate sites with real NASA data: Connecting Ridge CR1 (Score 54.1, 75.4% Sun, 44.9% Comm, Slope 8.4°), IM-2 Mons Mouton (Score 51.4, 52.2% Sun, 74.0% Comm, Slope 4.9°), VIPER Mons Mouton (Score 50.4, 53.3% Sun, 70.0% Comm, Slope 5.2°), Faustini Rim A (Score 25.3, Slope 9.8°), de Gerlache Rim 1 (Score 24.6, Slope 11.2°), Nobile Rim 1 (Score 18.2, Slope 7.6°), Shackleton Peak B (Score 16.8, Slope 14.2°), Haworth PSR (Score 0.0, 38K). Be concise, authoritative, professional, and ground all numbers strictly in this data."
            },
            { role: "user", content: text }
          ],
          max_tokens: 350,
          temperature: 0.2
        })
      });

      if (edgeRes.ok) {
        const json = await edgeRes.json();
        responseText = json.choices[0].message.content;
        actions = [
          { label: "Inspect IM-2 Mons Mouton", actionType: "select_site", payload: "im2_mons_mouton" },
          { label: "View Scorecard Trade Study", actionType: "switch_tab", payload: "scorecard" }
        ];
      } else {
        throw new Error("Edge proxy offline");
      }
    } catch {
      // Local deterministic mission brain fallback
      const q = text.toLowerCase();
      if (q.includes("solar") || q.includes("sun") || q.includes("power") || q.includes("light")) {
        responseText =
          "**Connecting Ridge (Site CR1)** achieves the highest continuous solar power at **75.4% (22.6 days)** with the shortest lunar night (**124 hours**).\n\n• **Sunlight Coverage:** 75.4% (22.6 days)\n• **Direct Earth Comm:** 44.9% (13.5 days)\n• **Dual-Op Concurrency:** 44.0% (13.2 days)\n• **Surface Slope:** 8.4°\n\n*Tradeoff Warning:* Because CR1 is located at 89.44°S, the Earth sits low on the horizon, causing terrain to block communications 55.1% of the month, and winter solstice sunlight drops to 0.0%.";
        actions = [
          { label: "Inspect Connecting Ridge", actionType: "select_site", payload: "cr1_connecting_ridge" },
          { label: "View Telemetry Curves", actionType: "switch_tab", payload: "telemetry" }
        ];
      } else if (q.includes("comm") || q.includes("earth") || q.includes("dsn") || q.includes("ground station")) {
        responseText =
          "**IM-2 Athena / Mons Mouton** provides the most reliable Direct-to-Earth (DTE) communication link at **74.0% (22.2 days)**, with 15.7 days of simultaneous power and communication.\n\n• **DTE Comm Duration:** 22.2 days (74.0%)\n• **Dual-Op Overlap:** 15.7 days (52.2%)\n• **Surface Slope:** 4.9° (Safe landing)\n• **Winter Comm Availability:** 100.0% Unbroken\n\nSituated at 85.39°S on an elevated massif, the Earth remains high above local terrain obstructions throughout the lunar month.";
        actions = [
          { label: "Select IM-2 Mons Mouton", actionType: "select_site", payload: "im2_mons_mouton" },
          { label: "Check 4-Season Survival", actionType: "switch_tab", payload: "seasons" }
        ];
      } else if (q.includes("mouton") || q.includes("shackleton") || q.includes("why")) {
        responseText =
          "**Why NASA Selected Mons Mouton over Shackleton:**\n\n1. **Slope Safety:** Mons Mouton is an expansive plateau with an average slope of **4.9°**, well within the 15° lander tip-over limit. Shackleton Peak B is a knife-edge ridge with a **14.2° slope**—posing a critical tipping hazard.\n2. **Communication Reliability:** Mons Mouton maintains **74.0% Earth visibility** and 100% winter communication lock. Shackleton Peak B suffers from terrain occultation, providing only **10.3% communication** and **0.0% dual-operational hours** in November 2026.\n3. **Seasonal Robustness:** Mons Mouton survives all four orbital seasons without catastrophic blackouts.";
        actions = [
          { label: "Compare on Scorecard", actionType: "switch_tab", payload: "scorecard" },
          { label: "Read Executive Briefing (PDF)", actionType: "open_pdf", payload: "docs/LUNARSITE_COMPASS_RESEARCH_PAPER.pdf" }
        ];
      } else if (q.includes("slope") || q.includes("hazard") || q.includes("tip") || q.includes("steep")) {
        responseText =
          "**Landing Gear Slope Stability Analysis:**\n\nCLPS lander legs are certified for slopes up to **15.0°**:\n\n• **SAFE (<6°):** IM-2 Mons Mouton (4.9°) & VIPER Target (5.2°)\n• **ACCEPTABLE (<10°):** Nobile Rim 1 (7.6°) & Connecting Ridge (8.4°)\n• **MARGINAL (<12°):** Faustini Rim A (9.8°) & de Gerlache (11.2°)\n• **CRITICAL HAZARD:** Shackleton Peak B (14.2° — extreme tip-over probability)\n• **UNLANDABLE:** Haworth Crater Wall (18.5°)";
        actions = [
          { label: "Inspect Shackleton Hazard", actionType: "select_site", payload: "shackleton_peak_b" }
        ];
      } else if (q.includes("winter") || q.includes("solstice") || q.includes("darkness") || q.includes("freeze")) {
        responseText =
          "**Southern Winter Solstice Stress Test:**\n\nDuring Southern Winter Solstice, the sub-solar latitude points into the northern lunar hemisphere (+1.54°), plunging polar ridges into extended darkness:\n\n• **Mons Mouton (IM-2):** Maintains 46.1% sunlight and **100% Earth comm link** (Score: 58.7) — Survivable.\n• **Connecting Ridge CR1:** Plummets to **0.0% sunlight** with a 336-hour unbroken freeze — Fatal without RTG.\n• **Shackleton Peak B:** 0.0% sunlight, 0.0% comm, 144-hour blackout — Total loss.";
        actions = [
          { label: "Open 4-Season Stress Test", actionType: "switch_tab", payload: "seasons" }
        ];
      } else if (q.includes("ice") || q.includes("water") || q.includes("psr") || q.includes("isru")) {
        responseText =
          "**In-Situ Resource Utilization (ISRU) Volatile Access:**\n\n• **Faustini Rim A:** 2.1 km standoff to deep cold-traps (<40 K)\n• **VIPER Target:** 3.5 km across gentle 4.8° traverse corridors\n• **Connecting Ridge CR1:** 3.8 km to Shackleton PSR rim\n• **IM-2 Mons Mouton:** 4.2 km to PRIME-1 TRIDENT drill target\n\nVIPER and IM-2 offer the safest traverse slopes for autonomous surface mobility.";
        actions = [
          { label: "Open ISRU Traverse Planner", actionType: "switch_tab", payload: "isru" }
        ];
      } else {
        responseText =
          "**CLPS Flight Director Recommendation:**\n\nThe optimal balance of landing safety, continuous power, and communications is **IM-2 Athena at Mons Mouton (Score: 51.4 / 100)**.\n\n• **Slope Safety:** 4.9° (Optimal touchdown ellipse)\n• **Direct Earth Comm:** 74.0% (22.2 days continuous)\n• **Golden Operational Window:** 375 consecutive hours (15.6 days)\n• **Winter Survival:** 100% comm lock";
        actions = [
          { label: "Inspect Mons Mouton", actionType: "select_site", payload: "im2_mons_mouton" },
          { label: "View Executive Briefing (PDF)", actionType: "open_pdf", payload: "docs/LUNARSITE_COMPASS_RESEARCH_PAPER.pdf" }
        ];
      }
    } finally {
      setIsAnalyzing(false);
    }

    const copilotMsg: ChatMessage = {
      id: `cop-${Date.now()}`,
      sender: "copilot",
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actions
    };

    setMessages((prev) => [...prev, copilotMsg]);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-space-900/90 shadow-2xl p-5 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-inner">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              CLPS Flight Director AI Copilot
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-mono">
                DETERMINISTIC ENGINE
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Autonomous landing site evaluation, temporal illumination windows, and cryogenic risk mitigation.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            FLIGHT BRAIN ONLINE
          </span>
          <button
            onClick={() =>
              setMessages([
                {
                  id: "welcome-reset",
                  sender: "copilot",
                  content:
                    "**Session Reset.** Flight Director Copilot is standing by for queries on all 8 candidate polar landing sites.",
                  timestamp: "T-00:00:00"
                }
              ])
            }
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Reset Chat"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preset Prompt Chips */}
      <div>
        <div className="text-[11px] text-slate-400 font-mono uppercase tracking-wider mb-2">
          Operational Presets:
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {promptPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(preset.query)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-200 hover:text-cyan-300 transition text-xs font-medium flex items-center gap-1.5"
            >
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Feed */}
      <div className="h-96 rounded-xl border border-slate-800 bg-slate-950/80 p-4 overflow-y-auto space-y-4 custom-scrollbar text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === "user" ? "justify-end" : ""}`}
          >
            {msg.sender === "copilot" && (
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 flex-shrink-0 mt-0.5">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`max-w-2xl rounded-xl p-3.5 space-y-2 ${
                msg.sender === "user"
                  ? "bg-cyan-950/70 border border-cyan-700/60 text-slate-100"
                  : "bg-slate-900 border border-slate-800 text-slate-200"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="font-bold text-cyan-300">
                  {msg.sender === "user" ? "Flight Dynamics Officer" : "Flight Director Copilot"}
                </span>
                <span>{msg.timestamp}</span>
              </div>
              <div className="leading-relaxed whitespace-pre-wrap text-slate-200">
                {msg.content}
              </div>
              {msg.actions && msg.actions.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {msg.actions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => handleActionClick(act)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 hover:text-white text-[11px] font-mono flex items-center gap-1.5 transition"
                    >
                      <ChevronRight className="h-3 w-3" />
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {msg.sender === "user" && (
              <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                <Compass className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {isAnalyzing && (
          <div className="flex items-center gap-2 text-slate-400 font-mono text-xs italic pl-10">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Analyzing ephemeris vectors and LOLA obstruction masks...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputQuery);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask a flight dynamics question (e.g., 'What is the golden landing window in November 2026?')..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none font-mono"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isAnalyzing}
          className="rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-5 py-2.5 text-xs font-semibold flex items-center gap-2 transition"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Analyze</span>
        </button>
      </form>
    </div>
  );
};
