# 🌕 LunarSite Compass

**Deterministic Temporal Horizon Ray-Casting & Dual-Constraint Mission Windows for CLPS Lunar South Pole Landers**  
*NASA International Space Apps Challenge 2026 — Official Challenge Track: "CLPS Lunar Mission Browser"*  
*Team Antigravity — Secondary School Explorers (Class 11 & Class 10)*

---

## 🎯 Executive Overview

Commercial Lunar Payload Services (CLPS) landers (Intuitive Machines Nova-C, Astrobotic Griffin, Firefly Blue Ghost), VIPER-class rovers, and Artemis human landing systems targeting the Lunar South Pole operate in an extreme, non-intuitive environment:
- **Grazing Solar Angles:** The Sun skims the horizon at elevation angles strictly between $-1.54^\circ$ and $+1.54^\circ$.
- **Dynamic Terrain Shadows:** Crater rims and massifs rising $1\text{--}4\text{ km}$ above the mean surface cast long topographic shadows extending over $50\text{ km}$ that crawl across potential landing zones.
- **Libration-Driven Comm Occultation:** Optical and physical librations ($\pm 7.9^\circ$ longitude, $\pm 6.7^\circ$ latitude) cause direct-to-ground radio line-of-sight to dip behind local crater walls even when sunlight is still present.
- **Cryogenic Survival Limits:** Solar-powered landers without RTGs suffer catastrophic battery freezes ($T < 40\text{ K}$) during shadow events exceeding 24 to 48 hours.

Traditional lunar site selection tools treat landing sites as **static points on a map**. **LunarSite Compass** introduces the **temporal dimension as a first-class engineering constraint**, computing the exact hour-by-hour convergence of solar power, Direct-to-Earth (DTE) communication, landing gear slope stability, rover ISRU volatile proximity, and descent flight dynamics.

---

## 🚀 8-Site Comparative Benchmark (November 2026 Window)

| Landing Site | Lat ($^\circ\text{S}$) | Lon ($^\circ\text{E}$) | Surface Slope ($^\circ$) | Sunlight Window (Days) | Earth Comm Window (Days) | Dual Window (Days) | Max Night (Hours) | Blackout (Hours) | CLPS Score (/100) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Peak Near Shackleton (Peak B)** | $-89.68$ | $129.00$ | $13.8^\circ$ | $30.00\text{ d}$ | $13.21\text{ d}$ | $13.21\text{ d}$ | $0\text{ h}$ | $0\text{ h}$ | **66.4** |
| **Connecting Ridge (Site CR1)** | $-89.47$ | $222.60$ | $14.5^\circ$ | $30.00\text{ d}$ | $12.00\text{ d}$ | $12.00\text{ d}$ | $0\text{ h}$ | $0\text{ h}$ | **64.0** |
| **IM-2 Athena / PRIME-1 (Mons Mouton)** | $-84.79$ | $29.20$ | $5.2^\circ$ | $16.21\text{ d}$ | $19.29\text{ d}$ | $16.21\text{ d}$ | $326\text{ h}$ | $178\text{ h}$ | **53.7** |
| **VIPER Target (Mons Mouton Center)** | $-85.42$ | $31.62$ | $4.8^\circ$ | $16.29\text{ d}$ | $18.71\text{ d}$ | $16.25\text{ d}$ | $327\text{ h}$ | $205\text{ h}$ | **52.7** |
| **Nobile Rim 1 (West Rim Plateau)** | $-85.44$ | $37.37$ | $5.5^\circ$ | $16.04\text{ d}$ | $18.17\text{ d}$ | $16.04\text{ d}$ | $322\text{ h}$ | $224\text{ h}$ | **51.6** |
| **Faustini Crater Rim A (Site LM7)** | $-87.89$ | $85.00$ | $9.8^\circ$ | $15.92\text{ d}$ | $13.00\text{ d}$ | $12.00\text{ d}$ | $244\text{ h}$ | $314\text{ h}$ | **43.3** |
| **de Gerlache Crater Rim 1** | $-88.50$ | $-68.30$ | $11.2^\circ$ | $9.29\text{ d}$ | $12.00\text{ d}$ | $2.50\text{ d}$ | $344\text{ h}$ | $116\text{ h}$ | **27.0** |
| **Haworth Crater Interior (PSR Control)** | $-87.40$ | $-5.17$ | $8.3^\circ$ | $0.00\text{ d}$ | $5.42\text{ d}$ | $0.00\text{ d}$ | $720\text{ h}$ | $590\text{ h}$ | **3.6** |

---

## 🧊 ISRU Water-Ice Cold Trap Proximity & Rover Traverse

