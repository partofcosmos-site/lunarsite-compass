# 👥 Team Antigravity — Research & Engineering Leadership

**NASA International Space Apps Challenge 2026**  
**Challenge Track:** *CLPS Lunar Mission Browser*  
**Platform:** [LunarSite Compass](https://lunarsite-compass.vercel.app)  

---

### 🚀 Class 11 Lead — Backend, Astrodynamics & Flight Mechanics
**Primary Focus:** First-principles celestial orbital mechanics, vector calculus, topocentric horizon ray-casting, descent dynamics, and multi-objective optimization.

- **Ephemeris Vector Calculus & Topocentric Librations:**
  - Formulated the closed-form Jean Meeus astrodynamics solver in `engine/lunar_ephemeris.py`, deriving sub-solar latitude, sub-Earth libration angles in longitude ($\pm 7.91^\circ$) and latitude ($\pm 6.68^\circ$), and 18.613-year retrograde precession of the ascending node ($\Omega = -1934.136^\circ/\text{cy}$).
  - Derived the topocentric parallax correction factor ($0.259^\circ$) accounting for the finite distance to Earth and local selenographic site elevation.
- **Spherical Geodesic Ray-Casting Horizon Kernel:**
  - Built the LOLA DEM ray-casting solver in `engine/lola_terrain.py`, rigorously incorporating the physical lunar curvature drop ($\Delta z = -r^2 / 2 R_M$) and sampling terrain profiles out to $26\text{ km}$ across 360 azimuth headings at 20-meter resolution.
  - Mathematically resolved the Haworth Crater cold-trap benchmark proof, establishing why direct sunlight is blocked 100% of the year.
- **Powered Descent Initiation (PDI) Flight Dynamics & Link Budget:**
  - Modeled the 12-minute lunar descent trajectory in `engine/mission_solver.py`, tracking retro-burn deceleration from $1,692\text{ m/s}$ down to $1.0\text{ m/s}$, Doppler shift frequency curves ($\Delta f_D$ up to $47.4\text{ kHz}$ in X-band), and DSN 34m/70m receiver SNR link margins.
- **Multi-Objective CLPS Suitability Index:**
  - Formulated the composite fitness scoring index balancing dual-operational concurrency ($35\%$), solar power duration ($25\%$), DTE communication availability ($25\%$), battery freeze penalty ($10\%$), and landing gear slope stability ($5\%$).

---

### 🎨 Class 10 Lead — Frontend, Cartography & Visual Storytelling
**Primary Focus:** Conformal polar cartography, interactive UI design, 3D WebGL visualization, 360° cylindrical skyline rendering, and mission narrative.

- **Conformal South Polar Stereographic Cartography:**
  - Designed and implemented the high-precision polar map projection in `engine/polar_map.py` and `web/components/PolarStereographicMap.tsx` covering latitudes from $84^\circ\text{S}$ to $90^\circ\text{S}$ with true metric distance scaling ($R = 1,737.4\text{ km}$).
  - Grounded crater footprints, PSR cryogenic reservoirs, and landing corridors with official IAU Gazetteer selenographic coordinates.
  - Implemented dynamic sub-solar (yellow) and sub-Earth (cyan) directional vectors with real-time temporal scrubbers.
- **Interactive Dual-Stack Application UI:**
  - Architected the modern Next.js 14 (App Router) + TypeScript + Tailwind CSS production frontend deployed live on Vercel Edge Network at [lunarsite-compass.vercel.app](https://lunarsite-compass.vercel.app).
  - Built the companion 6-tab Streamlit mission control dashboard in `app.py` for rapid local offline aerospace analysis.
- **360° Cylindrical Skyline Horizon Renderer:**
  - Developed the panoramic silhouette visualizer in `engine/horizon_panorama.py` generating cylindrical horizon profiles used by Terrain Relative Navigation (TRN) lander optical sensors.
- **90-Second NASA Pitch Video Script & Storyboard:**
  - Authored the comprehensive cinematic presentation script and storyboard in `docs/PRESENTATION_VIDEO_SCRIPT.md`, framing the core technical problem, the "Shackleton Dilemma vs. Mons Mouton Advantage", and the open-source mission impact.

---

### 🤝 Collaborative Peer Mentorship
Together, as secondary school students (11th and 10th grade), the team demonstrated that rigorous university-grade astrodynamic research, ground-truth NASA data integration, and production-grade software engineering can be achieved through uncompromising discipline, first-principles physics, and relentless execution.
