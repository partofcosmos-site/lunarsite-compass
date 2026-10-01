"use client";

import React, { useState } from "react";
import { X, Quote, Copy, Check, ExternalLink, Bookmark } from "lucide-react";

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ isOpen, onClose }) => {
  const [copiedBibtex, setCopiedBibtex] = useState(false);
  const [copiedApa, setCopiedApa] = useState(false);

  if (!isOpen) return null;

  const bibtex = `@software{lunarsite_compass_2026,
  author       = {Team Antigravity},
  title        = {LunarSite Compass: Deterministic Temporal Horizon Ray-Casting & Dual-Constraint Mission Windows for CLPS Lunar South Pole Landers},
  organization = {Autonomous Aerospace Systems Laboratory},
  year         = {2026},
  url          = {https://lunarsite-compass.vercel.app},
  note         = {NASA International Space Apps Challenge 2026, Track: CLPS Lunar Mission Browser}
}`;

  const apa = `Team Antigravity. (2026). LunarSite Compass: Deterministic Temporal Horizon Ray-Casting & Dual-Constraint Mission Windows for CLPS Lunar South Pole Landers. Autonomous Aerospace Systems Laboratory. https://lunarsite-compass.vercel.app`;

  const handleCopyBibtex = () => {
    navigator.clipboard.writeText(bibtex);
    setCopiedBibtex(true);
    setTimeout(() => setCopiedBibtex(false), 2000);
  };

  const handleCopyApa = () => {
    navigator.clipboard.writeText(apa);
    setCopiedApa(true);
    setTimeout(() => setCopiedApa(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-space-900 border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Quote className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Academic & Software Citation
            </h2>
            <p className="text-xs text-slate-400">
              NASA Space Apps 2026 • Autonomous Aerospace Systems Laboratory
            </p>
          </div>
        </div>

        {/* BibTeX Citation Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark className="h-3.5 w-3.5 text-cyan-400" />
              BibTeX Citation
            </span>
            <button
              onClick={handleCopyBibtex}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              {copiedBibtex ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy BibTeX</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-space-950 border border-slate-800 font-mono text-[11px] sm:text-xs text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
            {bibtex}
          </pre>
        </div>

        {/* APA / IEEE Style Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              APA Format
            </span>
            <button
              onClick={handleCopyApa}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              {copiedApa ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy APA</span>
                </>
              )}
            </button>
          </div>
          <div className="p-3 rounded-xl bg-space-950 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed select-all">
            {apa}
          </div>
        </div>

        {/* Additional Links */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-800">
          <div className="flex items-center gap-4 text-slate-400">
            <a
              href="https://github.com/partofcosmos-site/lunarsite-compass"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-cyan-300 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>GitHub Repository</span>
            </a>
            <a
              href="/CITATION.cff"
              target="_blank"
              className="flex items-center gap-1 hover:text-cyan-300 transition"
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>CITATION.cff</span>
            </a>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 font-medium transition text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
