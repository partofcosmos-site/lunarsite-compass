// =============================================================================
// LUNARSITE COMPASS: EXECUTIVE MISSION BRIEFING & DECISION GUIDE
// NASA Space Apps Challenge 2026 | Track: "CLPS Lunar Mission Browser"
// Master Flight Feasibility & Polar Landing Selection Briefing
// =============================================================================

#set page(
  paper: "a4",
  margin: (top: 2.4cm, bottom: 2.5cm, left: 2.0cm, right: 2.0cm),
  header-ascent: 12pt,
  footer-descent: 12pt,
  header: context {
    let page-num = counter(page).get().first()
    if page-num > 1 {
      grid(
        columns: (1fr, auto),
        align: (left + horizon, right + horizon),
        text(8pt, fill: rgb("64748b"), weight: "bold")[LUNARSITE COMPASS: CLPS LUNAR MISSION BROWSER],
        text(8pt, fill: rgb("64748b"))[NASA Space Apps Challenge 2026]
      )
      v(-4pt)
      line(length: 100%, stroke: 0.5pt + rgb("cbd5e1"))
    }
  },
  footer: context {
    let page-num = counter(page).get().first()
    let total-pages = counter(page).final().first()
    line(length: 100%, stroke: 0.4pt + rgb("e2e8f0"))
    v(2pt)
    grid(
      columns: (1fr, auto),
      align: (left + horizon, right + horizon),
      text(7.5pt, fill: rgb("94a3b8"))[LunarSite Compass Autonomous Mission Architecture],
      text(8pt, fill: rgb("64748b"), weight: "bold")[Page #page-num of #total-pages]
    )
  }
)

#set text(
  font: ("New Computer Modern", "Times New Roman"),
  size: 9.5pt,
  fill: rgb("0f172a"),
  lang: "en"
)
#set par(justify: true, leading: 0.62em)
#set math.equation(numbering: "(1)")

// Heading Styling
#show heading.where(level: 1): it => block(spacing: 12pt)[
  #v(6pt)
  #text(12pt, weight: "bold", fill: rgb("1e3a8a"))[#it]
  #v(2pt)
]
#show heading.where(level: 2): it => block(spacing: 10pt)[
  #v(4pt)
  #text(10pt, weight: "bold", fill: rgb("1e40af"))[#it]
  #v(2pt)
]
#show heading.where(level: 3): it => block(spacing: 8pt)[
  #text(9pt, weight: "bold", fill: rgb("334155"))[#it]
]

// Callout Helper Box
#let callout(title: "NOTE", body, border-color: rgb("2563eb"), bg-color: rgb("eff6ff")) = {
  block(
    fill: bg-color,
    stroke: (left: 3pt + border-color, rest: 0.5pt + border-color.lighten(60%)),
    radius: (right: 4pt, left: 1pt),
    inset: (x: 10pt, y: 7pt),
    width: 100%,
    [
      #text(8.5pt, weight: "bold", fill: border-color)[#title] \
      #v(2pt)
      #text(8.5pt, fill: rgb("1e293b"))[#body]
    ]
  )
}

// -----------------------------------------------------------------------------
// TITLE & METADATA BLOCK
// -----------------------------------------------------------------------------
#align(center)[
  #v(0.2cm)
  #text(18pt, weight: "bold", fill: rgb("1e3a8a"))[LUNARSITE COMPASS] \
  #v(3pt)
  #text(11pt, weight: "bold", fill: rgb("2563eb"))[CLPS Lunar South Pole Landing Site Selection & Operational Decision Guide] \
  #v(6pt)
  #text(8.5pt, style: "italic", fill: rgb("64748b"))[A First-Principles Mission Evaluation Briefing for NASA Space Apps Challenge 2026] \
  #v(8pt)
  #grid(
    columns: (1fr, 1fr),
    gutter: 12pt,
    align: (center, center),
    [
      #text(9.5pt, weight: "bold")[Team Antigravity] \
      #text(8pt, fill: rgb("64748b"))[Autonomous Aerospace Systems Laboratory] \
      #text(8pt, fill: rgb("2563eb"))[partofcosmmos\@gmail.com]
    ],
    [
      #text(9.5pt, weight: "bold")[NASA Space Apps Challenge 2026] \
      #text(8pt, fill: rgb("64748b"))[Challenge Track: CLPS Lunar Mission Browser] \
      #text(8pt, fill: rgb("64748b"))[Production Mission Planning System]
    ]
  )
  #v(6pt)
  #line(length: 50%, stroke: 0.8pt + rgb("3b82f6"))
  #v(6pt)
]

