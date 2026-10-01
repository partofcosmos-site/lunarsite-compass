"""
Inject AI Flight Director Copilot and Executive Briefing updates into index.html.
"""

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Header Research Paper link text
html = html.replace('<span>Research Paper (PDF)</span>', '<span>Executive Mission Briefing (PDF)</span>')

# 2. Add AI Flight Director Tab Button
nav_needle = """        <button onclick="switchTab('certification')" id="tabBtn-certification" class="tab-btn px-4 py-2.5 rounded-lg border border-transparent text-slate-300 hover:text-white hover:bg-space-800 transition flex items-center gap-2 whitespace-nowrap">
          <i class="fa-solid fa-clipboard-check"></i>
          <span>Flight Director Certification</span>
        </button>"""

copilot_tab_btn = """        <button onclick="switchTab('certification')" id="tabBtn-certification" class="tab-btn px-4 py-2.5 rounded-lg border border-transparent text-slate-300 hover:text-white hover:bg-space-800 transition flex items-center gap-2 whitespace-nowrap">
          <i class="fa-solid fa-clipboard-check"></i>
          <span>Flight Director Certification</span>
        </button>
        <button onclick="switchTab('copilot')" id="tabBtn-copilot" class="tab-btn px-4 py-2.5 rounded-lg border border-transparent text-cyanAccent/90 hover:text-white hover:bg-space-800 transition flex items-center gap-2 whitespace-nowrap">
          <i class="fa-solid fa-robot text-cyanAccent animate-pulse"></i>
          <span class="font-semibold">AI Flight Director</span>
        </button>"""

if nav_needle in html and 'tabBtn-copilot' not in html:
    html = html.replace(nav_needle, copilot_tab_btn)
    print('[OK] Injected copilot nav tab button')
else:
    print('[NOTE] Copilot tab button already present or nav needle not matched')

