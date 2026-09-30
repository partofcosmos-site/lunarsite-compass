# 🌕 LunarSite Compass

**Temporal Illumination & Earth-Communication Window Browser for CLPS South Pole Landers**  
*NASA International Space Apps Challenge 2026 — Official Challenge Track: "CLPS Lunar Mission Browser"*

---

## 🎯 Executive Overview

Commercial Lunar Payload Services (CLPS) landers, VIPER-class rovers, and Artemis human landing systems venturing to the Lunar South Pole face a brutal, non-intuitive operating environment:
- **The Sun skims the horizon** at elevation angles strictly between $-1.54^\circ$ and $+1.54^\circ$.
- **Crater rims and massifs** rising $1\text{--}4\text{ km}$ above the mean surface cast long, dynamic topographic shadows that crawl across potential landing zones.
- **The Earth wobbles** due to optical and physical librations ($\pm 7.9^\circ$ longitude, $\pm 6.7^\circ$ latitude), causing direct-to-ground radio line-of-sight to dip behind local crater walls even when sunlight is still present.

Traditional lunar site selection tools treat landing sites as **static points on a map**. **LunarSite Compass** introduces the **temporal dimension as a first-class engineering constraint**, computing the exact hour-by-hour convergence of:
1. **Solar Power Availability:** Sun elevation $\alpha_{\odot}(t) \ge$ local terrain horizon mask $H(\phi_{\odot}(t))$.
2. **Direct-to-Earth (DTE) Radio Line-of-Sight:** Earth elevation $\alpha_{\oplus}(t) \ge$ local terrain horizon mask $H(\phi_{\oplus}(t))$.
3. **Terrain Slope & Landing Safety:** Surface gradient derived from high-resolution digital elevation models.

---

## 🚀 Key Results & Site Tradeoffs (November 2026 Window)

| Landing Site | Latitude / Longitude | Surface Slope | Max Continuous Sun | Max Continuous Comm | Dual Operational Overlap | Mission Risk Profile |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Shackleton Crater Rim** *(Connecting Ridge)* | $89.7^\circ\text{ S}, 120.0^\circ\text{ E}$ | $14.2^\circ$ (Steep) | **30.0 Days** (100%) | 13.3 Days (44.3%) | 13.3 Days (44.3%) | Superb solar endurance, high landing slope hazard. |
| **Mons Mouton** *(Malapert Plateau)* | $84.9^\circ\text{ S}, -31.4^\circ\text{ W}$ | **$4.8^\circ$ (Ultra-Safe)** | 11.8 Days (56.0%) | **19.3 Days** (73.1%) | **14.3 Days** (47.5%) | Ideal CLPS landing zone: ultra-flat terrain + long DTE comms. |
| **de Gerlache Crater Rim** | $88.5^\circ\text{ S}, -68.3^\circ\text{ W}$ | $11.5^\circ$ (Moderate) | 6.6 Days (43.3%) | 12.1 Days (40.3%) | 2.9 Days (9.6%) | Heavy terrain occlusion from nearby massifs. |
| **Haworth Crater Interior** *(PSR Control)* | $87.4^\circ\text{ S}, -5.1^\circ\text{ W}$ | $8.3^\circ$ (Moderate) | **0.0 Days** (0.0%) | 9.2 Days (30.6%) | 0.0 Days (0.0%) | Permanently Shadowed Region control benchmark. |
| **Amundsen Crater Rim** | $84.5^\circ\text{ S}, 85.6^\circ\text{ E}$ | $7.1^\circ$ (Gentle) | 15.1 Days (50.4%) | 12.3 Days (41.1%) | 9.4 Days (31.2%) | Balanced southern highlands exploration site. |

---

## 🔬 NASA Resources & Data Integration

1. **LRO / LOLA (Lunar Orbiter Laser Altimeter):** Polar Stereographic Digital Elevation Model (DEM) at $20\text{ m/pixel}$ resolution (NASA PDS Geosciences Node).
2. **JPL Horizons / SPICE (DE440 Ephemeris):** High-precision topocentric ephemerides for sub-solar and sub-earth coordinates, accounting for lunar precession and physical librations.
3. **NASA Scientific Visualization Studio (SVS):** Hyperwall South Pole illumination models used for ground-truth validation.

---

## 🏗️ Architecture

```
NASA LRO / LOLA DEM               JPL Horizons / SPICE
        │                                  │
        ▼                                  ▼
Spherical Ray-Casting             Topocentric Celestial
Horizon Mask Generator            Vectors (Sun & Earth)
        │                                  │
        └─────────────────┬────────────────┘
                          ▼
             Temporal Window Solver Engine
        (Evaluates α(t) ≥ H(φ(t)) at 1h intervals)
                          │
                          ▼
            Interactive Streamlit Dashboard
        (Telemetry lines, status bands, site scorecard)
```

---

## 👥 2-Person Team Specialization (Class 11 + Class 10)

- **Class 11 Lead (Backend / Astrodynamics / Data):** Ephemeris vector calculus, spherical ray-casting horizon kernel, and multi-objective CLPS suitability metric formulation.
- **Class 10 Lead (Frontend / Visualization / Presentation):** Interactive Streamlit UI, Plotly dual-lane telemetry visualizer, 2-minute demo video production, and storytelling.