| Candidate Landing Site | Nearest Cold Trap Reservoir | Range (km) | Cold Trap Temp | Volatiles Trapped | Rover Mobility Classification | ISRU Score (/100) |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: |
| **Nobile Rim 1 (West Rim)** | Nobile West Rim Cold Pockets | $3.11\text{ km}$ | $68\text{ K}$ | Permafrost Regolith, Silicates | Direct Wheeled Traverse (Optimal) | **85.8** |
| **IM-2 Athena (Mons Mouton)** | Mons Mouton Plateau Depressions | $6.88\text{ km}$ | $65\text{ K}$ | Shallow Buried Ice ($1\text{m}$ depth) | Direct Wheeled Traverse (Optimal) | **82.1** |
| **VIPER Target (Mons Mouton)** | Mons Mouton Plateau Depressions | $14.41\text{ km}$ | $65\text{ K}$ | Shallow Buried Ice ($1\text{m}$ depth) | Long-Range Rover Traverse | **68.3** |
| **Haworth Crater Interior (PSR)** | Haworth Crater Floor | $0.00\text{ km}$ | $35\text{ K}$ | Super-Volatiles ($\text{CO}, \text{Ar}, \text{H}_2\text{O}$) | Steep Crater Wall (Requires Tether/Hopper) | **66.6** |
| **Shackleton Peak B** | Shackleton Crater Floor | $11.77\text{ km}$ | $38\text{ K}$ | $\text{H}_2\text{O}\text{ Ice}, \text{CO}_2, \text{NH}_3$ | Steep Crater Wall ($28.5^\circ$ Slope) | **44.2** |
| **Faustini Crater Rim A** | Faustini Crater Floor | $24.03\text{ km}$ | $42\text{ K}$ | $\text{H}_2\text{O}\text{ Ice}, \text{CH}_4, \text{H}_2\text{S}$ | Steep Crater Wall ($22.0^\circ$ Slope) | **37.2** |

---

## 🔬 Scientific Methodology & Mathematical Proof

### 1. Topocentric Coordinate Basis
Given lander position vector $\vec{r}_P = (R_M + z_0) [\cos\phi_0 \cos\lambda_0, \cos\phi_0 \sin\lambda_0, \sin\phi_0]^T$ in the Mean Earth/Polar Axis (ME/PA) frame:
$$\alpha(t) = \arcsin\left(\hat{u}(t) \cdot \hat{Z}\right), \quad \psi(t) = \text{atan2}\left(\hat{u}(t) \cdot \hat{E}, -\hat{u}(t) \cdot \hat{S}\right)$$

### 2. Spherical Ray-Casting with Lunar Curvature
For terrain feature at radial range $r$ along azimuth heading $\psi$ with height $z(r, \psi)$:
$$\tan \theta(r, \psi) = \frac{z(r, \psi) - z_0 - \frac{r^2}{2 R_M}}{r}$$
$$H(\psi) = \max_{r \in [r_{\min}, r_{\max}]} \theta(r, \psi)$$

### 3. Dual-Constraint Decision Logic
$$\text{Dual}(t_k) = \mathbb{I}(\alpha_{\odot}(t_k) \ge H(\psi_{\odot}(t_k))) \cdot \mathbb{I}(\alpha_{\oplus}(t_k) \ge H(\psi_{\oplus}(t_k)))$$
$$\text{Blackout}(t_k) = \mathbb{I}(\alpha_{\odot}(t_k) < H(\psi_{\odot}(t_k))) \cdot \mathbb{I}(\alpha_{\oplus}(t_k) < H(\psi_{\oplus}(t_k)))$$

---

## 🏗️ System Architecture & Deliverables

```
├── engine/
│   ├── lunar_ephemeris.py      # Topocentric celestial vectors & physical/optical librations
│   ├── lola_terrain.py         # LOLA spherical ray-casting horizon elevation mask generator
│   ├── mission_solver.py       # Hourly temporal window classification engine
│   ├── polar_map.py            # 2D Polar Stereographic cartography & dynamic horizon vectors
│   ├── isru_traverse.py        # PSR cold-trap proximity & rover mobility analyzer
│   ├── descent_trajectory.py   # Powered Descent Initiation (PDI) flight dynamics & DSN link budget
│   └── horizon_panorama.py     # 360-degree cylindrical skyline silhouettes for TRN navigation
├── app.py                      # Interactive Streamlit mission dashboard (6 aerospace tabs)
├── docs/
│   ├── LUNARSITE_COMPASS_RESEARCH_PAPER.typ  # Master academic treatise (Typst)
│   ├── LUNARSITE_COMPASS_RESEARCH_PAPER.pdf  # Compiled 5-page publication paper (pdf-qa: 0 defects)
│   ├── PRESENTATION_VIDEO_SCRIPT.md          # 90-second NASA Space Apps Challenge video script
│   └── PDS_LOLA_SPICE_SPECIFICATION.md       # NASA PDS and SPICE geodetic dataset archive specs
├── scripts/
│   ├── generate_mission_data.py        # 5,760 hourly epoch pre-computation engine
│   ├── run_seasonal_simulation.py      # Four-season astronomical stress benchmark
│   ├── generate_isru_data.py           # Precompute volatile cold trap proximity
│   ├── certify_mission.py              # Automated Flight Director Mission Go/No-Go Certification CLI
│   └── autonomous_workflow_daemon.py   # Recurring 10-minute workflow daemon & state evaluator
└── tests/
    └── test_engine.py          # 7-test first-principles unit test suite (100% passing)
```

---

## 👥 2-Person Team Specialization (Class 11 + Class 10)

- **Class 11 Lead (Backend / Astrodynamics / Flight Mechanics):** Ephemeris vector calculus, spherical ray-casting horizon kernel, PDI descent dynamics, and multi-objective suitability index formulation.
- **Class 10 Lead (Frontend / Cartography / Visual Storytelling):** Polar Stereographic cartography, interactive Streamlit UI, 360° cylindrical skyline renderer, and 90-second NASA pitch video script.