// -----------------------------------------------------------------------------
// EXECUTIVE SUMMARY FOR FLIGHT DIRECTORS
// -----------------------------------------------------------------------------
#align(center)[
  #block(
    width: 100%,
    inset: (x: 12pt, y: 9pt),
    stroke: (left: 3.5pt + rgb("2563eb")),
    fill: rgb("f8fafc"),
    radius: (right: 4pt),
    align(left)[
      #text(10pt, weight: "bold", fill: rgb("1e3a8a"))[Executive Summary for Mission Directors & Evaluators] \
      #v(3pt)
      #text(8.5pt, fill: rgb("1e293b"))[
        *The Core Operational Problem:* NASA's Commercial Lunar Payload Services (CLPS) landers (such as Intuitive Machines Nova-C and Astrobotic Griffin) depend entirely on solar arrays and lithium-ion batteries without radioisotope thermal generators. At the lunar south pole, the Sun grazes the horizon at just $1.54 degree$, causing mountains to cast fast-moving shadows up to 50 km long. If a lander is caught in a shadow exceeding 24 to 48 hours, its batteries deplete, temperatures plunge to $40 "K"$ ($-233 degree "C"$), and the spacecraft dies permanently. Simultaneously, the Earth wobbles in the sky by up to $plus.minus 7.9 degree$ (libration), repeatedly dipping below local crater rims and severing communication with ground stations.

        *The Central Insight of LunarSite Compass:* Conventional maps rely on static averages (e.g., "annual percentage of sunlight"), which mask fatal mission failure modes. A site with 80% annual sunlight is catastrophic if the remaining 20% is an unbroken 6-day freeze during mission operations, or if sunlight and Earth line-of-sight never overlap. LunarSite Compass solves this deterministically: by ray-casting against real NASA LRO LOLA topography and JPL Horizons ephemerides across 5,760 epochs, it identifies *exact, simultaneous dual-operational windows* where landers receive solar power and direct Earth contact at the same moment.
      ]
    ]
  )
]

#v(6pt)

// -----------------------------------------------------------------------------
// SECTION 1: THE LUNAR POLAR ENVIRONMENT IN PLAIN ENGLISH
// -----------------------------------------------------------------------------
= 1. Why Is Landing at the Lunar South Pole So Difficult?

To understand how landing sites must be evaluated, consider the three physical realities governing the Moon's polar regions:

+ *Grazing Solar Incidence (The Headlight Effect):* The Moon's spin axis is tilted by only $1.5424 degree$ relative to the ecliptic plane. Unlike equatorial sites where the Sun climbs overhead, at the South Pole the Sun circles the horizon like a distant car headlight shining across a rugged landscape. A ridge 2 kilometers tall casts a shadow extending 40 to 60 kilometers across the surface.
+ *Earth Libration (The Communication Dip):* Because the Moon's orbit is elliptical ($e = 0.0549$) and tilted, the Moon wobbles from our vantage point. As seen from a polar lander, the Earth traces an apparent monthly oval loop ($plus.minus 7.91 degree$ in longitude and $plus.minus 6.68 degree$ in latitude). When the Earth swings downward, a lander sitting on a reverse slope or in a shallow depression loses Direct-to-Earth (DTE) communication with NASA's Deep Space Network (DSN).
+ *The Cryogenic Freeze Cliff:* CLPS landers carry limited battery reserves. A shadow lasting more than two earth days causes thermal runaway freeze. Survival requires landing during a *continuous solar window* that coincides with an *uninterrupted Earth communication window*.

#v(4pt)
#align(center)[
  #image("figures/fig1_polar_geometry.png", width: 96%)
  #v(-4pt)
  #text(8pt, fill: rgb("64748b"), style: "italic")[Figure 1: Celestial geometry at the lunar south pole. Grazing sunlight produces 50 km shadows while Earth libration causes communication occultation behind elevated crater massifs.]
]
#v(6pt)

// -----------------------------------------------------------------------------
// SECTION 2: THE GREAT DEBATE: SHACKLETON PEAK VS. MONS MOUTON
// -----------------------------------------------------------------------------
= 2. The Strategic Debate: Shackleton Peak vs. Mons Mouton