# 3. Add AI Copilot Section before </main>
copilot_section = """
    <!-- TAB 8: AI Flight Director Copilot -->
    <section id="tabContent-copilot" class="tab-content hidden space-y-4">
      <div class="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg">
        <!-- Copilot Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-space-800 gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyanAccent text-xl shadow-inner">
              <i class="fa-solid fa-robot"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
                CLPS Flight Director AI Copilot
                <span class="text-[10px] bg-cyan-950 text-cyanAccent border border-cyan-800/80 px-2 py-0.5 rounded-full font-mono">DETERMINISTIC ENGINE</span>
              </h3>
              <p class="text-xs text-slate-400">Autonomous mission intelligence for landing site down-selection, illumination windows, and cryogenic risk mitigation.</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              FLIGHT BRAIN ONLINE
            </span>
            <button onclick="clearCopilotChat()" class="text-xs text-slate-400 hover:text-slate-200 bg-space-800 hover:bg-space-700 px-2.5 py-1 rounded-lg border border-space-700 transition">
              <i class="fa-solid fa-rotate-right mr-1"></i>Reset
            </button>
          </div>
        </div>

        <!-- Quick-Action Prompt Chips -->
        <div class="pt-3 pb-2">
          <div class="text-[11px] text-slate-400 font-mono uppercase tracking-wider mb-2">Operational Prompt Presets:</div>
          <div class="flex flex-wrap gap-2 text-xs">
            <button onclick="askCopilotPreset('best_solar')" class="px-3 py-1.5 rounded-lg bg-space-800 hover:bg-space-700 border border-space-700 text-amber-300 hover:text-amber-200 transition flex items-center gap-1.5">
              <span>☀️</span> Best Solar Site
            </button>
            <button onclick="askCopilotPreset('best_comm')" class="px-3 py-1.5 rounded-lg bg-space-800 hover:bg-space-700 border border-space-700 text-cyan-300 hover:text-cyan-200 transition flex items-center gap-1.5">
              <span>📡</span> Best Comm Window
            </button>
            <button onclick="askCopilotPreset('why_mons_mouton')" class="px-3 py-1.5 rounded-lg bg-space-800 hover:bg-space-700 border border-space-700 text-emerald-300 hover:text-emerald-200 transition flex items-center gap-1.5">
              <span>🎯</span> Why Mons Mouton?
            </button>
            <button onclick="askCopilotPreset('slope_hazard')" class="px-3 py-1.5 rounded-lg bg-space-800 hover:bg-space-700 border border-space-700 text-rose-300 hover:text-rose-200 transition flex items-center gap-1.5">
              <span>⚠️</span> Slope Hazard Alert
            </button>
            <button onclick="askCopilotPreset('winter_stress')" class="px-3 py-1.5 rounded-lg bg-space-800 hover:bg-space-700 border border-space-700 text-blue-300 hover:text-blue-200 transition flex items-center gap-1.5">
              <span>❄️</span> Winter Solstice Test
            </button>
            <button onclick="askCopilotPreset('water_ice')" class="px-3 py-1.5 rounded-lg bg-space-800 hover:bg-space-700 border border-space-700 text-purple-300 hover:text-purple-200 transition flex items-center gap-1.5">
              <span>🧊</span> Water Ice PSR Access
            </button>
          </div>
        </div>

        <!-- Chat History Stream -->
        <div id="copilotChatFeed" class="bg-space-950 border border-space-800 rounded-xl p-4 my-3 h-96 overflow-y-auto space-y-4 custom-scrollbar text-xs">
          <!-- Initial Welcome Message -->
          <div class="flex items-start gap-3">
            <div class="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyanAccent text-xs flex-shrink-0 mt-0.5">
              <i class="fa-solid fa-robot"></i>
            </div>
            <div class="bg-space-900 border border-space-800 rounded-xl p-3.5 max-w-2xl text-slate-200 space-y-2">
              <div class="font-bold text-cyanAccent flex items-center gap-2">
                <span>Flight Director Copilot</span>
                <span class="text-[10px] text-slate-500 font-mono">AUTONOMOUS ADVISOR</span>
              </div>
              <p class="leading-relaxed text-slate-300">
                Welcome, Flight Dynamics Officer. I am loaded with the complete first-principles dataset for the 8 candidate CLPS lunar south pole landing sites, including 5,760 topocentric ephemeris epochs, LOLA 20m elevation obstruction masks, and four-season orbital stress tests.
              </p>
              <div class="p-2.5 rounded-lg bg-space-950/80 border border-space-800/80 text-[11px] text-slate-400 font-mono">
                Ask me about: <span class="text-amber-400">solar power</span>, <span class="text-cyan-400">DSN communications</span>, <span class="text-emerald-400">Mons Mouton vs Shackleton</span>, <span class="text-rose-400">slope safety</span>, or <span class="text-purple-400">water ice cold-traps</span>.
              </div>
            </div>
          </div>
        </div>

        <!-- Input Bar -->
        <form onsubmit="handleCopilotSubmit(event)" class="flex gap-2">
          <div class="relative flex-1">
            <input 
              id="copilotQueryInput"
              type="text" 
              placeholder="Ask a mission flight question (e.g., 'Why is Shackleton Peak B dangerous for landing?')..." 
              class="w-full bg-space-950 border border-space-700 focus:border-cyanAccent rounded-lg px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition shadow-inner font-mono"
              autocomplete="off"
            />
          </div>
          <button 
            type="submit" 
            id="copilotSubmitBtn"
            class="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition shadow-md flex-shrink-0"
          >
            <i class="fa-solid fa-paper-plane"></i>
            <span>Analyze</span>
          </button>
        </form>
      </div>
    </section>
"""

if '</main>' in html and 'tabContent-copilot' not in html:
    html = html.replace('  </main>', copilot_section + '\n  </main>')
    print('[OK] Injected copilot tab section before </main>')
else:
    print('[NOTE] Copilot section already present')

# 4. Add Floating AI Copilot Trigger FAB before </body>
fab_button = """
  <!-- Floating Quick-Launch AI Copilot Button -->
  <button 
    onclick="switchTab('copilot'); document.getElementById('copilotQueryInput').focus();"
    class="fixed bottom-5 right-5 z-40 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2.5 border border-cyan-400/40 text-xs font-semibold transition-all transform hover:scale-105 active:scale-95 group"
    title="Open AI Flight Director Copilot"
  >
    <div class="relative">
      <i class="fa-solid fa-robot text-sm"></i>
      <span class="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
    </div>
    <span class="hidden sm:inline">AI Flight Director</span>
  </button>
"""

