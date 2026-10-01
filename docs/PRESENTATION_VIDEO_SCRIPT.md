# LunarSite Compass — 90-Second NASA Space Apps Challenge Video Pitch Script
**Challenge Track:** CLPS Lunar Mission Browser  
**Team:** Team Antigravity (Autonomous Aerospace Systems Laboratory)  
**Total Target Runtime:** Exactly 90 Seconds (01:30)  
**Evaluation Rubric Alignment:** Problem (20%) → NASA Data (20%) → Technical Methodology (20%) → Empirical Results (20%) → Real-World Impact (20%)

---

## Pitch Timeline Overview

```
[00:00 - 00:18] | SCENE 1: The Polar Trap (The Overlooked Problem)
[00:18 - 00:36] | SCENE 2: The NASA Data Foundation (LOLA & SPICE)
[00:36 - 00:54] | SCENE 3: The First-Principles Ray-Casting Engine
[00:54 - 01:12] | SCENE 4: The Live Discovery & Mons Mouton Solution
[01:12 - 01:30] | SCENE 5: Aerospace Impact & Open-Source Legacy
```

---

## Detailed Scene Breakdown & Storyboard

### SCENE 1: The Polar Trap — The Problem with Static Maps (0:00 – 0:18 | 18 Seconds)
- **Speaker:** **Cartography & Spatial Systems Lead**
- **Visual:** Cinematic 3D render of the lunar South Pole plunging into shadow; split-screen showing a standard static NASA color map vs. a lander freezing in pitch black.
- **On-Screen Text Overlay:** *"STATIC MAPS LIE: At 89°S, the Sun Never Rises Above 1.5°."*
- **Voiceover (Spoken with energy and urgency):**
  > *"When commercial landers touch down at the lunar South Pole, static maps will deceive them. In 2D satellite imagery, crater rims look permanently lit. But at 89 degrees South, the Sun grazes the horizon at just 1.5 degrees, casting 50-kilometer shadows that race across the regolith. Worse, Earth wobbles by plus-or-minus 8 degrees in libration, repeatedly severing ground communications. A 24-hour shadow freezes batteries to 40 Kelvin. Static maps don't capture this. We needed a temporal compass."*

---

### SCENE 2: The NASA Data Foundation — LOLA & Horizons (0:18 – 0:36 | 18 Seconds)
- **Speaker:** **Astrodynamics & Flight Mechanics Lead**
- **Visual:** Quick cut to LRO spacecraft orbiting the Moon; high-resolution digital elevation model zooming into Shackleton, Faustini, and Mons Mouton; NASA JPL Horizons DE440 ephemeris vectors.
- **On-Screen Text Overlay:** *"GROUND TRUTH: NASA PDS LOLA 80m DEM + JPL Horizons DE440 Ephemeris"*
- **Voiceover (Authoritative, precise):**
  > *"Enter LunarSite Compass. We anchored our engine directly in NASA's highest-precision planetary datasets: NASA PDS LRO LOLA polar Digital Elevation Models and NASA JPL Horizons DE440 ephemerides. We modeled the exact physical librations, topocentric lunar obliquity, and sub-meter topographic relief for eight candidate landing sites across 720 hourly mission epochs."*

---

### SCENE 3: The First-Principles Ray-Casting Engine (0:36 – 0:54 | 18 Seconds)
- **Speaker:** **Astrodynamics & Flight Mechanics Lead**
- **Visual:** 3D ray-casting animation showing elevation rays projecting outward from a lander on a crater rim, clipping against distant topography; mathematical equations smoothly fading in.
- **On-Screen Text Overlay:** *$$\tan\theta = \frac{z(r) - z_0 - \frac{r^2}{2R_M}}{r} \quad | \quad \text{Sub-second Ray Casting}$$*
- **Voiceover (Confident, technical clarity):**
  > *"Instead of guessing or training black-box models, we built a deterministic spherical ray-casting engine. Accounting for lunar curvature drop, our solver casts 360-degree horizon masks out to 26 kilometers. Every hour, it checks whether the Sun and Earth clear the terrain simultaneously, generating an operational matrix: Dual Power and Comm, Power Only, Comm Only, or Fatal Blackout."*