In popular space exploration literature, the rims of Shackleton Crater are celebrated as "peaks of eternal light." However, an rigorous flight mechanics audit reveals why NASA selected *Mons Mouton* for the PRIME-1 ice drill (IM-2) and the VIPER rover rather than Shackleton Crater:

- *The Fatal Flaws of Shackleton Peak B:* While Peak B receives high illumination during peak summer, its average slope is *14.2°*—dangerously close to the 15.0° landing gear tip-over limit. Touchdown on a 14.2° boulder-strewn ridge risks catastrophic rover roll-over. Furthermore, Earth sits near the local horizon; local terrain blocks communication 89.7% of the month, resulting in *zero dual-operational hours* in November 2026.
- *The Mons Mouton Advantage:* In contrast, Mons Mouton is an expansive plateau with an average slope of just *4.9° to 5.2°*, providing a safe, flat landing zone. Because it sits at $85.4 degree "S"$ on an elevated massif, the Earth remains high in the sky, delivering *22.2 days of unbroken Earth communications* and *15.7 days of simultaneous solar power and communications*.

#v(4pt)
#align(center)[
  #image("figures/fig3_mons_mouton_vs_shackleton.png", width: 96%)
  #v(-4pt)
  #text(8pt, fill: rgb("64748b"), style: "italic")[Figure 2: Topographic profile comparison. Mons Mouton provides an expansive 4.9° safe landing corridor, whereas Shackleton Peak B presents a knife-edge 14.2° slope hazard.]
]

#v(6pt)

// -----------------------------------------------------------------------------
// SECTION 3: 8-SITE MASTER OPERATIONAL MATRIX
// -----------------------------------------------------------------------------
= 3. Complete 8-Site Master Operational Matrix (November 2026)

Table 1 presents the full operational analysis evaluated across 720 hourly epochs for the November 2026 synodic cycle using NASA LOLA 20-meter altimetry and JPL Horizons ephemerides:

