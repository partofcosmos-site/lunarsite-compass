# 🌕 LunarSite Compass — Production Web Frontend

Production-grade, publication-quality web frontend for **LunarSite Compass**, designed for CLPS (Commercial Lunar Payload Services) and Artemis South Pole lander mission planning.

Built with **Next.js 14**, **React 18**, **TypeScript**, **Tailwind CSS**, **Lucide Icons**, and **Three.js**. Self-contained, statically exportable, and 100% Vercel deployment ready.

---

## 🚀 Key Dashboard Capabilities

### 1. 🗺️ 2D & 3D Conformal Polar Stereographic Map (84°S – 90°S)
- **Conformal Projection:** Calibrated to NASA LRO LOLA polar stereographic projection ($R_{\text{Moon}} = 1,737.4\text{ km}$).
- **Crater Rims & PSR Footprints:** Outlines prominent crater massifs (Shackleton, Faustini, Shoemaker, Haworth, Amundsen, Nobile, de Gerlache, Mons Mouton) with cryogenic PSR reservoir gradient overlays.
- **Dynamic Celestial Vectors:** Real-time sweeping sub-solar illumination vector ($\psi_\odot, \alpha_\odot$) and sub-Earth libration vector ($\psi_\oplus, \alpha_\oplus$).
- **3D Lunar South Pole Globe:** Interactive Three.js WebGL terrain dish with dynamic directional solar shading, crater depressions, and 3D lander site beacons.
- **Site Status Beacons:** Visual indicators colored by active 4-way operational state (Dual-Op, Solar Only, Comm Only, Blackout).

### 2. 📈 Real-Time Mission Telemetry & 360° Cylindrical Skyline
- **Hour-by-Hour Celestial Elevation:** High-precision SVG visualization of topocentric Sun and Earth elevations vs LOLA local terrain horizon mask $H(\theta)$.
- **30-Day Continuous Gantt Timeline:** Interactive status strip across 720 hours with click-to-scrub temporal navigation.
- **360° Cylindrical Skyline (TRN):** Synthetic LOLA skyline silhouette used by optical cameras and Terrain Relative Navigation algorithms to evaluate celestial clearance.

### 3. ⚖️ Flight Director Scorecard & Strategic Trade Studies
- **Triad Comparison:** In-depth head-to-head analysis of Mons Mouton vs Shackleton vs Nobile.
- **Dynamic Weighting Engine:** Real-time sliders for Solar Window, Earth Comm, Dual-Op Overlap, Slope Safety, and Dark Period Avoidance.
- **Comprehensive Matrix:** Sortable data table across all 8 candidate landing corridors with custom composite scores.

### 4. 🚀 PDI Powered Descent Trajectory Simulator
- **High-Fidelity Dynamics:** Simulates descent from 15 km altitude at 1,690 m/s to touchdown (0 m, 1 m/s) over a 720s burn duration.
- **Doppler Dynamics:** Real-time 8.4 GHz NASA DSN carrier frequency Doppler shift ($\Delta f = \frac{v_r}{c} f_0$).
- **DSN RF Link Budget:** Topocentric line-of-sight elevation clearance accounting for geometric dip $\Delta \theta = \sqrt{2h/R_M}$ and $-30\text{ dB}$ blackout detection.
- **Interactive Tuning:** Sliders for PDI Altitude (10–25 km), Initial Velocity (1,400–1,800 m/s), Burn Duration (500–900s), and scrubbable burn timeline.

### 5. 🧊 ISRU Volatile Traverse Route Planner
- **Cryogenic Cold Trap Proximity:** Distance and traversability to 6 major South Pole PSR reservoirs.
- **Thermal Stability Regimes:** Categorized into Super-Volatile traps ($T < 40\text{ K}$), $H_2O$ permafrost ($T = 40\text{–}70\text{ K}$), and dry regolith ($T > 70\text{ K}$).
- **Multi-Stage Waypoints:** Autonomous route calculation with intermediate solar recharging and thermal warm-up stops along illuminated ridge saddles.

### 6. ❄️ Four-Season Orbital Stress Test
- **Annual Declination Swings:** Evaluates the Moon's $\pm 1.54^\circ$ tilt and Earth libration extremes across Spring, Summer Solstice, Autumn, and Winter Solstice.
- **Cryo Night Survival:** Highlights the survival contrast between high-relief peaks (Shackleton Peak B) and low-elevation plateaus (Mons Mouton).

---

## 🛠️ Tech Stack & Architecture

- **Framework:** Next.js 14.2 (App Router, Static Export / SSR)
- **Language:** TypeScript 5.5
- **Styling:** Tailwind CSS 3.4 (Aerospace dark UI theme, glassmorphism HUD)
- **3D Graphics:** Three.js 0.169 (WebGL South Pole Dish & Directional Lighting)
- **Icons:** Lucide React
- **Data Bundle:** Precomputed LOLA DEM & JPL Horizons DE440 ephemeris datasets embedded in `data/`

---

## 📦 Project Structure

```
web/
├── app/
│   ├── globals.css                # Aerospace space-grid styling & glassmorphism
│   ├── layout.tsx                 # Root layout & NASA CLPS metadata
│   └── page.tsx                   # Main mission dashboard with tab orchestration
├── components/
│   ├── Header.tsx                 # Temporal scrubber, playback controls, site switcher
│   ├── KpiRow.tsx                 # 5 High-impact metric cards & live status banner
│   ├── PolarStereographicMap.tsx  # 2D Conformal SVG & 3D Three.js South Pole map
│   ├── TelemetryCharts.tsx        # Elevation vs terrain mask & 360° cylindrical skyline
│   ├── ScorecardTradeStudy.tsx    # Multi-factor trade studies & dynamic weight sliders
│   ├── DescentSimulator.tsx       # Powered descent trajectory & Doppler / DSN link budget
│   ├── IsruTraversePlanner.tsx    # PSR cold trap proximity & rover route waypoints
│   ├── SeasonalStressTest.tsx     # 4-Season orbital declination benchmark
│   └── MethodologyModal.tsx       # Mathematical formulations & ephemeris equations
├── data/                          # Precomputed mission datasets
│   ├── mission_summary_matrix.json
│   ├── seasonal_benchmark_analysis.json
│   ├── sites.json
│   ├── sites_isru_analysis.json
│   ├── telemetry_by_site.json
│   └── timeline_epochs.json
├── lib/
│   ├── data.ts                    # Type-safe data loaders
│   ├── physics.ts                 # Cartographic projections, PDI dynamics, Doppler math
│   └── types.ts                   # Domain models & TypeScript interfaces
├── out/                           # Static production export bundle
├── next.config.mjs
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

---

## 🚢 Build & Vercel Deployment

### Local Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```
Generates a zero-error static export in `out/` ready for Vercel, Cloudflare Pages, GitHub Pages, or any modern edge hosting platform.
