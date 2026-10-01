"use client";

import React from "react";
import { X, BookOpen, ExternalLink, Compass } from "lucide-react";

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-space-900 border border-slate-700 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              LunarSite Compass — Scientific Methodology & Mathematical Formulation
            </h2>
            <p className="text-xs text-slate-400">
              NASA CLPS South Pole Demarcation • LRO LOLA Topography • JPL Horizons Ephemeris
            </p>
          </div>
        </div>

        {/* Section 1: Celestial Geometry at Lunar South Pole */}
        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            1. Solar Vector & Low-Elevation Grazing Sunlight
          </h3>
          <p>
            The Moon’s rotational axis is tilted by only <strong className="text-amber-300">&epsilon;<sub>M</sub> = 1.5424°</strong> relative to the ecliptic plane normal. As a consequence, the sub-solar latitude <strong className="text-slate-200">&delta;<sub>&odot;</sub>(t)</strong> undergoes an annual sinusoidal oscillation with a period of one tropical year (T<sub>yr</sub> &approx; 365.25 days):
          </p>
          <div className="p-3 rounded-xl bg-space-950 border border-slate-800 font-mono text-xs text-cyan-300">
            &delta;<sub>&odot;</sub>(t) = &epsilon;<sub>M</sub> &middot; sin( 2&pi; (t - t<sub>0</sub>) / T<sub>yr</sub> + &phi;<sub>0</sub> )
          </div>
          <p>
            For a candidate landing site at coordinates (&phi;<sub>site</sub>, &lambda;<sub>site</sub>), the topocentric solar elevation angle &alpha;<sub>&odot;</sub>(t) is derived from the spherical law of cosines:
          </p>
          <div className="p-3 rounded-xl bg-space-950 border border-slate-800 font-mono text-xs text-cyan-300">
            sin(&alpha;<sub>&odot;</sub>) = sin(&phi;<sub>site</sub>) &middot; sin(&delta;<sub>&odot;</sub>) + cos(&phi;<sub>site</sub>) &middot; cos(&delta;<sub>&odot;</sub>) &middot; cos(&lambda;<sub>site</sub> - &lambda;<sub>&odot;</sub>)
          </div>
        </div>

        {/* Section 2: Terrestrial Libration Dynamics */}
        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            2. Terrestrial Vector & Lunar Libration Dynamics
          </h3>
          <p>
            Due to lunar orbital eccentricity (e &approx; 0.0549) and orbital plane inclination (i &approx; 5.145°), an observer on the lunar surface experiences both optical and physical librations. The sub-Earth point oscillates about (0°, 0°):
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-300">
            <li>
              <strong>Libration in Longitude l(t):</strong> Period of 27.55 days (anomalistic month) with amplitude up to <strong className="text-cyan-300">&plusmn;7.91°</strong>.
            </li>
            <li>
              <strong>Libration in Latitude b(t):</strong> Period of 27.21 days (draconic month) with amplitude up to <strong className="text-cyan-300">&plusmn;6.68°</strong>.
            </li>
          </ul>
        </div>

        {/* Section 3: Spherical Ray-Casting Horizon Masking */}
        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            3. Spherical Ray-Casting Horizon Obstruction Mask
          </h3>
          <p>
            Accounting for lunar surface curvature (R<sub>Moon</sub> = 1,737.4 km) over line-of-sight distances up to 50 km:
          </p>
          <div className="p-3 rounded-xl bg-space-950 border border-slate-800 font-mono text-xs text-emerald-300">
            H(&theta;) = sup<sub>r &isin; [100m, 50km]</sub> arctan( (z(r) - z<sub>0</sub> - r<sup>2</sup> / (2 R<sub>Moon</sub>)) / r )
          </div>
          <p>
            A celestial body (Sun or Earth) is visible if and only if its topocentric elevation angle exceeds the local topographic horizon threshold:
          </p>
          <div className="p-3 rounded-xl bg-space-950 border border-slate-800 font-mono text-xs text-emerald-300">
            Visible(t) &hArr; &alpha;(t) &ge; H(&psi;(t))
          </div>
        </div>

        {/* Section 4: Operational State Classifier */}
        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            4. 4-Way Operational State Classifier
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
              <strong className="block text-emerald-300 font-bold mb-1">Dual Operational (Optimal)</strong>
              Solar illumination &ge; H(&psi;<sub>&odot;</sub>) AND Earth elevation &ge; H(&psi;<sub>&oplus;</sub>). Solar arrays generate power while high-gain DSN antennas maintain direct-to-Earth contact.
            </div>
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200">
              <strong className="block text-amber-300 font-bold mb-1">Solar Power Only</strong>
              Sun visible, but Earth is occulted behind local crater rims. Lander must buffer scientific payloads into solid-state recorders.
            </div>
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200">
              <strong className="block text-cyan-300 font-bold mb-1">Direct Comm Only</strong>
              Earth visible, but Sun is occulted. Lander runs on secondary batteries; downlink bandwidth must be managed before critical depletion.
            </div>
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200">
              <strong className="block text-rose-300 font-bold mb-1">Mission Blackout</strong>
              Both Sun and Earth occulted. Lander enters cryogenic survival sleep mode until next sunrise.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 font-medium transition text-xs"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