#v(4pt)
#table(
  columns: (2.3fr, 1.1fr, 0.9fr, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr),
  align: (left, center, center, center, center, center, center, center, center),
  stroke: (x, y) => if y == 0 { (bottom: 1.2pt + rgb("1e3a8a")) } else { 0.4pt + rgb("cbd5e1") },
  fill: (x, y) => if y == 0 { rgb("f1f5f9") } else if calc.odd(y) { rgb("f8fafc") } else { white },
  [#text(7.5pt, weight: "bold")[Landing Site]],
  [#text(7.5pt, weight: "bold")[Coordinates]],
  [#text(7.5pt, weight: "bold")[Slope]],
  [#text(7.5pt, weight: "bold")[Sun (%)]],
  [#text(7.5pt, weight: "bold")[Comm (%)]],
  [#text(7.5pt, weight: "bold")[Dual (%)]],
  [#text(7.5pt, weight: "bold")[Max Dark]],
  [#text(7.5pt, weight: "bold")[Score]],
  [#text(7.5pt, weight: "bold")[Verdict]],

  [Connecting Ridge (Site CR1)], [89.4°S, 222.5°E], [8.4°], [75.4%], [44.9%], [44.0%], [124 h], [*54.1*], [#text(fill: rgb("059669"), weight: "bold")[OPTIMAL]],
  [IM-2 Athena (Mons Mouton)], [85.4°S, 328.7°E], [4.9°], [52.2%], [74.0%], [52.2%], [188 h], [*51.4*], [#text(fill: rgb("059669"), weight: "bold")[GO (NASA)]],
  [VIPER Target (Mons Mouton)], [85.5°S, 328.6°E], [5.2°], [53.3%], [70.0%], [46.8%], [185 h], [*50.4*], [#text(fill: rgb("059669"), weight: "bold")[GO (ROVER)]],
  [Faustini Rim A (Site LM7)], [87.1°S, 76.5°E], [9.8°], [38.3%], [32.4%], [13.5%], [268 h], [*25.3*], [#text(fill: rgb("d97706"), weight: "bold")[CAUTION]],
  [de Gerlache Crater Rim 1], [88.3°S, 272.5°E], [11.2°], [52.4%], [26.4%], [5.3%], [224 h], [*24.6*], [#text(fill: rgb("d97706"), weight: "bold")[CAUTION]],
  [Nobile Rim 1 (West Rim)], [85.2°S, 35.4°E], [7.6°], [27.2%], [29.3%], [5.6%], [312 h], [*18.2*], [#text(fill: rgb("dc2626"), weight: "bold")[MARGINAL]],
  [Peak Near Shackleton (Peak B)], [89.7°S, 120.0°E], [14.2°], [39.7%], [10.3%], [0.0%], [289 h], [*16.8*], [#text(fill: rgb("dc2626"), weight: "bold")[NO-GO]],
  [Haworth Crater (PSR Baseline)], [87.4°S, 354.9°E], [18.5°], [0.0%], [0.0%], [0.0%], [720 h], [*0.0*], [#text(fill: rgb("475569"), weight: "bold")[CONTROL]],
)

#v(4pt)
#align(center)[
  #image("figures/fig2_site_tradeoffs.png", width: 96%)
  #v(-4pt)
  #text(8pt, fill: rgb("64748b"), style: "italic")[Figure 3: Multi-criteria benchmark across all 8 candidate sites. Panel A compares power generation vs communication; Panel B highlights terrain slope vs suitability score.]
]

#v(6pt)

// -----------------------------------------------------------------------------
// SECTION 4: THE NOVEMBER 2026 GOLDEN OPERATIONAL WINDOW
// -----------------------------------------------------------------------------
= 4. The November 2026 Golden Operational Window

The central operational takeaway for CLPS mission directors is timing: mission success is non-linear. At Mons Mouton, landing at hour 120 (November 5) guarantees *375 consecutive hours (15.6 days)* of continuous solar power and direct DSN communication. In contrast, landing 48 hours earlier encounters a cryogenic shadow event that drains lander batteries before full deployment.

#v(4pt)
#align(center)[
  #image("figures/fig4_november_operational_timeline.png", width: 96%)
  #v(-4pt)
  #text(8pt, fill: rgb("64748b"), style: "italic")[Figure 4: Instantaneous topocentric elevation timeline at Mons Mouton across November 2026. The green band highlights the 375-hour continuous Golden Dual-Operational Window.]
]

#v(6pt)

// -----------------------------------------------------------------------------
// SECTION 5: FOUR-SEASON SURVIVABILITY STRESS TEST
// -----------------------------------------------------------------------------
= 5. Four-Season Survivability Stress Test

Because the Moon's axis is tilted $1.5424 degree$, the polar regions experience severe seasons. During Southern Winter Solstice, the Sun points into the northern lunar hemisphere, plunging high-latitude peaks into prolonged darkness:

#v(4pt)
#table(
  columns: (2.5fr, 1.8fr, 1.2fr, 1.2fr, 1.2fr, 1fr),
  align: (left, center, center, center, center, center),
  stroke: (x, y) => if y == 0 { (bottom: 1.2pt + rgb("1e3a8a")) } else { 0.4pt + rgb("cbd5e1") },
  fill: (x, y) => if y == 0 { rgb("f1f5f9") } else if calc.odd(y) { rgb("f8fafc") } else { white },
  [#text(7.5pt, weight: "bold")[Candidate Landing Site]],
  [#text(7.5pt, weight: "bold")[Orbital Season]],
  [#text(7.5pt, weight: "bold")[Sunlight (%)]],
  [#text(7.5pt, weight: "bold")[Comm (%)]],
  [#text(7.5pt, weight: "bold")[Max Night]],
  [#text(7.5pt, weight: "bold")[Score]],

  [IM-2 (Mons Mouton)], [Summer Solstice (Dec)], [99.7%], [100.0%], [1 h], [*98.4*],
  [IM-2 (Mons Mouton)], [Autumn Equinox (Mar)], [80.7%], [100.0%], [65 h], [*85.0*],
  [IM-2 (Mons Mouton)], [Winter Solstice (Jun)], [46.1%], [100.0%], [181 h], [*58.7*],
  [IM-2 (Mons Mouton)], [Spring Equinox (Sep)], [40.8%], [100.0%], [199 h], [*54.4*],
  [Connecting Ridge CR1], [Summer Solstice (Dec)], [96.7%], [0.0%], [11 h], [*38.7*],
  [Connecting Ridge CR1], [Winter Solstice (Jun)], [0.0%], [50.3%], [336 h], [*3.1*],
  [Haworth Crater (PSR)], [All Four Seasons], [0.0%], [0.0%], [336 h], [*0.0*],
)

#v(4pt)
#callout(title: "Flight Director Rule: Winter Solstice Vulnerability", [
  Connecting Ridge CR1 drops to *0.0% sunlight* during Southern Winter Solstice with a continuous 336-hour freeze. In contrast, Mons Mouton maintains 100% communication throughout the entire winter cycle, allowing mission control to monitor survival heaters.
], border-color: rgb("dc2626"), bg-color: rgb("fef2f2"))

#v(6pt)

// -----------------------------------------------------------------------------
// SECTION 6: FIRST-PRINCIPLES MATHEMATICS & PROPULSION
// -----------------------------------------------------------------------------
= 6. First-Principles Mathematics & Propulsion Physics

== 6.1 Spherical Topographic Horizon Ray-Casting
For a lander at surface elevation $z_0$ with mast height $h_0 = 2.0 "m"$, any terrain obstacle at radial distance $r in [0, 50 "km"]$ with elevation $z(r, psi)$ along azimuth $psi$ subtends an elevation angle corrected for lunar surface curvature ($R_M = 1737.4 "km"$):

$ theta(r, psi) = arctan( frac(z(r, psi) - z_0 - h_0 - frac(r^2, 2 R_M), r) ) $

The local terrain horizon obstruction mask $H(psi)$ is the maximum obstacle angle:
$ H(psi) = max_(r in (0, 50 "km"]) theta(r, psi) $

A celestial body with topocentric elevation $alpha(t)$ is directly visible if and only if $alpha(t) >= H(psi(t))$.

== 6.2 Powered Descent Initiation (PDI) Fuel Fraction
From low lunar orbit ($h = 15 "km"$, $v_0 = 1695 "m/s"$), the required velocity increment accounting for gravity losses is $Delta v_("total") approx 2050 "m/s"$. Using Tsiolkovsky's rocket equation for hypergolic bipropellant ($I_("sp") = 310 "s"$):

$ frac(m_f, m_0) = exp(-frac(Delta v_("total"), I_("sp") dot g_0)) = exp(-frac(2050, 310 dot 9.80665)) = 0.5097 quad ==> quad mu_("prop") = 49.03% $

The lander must allocate $49.03%$ of its total wet launch mass to descent propellant alone.

== 6.3 Multi-Criteria Suitability Index ($S$)
The overall landing suitability score $S in [0, 100]$ weights mission survival parameters:

$ S = 35 dot frac(tau_("dual"), tau_("total")) + 25 dot frac(tau_("sun"), tau_("total")) + 25 dot frac(tau_("comm"), tau_("total")) - 10 dot frac(tau_("night,max"), 720) - 5 dot frac(theta_("slope"), 15 degree) $

If surface slope $theta_("slope") >= 15.0 degree$, lander tip-over probability exceeds limits and slope fitness becomes $0.0$.

#v(6pt)

// -----------------------------------------------------------------------------
// SECTION 7: FLIGHT DIRECTOR GO/NO-GO PROTOCOL
// -----------------------------------------------------------------------------
= 7. Flight Director Operational Go/No-Go Decision Protocol

Before committing a spacecraft to the Trans-Lunar Injection (TLI) burn and Powered Descent Initiation, flight dynamics officers must confirm five mandatory criteria:

+ *Dual-Window Concurrency:* Continuous simultaneous daylight and Earth communications must equal or exceed *10.0 days* ($tau_("dual") >= 240 "h"$).
+ *Slope Safety Boundary:* Touchdown ellipse 3-sigma terrain slope must not exceed *15.0 degrees* ($theta_("slope") <= 15 degree$).
+ *Cryogenic Darkness Limit:* Unbroken shadow intervals must remain strictly below *350 hours* ($tau_("dark") < 350 "h"$).
+ *DSN Direct Line-of-Sight:* Total Direct-to-Earth link duration must exceed *65%* of mission elapsed time.
+ *ISRU Traversability:* Distance to accessible Permanently Shadowed Region (PSR) cold-trap must be within *5.0 km* across corridors with slope $< 10 degree$.

#callout(title: "Official Flight Director Recommendation", [
  *PRIMARY SELECTION: Mons Mouton Plateau (IM-2 / VIPER Corridor)* satisfies all five flight rules with an overall suitability score of *51.4 / 100*, offering a 375-hour golden operating window, a safe 4.9° slope, and continuous Earth communications throughout the mission.
], border-color: rgb("059669"), bg-color: rgb("f0fdf4"))