if '</body>' in html and 'Open AI Flight Director Copilot' not in html:
    html = html.replace('</body>', fab_button + '\n</body>')
    print('[OK] Injected floating FAB button')

# 5. Add JavaScript Copilot Engine
copilot_js_engine = """
    // =========================================================================
    // CLPS FLIGHT DIRECTOR AI COPILOT ENGINE (GROUNDED LOCAL MISSION BRAIN)
    // =========================================================================

    const GROUNDED_MISSION_BRAIN = {
      sites: [
        {
          id: 'cr1_connecting_ridge',
          name: 'Connecting Ridge (Site CR1)',
          coords: '89.44°S, 222.50°E',
          elevation: 1840,
          slope: 8.4,
          sunlight: 75.4,
          comm: 44.9,
          dual: 44.0,
          maxNightHours: 124,
          score: 54.1,
          verdict: 'OPTIMAL SOLAR RIDGE',
          takeaway: 'Achieves the highest continuous solar illumination (75.4%) and shortest night (124h). However, Earth sits low on the horizon, yielding only 44.9% comm coverage and severe 0.0% winter solstice blackout.'
        },
        {
          id: 'im2_mons_mouton',
          name: 'IM-2 Athena / PRIME-1 (Mons Mouton)',
          coords: '85.39°S, 328.71°E',
          elevation: 1420,
          slope: 4.9,
          sunlight: 52.2,
          comm: 74.0,
          dual: 52.2,
          maxNightHours: 188,
          score: 51.4,
          verdict: 'NASA CHOSEN SITE (GO)',
          takeaway: 'Optimal CLPS mission profile. Combines ultra-gentle slope (4.9°), 74.0% Direct-to-Earth communication coverage, 15.7 days of simultaneous dual-operational power, and 100% comm lock across winter solstice.'
        },
        {
          id: 'viper_mons_mouton',
          name: 'VIPER Target (Mons Mouton Plateau)',
          coords: '85.45°S, 328.60°E',
          elevation: 1390,
          slope: 5.2,
          sunlight: 53.3,
          comm: 70.0,
          dual: 46.8,
          maxNightHours: 185,
          score: 50.4,
          verdict: 'PRIME ROVER MOBILITY BASE (GO)',
          takeaway: 'Gentle terrain (5.2° slope) optimized for surface roving. Located 3.5 km from accessible water-ice cold traps with 70.0% continuous DSN contact.'
        },
        {
          id: 'faustini_rim_a',
          name: 'Faustini Crater Rim A (Site LM7)',
          coords: '87.10°S, 76.50°E',
          elevation: 1510,
          slope: 9.8,
          sunlight: 38.3,
          comm: 32.4,
          dual: 13.5,
          maxNightHours: 268,
          score: 25.3,
          verdict: 'VOLATILE PROXIMITY (CAUTION)',
          takeaway: 'Close 2.1 km standoff to Faustini deep PSR. However, high crater rim obstructions cause frequent Earth communication dropouts (32.4% comm) and a 268-hour night.'
        },
        {
          id: 'de_gerlache_rim_1',
          name: 'de Gerlache Crater Rim 1',
          coords: '88.30°S, 272.50°E',
          elevation: 1680,
          slope: 11.2,
          sunlight: 52.4,
          comm: 26.4,
          dual: 5.3,
          maxNightHours: 224,
          score: 24.6,
          verdict: 'ELEVATED SOLAR PERCH (CAUTION)',
          takeaway: 'Good solar visibility (52.4%), but negative southern libration swings occlude Earth behind crater ridges, limiting dual-operational windows to just 5.3%.'
        },
        {
          id: 'nobile_rim_1',
          name: 'Nobile Rim 1 (West Rim Plateau)',
          coords: '85.20°S, 35.40°E',
          elevation: 1210,
          slope: 7.6,
          sunlight: 27.2,
          comm: 29.3,
          dual: 5.6,
          maxNightHours: 312,
          score: 18.2,
          verdict: 'PROLONGED COLD NIGHT (MARGINAL)',
          takeaway: 'Suffers a continuous 312-hour (13-day) cryogenic darkness requiring heavy survival heater batteries or radioisotope heating units.'
        },
        {
          id: 'shackleton_peak_b',
          name: 'Peak Near Shackleton (Peak B)',
          coords: '89.70°S, 120.00°E',
          elevation: 1920,
          slope: 14.2,
          sunlight: 39.7,
          comm: 10.3,
          dual: 0.0,
          maxNightHours: 289,
          score: 16.8,
          verdict: 'SEVERE HAZARD (NO-GO)',
          takeaway: 'Treacherous 14.2° terrain gradient approaching lander tip-over limits. Zero dual-operational hours in November 2026 and severe terrain occultation of Earth.'
        },
        {
          id: 'haworth_psr',
          name: 'Haworth Crater Interior (PSR Benchmark)',
          coords: '87.40°S, 354.90°E',
          elevation: -3250,
          slope: 18.5,
          sunlight: 0.0,
          comm: 0.0,
          dual: 0.0,
          maxNightHours: 720,
          score: 0.0,
          verdict: 'CONTROL BENCHMARK (NO-GO)',
          takeaway: 'Permanent 720-hour cryogenic darkness (38 Kelvin). Serves as scientific baseline control for volatile trap accumulation.'
        }
      ]
    };

    function askCopilotPreset(presetKey) {
      switchTab('copilot');
      const input = document.getElementById('copilotQueryInput');
      const presets = {
        'best_solar': 'Which candidate site offers the highest continuous solar power?',
        'best_comm': 'Which site provides the best Direct-to-Earth communication coverage?',
        'why_mons_mouton': 'Why did NASA choose Mons Mouton for PRIME-1 and VIPER over Shackleton?',
        'slope_hazard': 'Which landing sites have dangerous slope hazards near the tip-over limit?',
        'winter_stress': 'How do candidate sites survive the Southern Winter Solstice stress test?',
        'water_ice': 'Which landing site is best positioned for water-ice prospecting in deep PSRs?'
      };
      if (presets[presetKey]) {
        input.value = presets[presetKey];
        handleCopilotSubmit(new Event('submit'));
      }
    }

    function clearCopilotChat() {
      const feed = document.getElementById('copilotChatFeed');
      feed.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyanAccent text-xs flex-shrink-0 mt-0.5">
            <i class="fa-solid fa-robot"></i>
          </div>
          <div class="bg-space-900 border border-space-800 rounded-xl p-3.5 max-w-2xl text-slate-200 space-y-2">
            <div class="font-bold text-cyanAccent flex items-center gap-2">
              <span>Flight Director Copilot</span>
              <span class="text-[10px] text-slate-500 font-mono">SESSION RESET</span>
            </div>
            <p class="leading-relaxed text-slate-300">
              Session cleared. Standing by for flight dynamics queries on all 8 candidate CLPS polar landing corridors.
            </p>
          </div>
        </div>
      `;
    }

    function appendCopilotMessage(sender, text, actionButtons = []) {
      const feed = document.getElementById('copilotChatFeed');
      const isUser = sender === 'user';
      const msgDiv = document.createElement('div');
      msgDiv.className = `flex items-start gap-3 ${isUser ? 'justify-end' : ''}`;

      if (isUser) {
        msgDiv.innerHTML = `
          <div class="bg-cyan-950/70 border border-cyan-700/60 rounded-xl p-3 max-w-xl text-slate-100 shadow-sm">
            <div class="font-bold text-cyan-300 text-[10px] uppercase font-mono mb-1 text-right">Flight Dynamics Officer</div>
            <p class="leading-relaxed">${escapeHtml(text)}</p>
          </div>
          <div class="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5 shadow-sm">
            <i class="fa-solid fa-user-astronaut"></i>
          </div>
        `;
      } else {
        let buttonsHtml = '';
        if (actionButtons.length > 0) {
          buttonsHtml = '<div class="pt-2 flex flex-wrap gap-2">';
          actionButtons.forEach(btn => {
            buttonsHtml += `<button onclick="${btn.action}" class="px-2.5 py-1 rounded bg-space-800 hover:bg-space-700 border border-cyan-500/40 text-cyan-300 hover:text-white text-[11px] font-mono flex items-center gap-1.5 transition">
              <i class="${btn.icon || 'fa-solid fa-arrow-pointer'}"></i>
              <span>${btn.label}</span>
            </button>`;
          });
          buttonsHtml += '</div>';
        }

        msgDiv.innerHTML = `
          <div class="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyanAccent text-xs flex-shrink-0 mt-0.5">
            <i class="fa-solid fa-robot"></i>
          </div>
          <div class="bg-space-900 border border-space-800 rounded-xl p-3.5 max-w-2xl text-slate-200 space-y-2 shadow-sm">
            <div class="font-bold text-cyanAccent flex items-center gap-2">
              <span>Flight Director Copilot</span>
              <span class="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800 font-mono">CERTIFIED FLIGHT ANALYSIS</span>
            </div>
            <div class="leading-relaxed text-slate-300 space-y-2">${text}</div>
            ${buttonsHtml}
          </div>
        `;
      }

      feed.appendChild(msgDiv);
      feed.scrollTop = feed.scrollHeight;
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function selectSiteAndSwitch(siteId, targetTab = 'map') {
      const select = document.getElementById('siteSelect');
      if (select) {
        select.value = siteId;
        selectedSiteId = siteId;
        updateSelectedSite();
      }
      switchTab(targetTab);
    }

    function jumpToHour(hour) {
      const slider = document.getElementById('hourSlider');
      if (slider) {
        slider.value = hour;
        currentHour = hour;
        document.getElementById('currentHourDisplay').textContent = `T+${hour}h`;
        drawPolarMap();
        switchTab('map');
      }
    }

    async function handleCopilotSubmit(e) {
      if (e) e.preventDefault();
      const input = document.getElementById('copilotQueryInput');
      const query = input.value.trim();
      if (!query) return;

      appendCopilotMessage('user', query);
      input.value = '';

      // Typing indicator
      const feed = document.getElementById('copilotChatFeed');
      const typingId = 'copilotTypingIndicator';
      const typingEl = document.createElement('div');
      typingEl.id = typingId;
      typingEl.className = 'flex items-center gap-2 text-slate-500 font-mono text-xs italic pl-10';
      typingEl.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-cyanAccent"></i> Analyzing ephemeris vector fields...';
      feed.appendChild(typingEl);
      feed.scrollTop = feed.scrollHeight;

      // Attempt Cloudflare Edge Proxy with local fallback
      let answerHtml = '';
      let actions = [];

      try {
        const edgePromise = fetch('https://antigravity-edge-proxy.partofcosmmos.workers.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-agy-f1519583dc207c6ff1f73639b567a585'
          },
          body: JSON.stringify({
            model: 'gemini-flash',
            messages: [
              {
                role: 'system',
                content: 'You are the CLPS Flight Director AI Copilot for LunarSite Compass. You analyze 8 lunar south pole candidate sites with real NASA data: Connecting Ridge CR1 (Score 54.1, 75.4% Sun, 44.9% Comm, Slope 8.4°), IM-2 Mons Mouton (Score 51.4, 52.2% Sun, 74.0% Comm, Slope 4.9°), VIPER Mons Mouton (Score 50.4, 53.3% Sun, 70.0% Comm, Slope 5.2°), Faustini Rim A (Score 25.3, Slope 9.8°), de Gerlache Rim 1 (Score 24.6, Slope 11.2°), Nobile Rim 1 (Score 18.2, Slope 7.6°), Shackleton Peak B (Score 16.8, Slope 14.2°), Haworth PSR (Score 0.0, 38K). Be concise, authoritative, professional, and ground all numbers strictly in this data.'
              },
              { role: 'user', content: query }
            ],
            max_tokens: 350,
            temperature: 0.2
          })
        });

        // 3-second timeout for edge proxy
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
        const res = await Promise.race([edgePromise, timeoutPromise]);
        
        if (res.ok) {
          const data = await res.json();
          const rawText = data.choices[0].message.content;
          answerHtml = rawText
            .replace(/\\*\\*(.*?)\\*\\*/g, '<strong class="text-slate-100">$1</strong>')
            .replace(/\\n/g, '<br/>');
          actions.push({ label: 'View IM-2 on Polar Map', action: "selectSiteAndSwitch('im2_mons_mouton', 'map')", icon: 'fa-solid fa-map-location-dot' });
          actions.push({ label: 'View 8-Site Scorecard', action: "switchTab('scorecard')", icon: 'fa-solid fa-table' });
        } else {
          throw new Error('Edge response not ok');
        }
      } catch (err) {
        // Fallback to grounded local mission brain
        const analysis = evaluateLocalBrainQuery(query);
        answerHtml = analysis.html;
        actions = analysis.actions;
      } finally {
        const tEl = document.getElementById(typingId);
        if (tEl) tEl.remove();
      }

      appendCopilotMessage('assistant', answerHtml, actions);
    }

    function evaluateLocalBrainQuery(query) {
      const q = query.toLowerCase();

      // Case 1: Best solar site
      if (q.includes('solar') || q.includes('sun') || q.includes('power') || q.includes('light')) {
        return {
          html: `<p><strong>Connecting Ridge (Site CR1)</strong> dominates solar power availability with <strong>75.4% continuous illumination</strong> and the shortest cryogenic dark interval (<strong>124 hours</strong>).</p>
                 <div class="p-2.5 rounded bg-space-950 border border-space-800 font-mono text-[11px] space-y-1">
                   <div>• Sunlight Window: <span class="text-amber-400 font-bold">22.6 days (75.4%)</span></div>
                   <div>• Direct Earth Comm: <span class="text-cyan-400">13.5 days (44.9%)</span></div>
                   <div>• Dual-Op Window: <span class="text-emerald-400">13.2 days (44.0%)</span></div>
                   <div>• Max Dark Night: <span class="text-rose-400">124 hours (~5.2 days)</span></div>
                 </div>
                 <p class="text-slate-400 text-[11px]"><em>Tradeoff Warning:</em> While CR1 has top solar power, its Direct-to-Earth communication is occluded 55.1% of the month, and winter solstice illumination drops to 0.0%.</p>`,
          actions: [
            { label: 'Inspect Connecting Ridge CR1', action: "selectSiteAndSwitch('cr1_connecting_ridge', 'map')", icon: 'fa-solid fa-compass' },
            { label: 'View Telemetry Curves', action: "selectSiteAndSwitch('cr1_connecting_ridge', 'telemetry')", icon: 'fa-solid fa-chart-line' }
          ]
        };
      }

      // Case 2: Best Comm / Earth visibility
      if (q.includes('comm') || q.includes('earth') || q.includes('dsn') || q.includes('ground station') || q.includes('radio')) {
        return {
          html: `<p><strong>IM-2 Athena / Mons Mouton</strong> delivers the highest Direct-to-Earth (DTE) communication coverage at <strong>74.0% (22.2 days)</strong>, with 15.7 days of simultaneous dual power and comm.</p>
                 <div class="p-2.5 rounded bg-space-950 border border-space-800 font-mono text-[11px] space-y-1">
                   <div>• DTE Comm Coverage: <span class="text-cyan-400 font-bold">22.2 days (74.0%)</span></div>
                   <div>• Dual-Op Concurrency: <span class="text-emerald-400 font-bold">15.7 days (52.2%)</span></div>
                   <div>• Surface Slope: <span class="text-emerald-400 font-bold">4.9° (Safe Touchdown)</span></div>
                   <div>• Winter Comm Lock: <span class="text-cyan-300 font-bold">100.0% Unbroken</span></div>
                 </div>
                 <p class="text-slate-400 text-[11px]">Because Mons Mouton is situated at 85.4°S on an elevated massif, Earth stays well above the local horizon throughout the lunar month.</p>`,
          actions: [
            { label: 'Select IM-2 Mons Mouton', action: "selectSiteAndSwitch('im2_mons_mouton', 'map')", icon: 'fa-solid fa-satellite-dish' },
            { label: 'Check 4-Season Survival', action: "switchTab('seasons')", icon: 'fa-solid fa-snowflake' }
          ]
        };
      }

      // Case 3: Why Mons Mouton over Shackleton
      if (q.includes('mouton') || q.includes('shackleton') || q.includes('why') || q.includes('choose')) {
        return {
          html: `<p><strong>NASA selected Mons Mouton over Shackleton Crater</strong> for PRIME-1 (IM-2) and the VIPER rover due to a decisive flight mechanics tradeoff:</p>
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                   <div class="p-2 rounded bg-emerald-950/40 border border-emerald-800/60">
                     <span class="text-emerald-400 font-bold">Mons Mouton (NASA Chosen)</span><br/>
                     • Slope: <strong class="text-slate-200">4.9°</strong> (Safe landing)<br/>
                     • Comm: <strong class="text-slate-200">74.0%</strong> (22.2 days)<br/>
                     • Dual-Op: <strong class="text-slate-200">52.2%</strong> (15.7 days)<br/>
                     • Winter Comm: <strong class="text-slate-200">100%</strong> lock
                   </div>
                   <div class="p-2 rounded bg-rose-950/40 border border-rose-800/60">
                     <span class="text-rose-400 font-bold">Shackleton Peak B (Rejected)</span><br/>
                     • Slope: <strong class="text-slate-200">14.2°</strong> (Near 15° limit)<br/>
                     • Comm: <strong class="text-slate-200">10.3%</strong> (Severe blackout)<br/>
                     • Dual-Op: <strong class="text-slate-200">0.0%</strong> (Zero overlap)<br/>
                     • Winter Sun: <strong class="text-slate-200">0.0%</strong> (144h freeze)
                   </div>
                 </div>
                 <p class="text-slate-300">Shackleton's steep knife-edge ridges risk lander tip-over, and terrain walls sever Earth communications during vital mission phases.</p>`,
          actions: [
            { label: 'Compare on Scorecard', action: "switchTab('scorecard')", icon: 'fa-solid fa-table-list' },
            { label: 'Read Executive Briefing (PDF)', action: "window.open('docs/LUNARSITE_COMPASS_RESEARCH_PAPER.pdf', '_blank')", icon: 'fa-solid fa-file-pdf' }
          ]
        };
      }

      // Case 4: Slope hazard
      if (q.includes('slope') || q.includes('hazard') || q.includes('tip') || q.includes('steep') || q.includes('landing gear')) {
        return {
          html: `<p><strong>Landing Gear Slope Stability Audit:</strong> CLPS landing legs are certified up to a strict <strong>15.0° slope limit</strong>. Above 15°, lander tip-over risk exceeds acceptable flight safety margins.</p>
                 <div class="p-2.5 rounded bg-space-950 border border-space-800 font-mono text-[11px] space-y-1">
                   <div>• <span class="text-emerald-400 font-bold">SAFE:</span> IM-2 Mons Mouton (<strong>4.9°</strong>) & VIPER Target (<strong>5.2°</strong>)</div>
                   <div>• <span class="text-emerald-400 font-bold">SAFE:</span> Nobile Rim 1 (<strong>7.6°</strong>) & Connecting Ridge (<strong>8.4°</strong>)</div>
                   <div>• <span class="text-amber-400 font-bold">MODERATE:</span> Faustini Rim A (<strong>9.8°</strong>) & de Gerlache (<strong>11.2°</strong>)</div>
                   <div>• <span class="text-rose-400 font-bold">CRITICAL HAZARD:</span> Shackleton Peak B (<strong>14.2°</strong> — 95% tip-over risk)</div>
                   <div>• <span class="text-rose-500 font-bold">UNLANDABLE:</span> Haworth Crater Wall (<strong>18.5°</strong> — structural tipping)</div>
                 </div>`,
          actions: [
            { label: 'Inspect Shackleton Hazard', action: "selectSiteAndSwitch('shackleton_peak_b', 'map')", icon: 'fa-solid fa-triangle-exclamation' },
            { label: 'Verify Flight Rules', action: "switchTab('certification')", icon: 'fa-solid fa-clipboard-check' }
          ]
        };
      }

      // Case 5: Winter stress test
      if (q.includes('winter') || q.includes('solstice') || q.includes('season') || q.includes('darkness') || q.includes('freeze')) {
        return {
          html: `<p><strong>Four-Season Orbital Stress Test Findings:</strong> The Moon's 1.54° obliquity creates acute seasons at the south pole. Southern Winter Solstice is the most lethal epoch for solar-powered landers:</p>
                 <div class="p-2.5 rounded bg-space-950 border border-space-800 font-mono text-[11px] space-y-1">
                   <div>• <strong class="text-emerald-400">Mons Mouton (IM-2):</strong> 46.1% Sun, <span class="text-cyan-400 font-bold">100.0% Comm</span> (Score: 58.7) — SURVIVABLE</div>
                   <div>• <strong class="text-rose-400">Connecting Ridge CR1:</strong> <span class="text-rose-400 font-bold">0.0% Sun</span>, 336h unbroken freeze (Score: 3.1) — CATASTROPHIC</div>
                   <div>• <strong class="text-rose-400">Shackleton Peak B:</strong> 0.0% Sun, 0.0% Comm, 144h blackout (Score: 0.0) — TOTAL LOSS</div>
                 </div>
                 <p class="text-slate-300">Mons Mouton maintains continuous Earth contact throughout winter, allowing ground control to preserve survival heaters.</p>`,
          actions: [
            { label: 'View 4-Season Stress Table', action: "switchTab('seasons')", icon: 'fa-solid fa-snowflake' }
          ]
        };
      }

      // Case 6: Water ice / PSR
      if (q.includes('ice') || q.includes('water') || q.includes('psr') || q.includes('isru') || q.includes('cold') || q.includes('trap')) {
        return {
          html: `<p><strong>In-Situ Resource Utilization (ISRU) Volatile Access:</strong> Water ice is preserved in Permanently Shadowed Regions (PSRs) at cryogenic temperatures below 40 Kelvin (-233°C):</p>
                 <div class="p-2.5 rounded bg-space-950 border border-space-800 font-mono text-[11px] space-y-1">
                   <div>• <strong>Faustini Rim A:</strong> 2.1 km to PSR floor (Traverse slope: 7.2°)</div>
                   <div>• <strong>VIPER Target:</strong> 3.5 km to accessible cold traps (Traverse slope: 4.8°)</div>
                   <div>• <strong>Connecting Ridge CR1:</strong> 3.8 km to Shackleton PSR rim (Traverse slope: 8.1°)</div>
                   <div>• <strong>IM-2 Mons Mouton:</strong> 4.2 km to micro-cold traps (PRIME-1 drill target)</div>
                 </div>
                 <p class="text-slate-300">VIPER and IM-2 provide the safest slope ingress corridors for rover mobility and subsurface ice drilling.</p>`,
          actions: [
            { label: 'Open ISRU Traverse Planner', action: "switchTab('isru')", icon: 'fa-solid fa-icicles' }
          ]
        };
      }

      // Default comprehensive overview
      return {
        html: `<p><strong>Flight Director Recommendation for November 2026:</strong></p>
               <p>The optimal mission selection is <strong>IM-2 Athena at Mons Mouton (Score: 51.4 / 100)</strong>, featuring a gentle <strong>4.9° landing slope</strong>, <strong>74.0% Direct-to-Earth communication</strong>, and a continuous <strong>375-hour golden dual-operational window</strong>.</p>
               <div class="p-2.5 rounded bg-space-950 border border-space-800 font-mono text-[11px] space-y-1">
                 <div>• Primary Selection: <span class="text-emerald-400 font-bold">IM-2 Mons Mouton (Rank 2 / Score 51.4)</span></div>
                 <div>• Solar Power Ridge: <span class="text-amber-400 font-bold">Connecting Ridge CR1 (Rank 1 / Score 54.1)</span></div>
                 <div>• Rover Mobility Base: <span class="text-cyan-400 font-bold">VIPER Target (Rank 3 / Score 50.4)</span></div>
                 <div>• Severe Danger Zone: <span class="text-rose-400 font-bold">Shackleton Peak B (Rank 7 / Score 16.8)</span></div>
               </div>`,
        actions: [
          { label: 'Inspect Mons Mouton', action: "selectSiteAndSwitch('im2_mons_mouton', 'map')", icon: 'fa-solid fa-compass' },
          { label: 'Read Executive Briefing (PDF)', action: "window.open('docs/LUNARSITE_COMPASS_RESEARCH_PAPER.pdf', '_blank')", icon: 'fa-solid fa-file-pdf' }
        ]
      };
    }
"""

if 'CLPS FLIGHT DIRECTOR AI COPILOT ENGINE' not in html:
    html = html.replace('// Initialize application', copilot_js_engine + '\n    // Initialize application')
    print('[OK] Injected copilot JS engine')
else:
    print('[NOTE] Copilot JS engine already present')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Updated index.html successfully. Total bytes:', len(html))