---

### SCENE 4: The Discovery & Live Dashboard (0:54 – 01:12 | 18 Seconds)
- **Speaker:** **Cartography & Spatial Systems Lead**
- **Visual:** Live screen-recording of the **LunarSite Compass Platform** (`https://lunarsite-compass.vercel.app`); user scrubs the temporal slider across November 2026; the 2D Polar Stereographic map rotates solar/Earth vectors; landing sites switch from gold to green to red.
- **On-Screen Text Overlay:** *"THE SHACKLETON DILEMMA vs. THE MONS MOUTON TRIUMPH"*
- **Voiceover (Enthusiastic, breakthrough tone):**
  > *"Our simulation revealed a stunning truth: Shackleton Peak B looks attractive with high summer sun, but its steep slopes and extended communication cutoffs create severe mission risks. Meanwhile, Mons Mouton—NASA's chosen site for VIPER and IM-2—provides gentle 5-degree slopes, over 22 days of Direct-to-Earth communication, and 15 days of continuous dual-op power! Our math independently proves why NASA selected Mons Mouton."*

---

### SCENE 5: Impact & Open-Source Legacy (01:12 – 01:30 | 18 Seconds)
- **Speaker:** **Engineering & Research Leadership (Shared Closing)**
- **Visual:** Full-screen view of the 5-page publication-grade research paper (`LUNARSITE_COMPASS_RESEARCH_PAPER.pdf`), followed by the open GitHub repository and a soaring cinematic render of the Artemis lunar base.
- **On-Screen Text Overlay:** *"LIVE AT LUNARSITE-COMPASS.VERCEL.APP • 100% OPEN SOURCE • FOR ALL HUMANITY'S MOONSHOTS"*
- **Voiceover (Inspiring, forward-looking climax):**
  > *(Astrodynamics Lead):* *"LunarSite Compass runs 100% offline in under a second and is deployed live globally on Vercel."*  
  > *(Spatial Systems Lead):* *"Built to aerospace engineering standards, LunarSite Compass provides the foresight required to safeguard humanity's return to the Moon. Every lander, rover, and Artemis astronaut deserves to know when the sun will rise and when the Earth will speak. Explore LunarSite Compass—navigating the dawn of the lunar frontier."*

---

## Production Specifications & Technical Cue Sheet

| Timestamp | Visual Asset / Action | Narration Keyword | Audio Track Cue |
| :--- | :--- | :--- | :--- |
| `00:00 - 00:06` | Cold open: Dark Moon South Pole rotating | *"When commercial landers touch down..."* | Deep sub-bass swell, ticking clock |
| `00:06 - 00:18` | Split screen: Static 2D map vs Frozen Lander | *"Static maps don't capture this..."* | Rising tension synth |
| `00:18 - 00:27` | LRO orbit + LOLA DEM elevation wireframe | *"LRO LOLA 20-meter DEM..."* | Crisp mechanical data pulses |
| `00:27 - 00:36` | SPICE kernel vectors (Sun, Earth, Moon) | *"JPL NAIF SPICE planetary kernels..."* | Ambient orchestral strings enter |
| `00:36 - 00:45` | 3D Ray-Casting animation over crater rim | *"Deterministic spherical ray-casting..."* | Driving rhythmic percussion |
| `00:45 - 00:54` | Status classification: Green/Yellow/Blue/Red | *"Dual Power and Comm or Fatal Blackout"* | Build-up beat drop |
| `00:54 - 01:03` | Live Dashboard: Polar map scrubber in action | *"Our simulation revealed a stunning truth..."* | Heroic synth melody |
| `01:03 - 01:12` | Comparative chart: Shackleton vs Mons Mouton | *"Proves why NASA selected Mons Mouton"* | Brass accentuation |
| `01:12 - 01:21` | Typst PDF paper showcase + Codebase | *"Built to aerospace engineering standards..."* | Uplifting acoustic crescendo |
| `01:21 - 01:30` | End card: Team Antigravity, GitHub link | *"Navigating the dawn of the lunar frontier."* | Resolving cinematic chord & fade |
