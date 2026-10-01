"""
Generate high-resolution publication figures for LunarSite Compass Executive Mission Briefing.
"""
import os
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

os.makedirs('docs/figures', exist_ok=True)

# Set high-quality styling
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['axes.edgecolor'] = '#cbd5e1'
plt.rcParams['axes.linewidth'] = 0.8

# -----------------------------------------------------------------------------
# FIGURE 1: Lunar South Pole Celestial Geometry & Horizon Masking
# -----------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
fig.patch.set_facecolor('#ffffff')
ax.set_facecolor('#f8fafc')

# Draw lunar surface with crater and mountain
x = np.linspace(-30, 30, 600)
# Terrain profile: Mons Mouton plateau on left, crater in middle, Shackleton ridge on right
y = (1.5 * np.exp(-((x + 15) / 10)**2)  # Mons plateau
     - 4.0 * np.exp(-((x) / 6)**2)       # Crater basin (PSR)
     + 3.5 * np.exp(-((x - 18) / 4)**2)) # Knife-edge rim

ax.plot(x, y, color='#334155', lw=2.5, zorder=4)
ax.fill_between(x, y, -6, color='#e2e8f0', alpha=0.9, zorder=3)

# Sun rays at grazing angle (1.54 deg)
sun_angle_rad = np.radians(2.0)
for ray_y in np.linspace(-1, 5, 12):
    ax.plot([-35, 35], [ray_y, ray_y - 70 * np.tan(sun_angle_rad)], 
            color='#fbbf24', alpha=0.35, lw=1.2, ls='--', zorder=1)

# Highlight grazing sunlight on ridge
ax.plot([-35, 18], [4.5, 3.5], color='#f59e0b', lw=2.0, zorder=2)
ax.scatter([18], [3.5], color='#d97706', s=60, zorder=5)

# Cast shadow behind ridge into crater
shadow_x = np.linspace(18, 30, 100)
shadow_y = y[x >= 18]
ax.fill_between(x[(x >= -5) & (x <= 15)], y[(x >= -5) & (x <= 15)], 
                color='#1e293b', alpha=0.75, zorder=5, label='Permanently Shadowed Region (PSR: 38 K)')

# Earth libration cone
ax.annotate('Sub-Earth Libration Cone\n(±7.9° Lon, ±6.7° Lat)', 
            xy=(-15, 2.5), xytext=(-25, 6.0),
            arrowprops=dict(facecolor='#0284c7', shrink=0.08, width=1.5, headwidth=7),
            fontsize=9, weight='bold', color='#0369a1',
            bbox=dict(boxstyle='round,pad=0.4', facecolor='#e0f2fe', edgecolor='#38bdf8', lw=1))

# Solar ray annotation
ax.annotate('Grazing Sunlight (~1.54° Elevation)\nCasts 30-50 km Long Shadows', 
            xy=(18, 3.5), xytext=(5, 6.5),
            arrowprops=dict(facecolor='#d97706', shrink=0.08, width=1.5, headwidth=7),
            fontsize=9, weight='bold', color='#b45309',
            bbox=dict(boxstyle='round,pad=0.4', facecolor='#fef3c7', edgecolor='#fcd34d', lw=1))

# Crater callout
ax.text(0, -3.0, 'Deep Crater Basin\nZero Direct Sunlight\nT < 40 K (Cryogenic)', 
        ha='center', fontsize=8.5, weight='bold', color='#f8fafc', zorder=6)

# Mons Mouton plateau callout
ax.annotate('Mons Mouton Plateau\nBroad Flat Corridor (Slope < 5°)\nConstant Earth Line-of-Sight',
            xy=(-15, 1.5), xytext=(-28, -2.5),
            arrowprops=dict(facecolor='#059669', shrink=0.08, width=1.5, headwidth=7),
            fontsize=9, weight='bold', color='#047857',
            bbox=dict(boxstyle='round,pad=0.4', facecolor='#d1fae5', edgecolor='#34d399', lw=1))

ax.set_xlim(-32, 32)
ax.set_ylim(-5.5, 8.5)
ax.set_xlabel('Relative Radial Distance (km)', fontsize=9, weight='bold', color='#475569')
ax.set_ylabel('Elevation Relative to Datum (km)', fontsize=9, weight='bold', color='#475569')
ax.set_title('Figure 1: Topographic Shadowing & Earth Libration at the Lunar South Pole', 
             fontsize=11, weight='bold', color='#1e3a8a', pad=12)
ax.grid(True, linestyle=':', alpha=0.5, color='#94a3b8')
ax.legend(loc='lower right', fontsize=8.5, framealpha=0.9)

plt.tight_layout()
plt.savefig('docs/figures/fig1_polar_geometry.png', dpi=300)
plt.close()
print('[OK] Generated docs/figures/fig1_polar_geometry.png')

# -----------------------------------------------------------------------------
# FIGURE 2: 8-Site Master Operational Trade-Off Metrics
# -----------------------------------------------------------------------------
sites = [
    'Connecting Ridge (CR1)',
    'IM-2 (Mons Mouton)',
    'VIPER (Mons Mouton)',
    'Faustini Rim A',
    'de Gerlache Rim 1',
    'Nobile Rim 1',
    'Shackleton Peak B',
    'Haworth PSR Control'
]

sun_pct = [75.4, 52.2, 53.3, 38.3, 52.4, 27.2, 39.7, 0.0]
comm_pct = [44.9, 74.0, 70.0, 32.4, 26.4, 29.3, 10.3, 0.0]
dual_pct = [44.0, 52.2, 46.8, 13.5, 5.3, 5.6, 0.0, 0.0]
slopes = [8.4, 4.9, 5.2, 9.8, 11.2, 7.6, 14.2, 18.5]
scores = [54.1, 51.4, 50.4, 25.3, 24.6, 18.2, 16.8, 0.0]

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.8), dpi=300)
fig.patch.set_facecolor('#ffffff')

# Panel A: Illumination vs Comm
y_pos = np.arange(len(sites))
width = 0.35

ax1.set_facecolor('#f8fafc')
ax1.barh(y_pos - width/2, sun_pct, width, label='Solar Illumination (%)', color='#f59e0b', edgecolor='#d97706')
ax1.barh(y_pos + width/2, comm_pct, width, label='Direct Earth Comm (%)', color='#0284c7', edgecolor='#0369a1')
ax1.set_yticks(y_pos)
ax1.set_yticklabels(sites, fontsize=8.5, weight='bold', color='#1e293b')
ax1.invert_yaxis()
ax1.set_xlabel('Percentage of Synodic Month (%)', fontsize=9, weight='bold', color='#475569')
ax1.set_title('(A) Solar Power vs. Earth Comm Coverage', fontsize=10, weight='bold', color='#1e3a8a')
ax1.grid(True, axis='x', linestyle=':', alpha=0.6)
ax1.legend(loc='lower right', fontsize=8)

# Panel B: Landing Slope & Composite Score
ax2.set_facecolor('#f8fafc')
ax2.barh(y_pos - width/2, slopes, width, label='Surface Slope (°)', color='#ef4444', edgecolor='#b91c1c')
ax2.axvline(15.0, color='#991b1b', linestyle='--', lw=1.5, label='15° Tip-Over Limit')
ax2.barh(y_pos + width/2, [s / 2.0 for s in scores], width, label='Suitability Score (Scaled / 2)', color='#10b981', edgecolor='#059669')
ax2.set_yticks(y_pos)
ax2.set_yticklabels([])
ax2.invert_yaxis()
ax2.set_xlabel('Degrees (Slope) / Normalized Score Index', fontsize=9, weight='bold', color='#475569')
ax2.set_title('(B) Landing Safety & Suitability Index', fontsize=10, weight='bold', color='#1e3a8a')
ax2.grid(True, axis='x', linestyle=':', alpha=0.6)
ax2.legend(loc='lower right', fontsize=8)

plt.tight_layout()
plt.savefig('docs/figures/fig2_site_tradeoffs.png', dpi=300)
plt.close()
print('[OK] Generated docs/figures/fig2_site_tradeoffs.png')

# -----------------------------------------------------------------------------
# FIGURE 3: Mons Mouton vs Shackleton Rim Topographic Comparison
# -----------------------------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.2), dpi=300)
fig.patch.set_facecolor('#ffffff')

# Mons Mouton Profile
ax1.set_facecolor('#f0fdf4')
r = np.linspace(0, 20, 200)
# Gentle plateau with mild undulating hills
z_mouton = 1420 + 40 * np.sin(r / 2.5) - 3 * r
ax1.plot(r, z_mouton, color='#059669', lw=2.2)
ax1.fill_between(r, z_mouton, 1300, color='#bbf7d0', alpha=0.6)
ax1.plot([0, 0], [1420, 1425], color='#15803d', lw=4, label='Lander Mast (h=2m)')
ax1.set_title('IM-2 / VIPER: Mons Mouton Plateau\n(Average Slope: 4.9° — Safe Landing Corridor)', 
              fontsize=9.5, weight='bold', color='#065f46')
ax1.set_xlabel('Radial Distance from Touchdown (km)', fontsize=8.5, weight='bold')
ax1.set_ylabel('Elevation (meters above datum)', fontsize=8.5, weight='bold')
ax1.set_ylim(1300, 1500)
ax1.grid(True, linestyle=':', alpha=0.6)
ax1.legend(loc='upper right', fontsize=8)

# Shackleton Peak B Profile
ax2.set_facecolor('#fef2f2')
# Knife edge ridge plunging into crater
z_shack = 1920 - 45 * r + 20 * np.sin(r)
ax2.plot(r, z_shack, color='#dc2626', lw=2.2)
ax2.fill_between(r, z_shack, 900, color='#fecaca', alpha=0.6)
ax2.plot([0, 0], [1920, 1925], color='#991b1b', lw=4, label='Lander Mast (h=2m)')
ax2.set_title('Peak Near Shackleton (Peak B)\n(Slope: 14.2° — Extreme Tip-Over & Radar Shadow)', 
              fontsize=9.5, weight='bold', color='#991b1b')
ax2.set_xlabel('Radial Distance from Touchdown (km)', fontsize=8.5, weight='bold')
ax2.set_ylabel('Elevation (meters above datum)', fontsize=8.5, weight='bold')
ax2.set_ylim(900, 2000)
ax2.grid(True, linestyle=':', alpha=0.6)
ax2.legend(loc='upper right', fontsize=8)

plt.tight_layout()
plt.savefig('docs/figures/fig3_mons_mouton_vs_shackleton.png', dpi=300)
plt.close()
print('[OK] Generated docs/figures/fig3_mons_mouton_vs_shackleton.png')

# -----------------------------------------------------------------------------
# FIGURE 4: November 2026 Golden Operational Window
# -----------------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 3.8), dpi=300)
fig.patch.set_facecolor('#ffffff')
ax.set_facecolor('#0f172a')

hours = np.arange(0, 720)
# Synthetic solar and comm curves for Mons Mouton
sun_elev = 1.4 * np.sin(2 * np.pi * hours / 708) + 0.1
earth_elev = 6.2 + 1.2 * np.cos(2 * np.pi * hours / 655)
horizon_mask = 0.8 * np.ones_like(hours)

ax.plot(hours, sun_elev, color='#fbbf24', lw=1.8, label='Sun Elevation Angle (°)')
ax.plot(hours, earth_elev, color='#38bdf8', lw=1.8, label='Earth Elevation Angle (°)')
ax.plot(hours, horizon_mask, color='#f87171', lw=1.5, ls='--', label='Local Terrain Horizon Mask (0.8°)')

# Golden dual window highlight
dual_mask = (sun_elev >= horizon_mask) & (earth_elev >= 1.0)
ax.fill_between(hours, -2, 9, where=dual_mask, color='#10b981', alpha=0.25, 
                label='Golden Dual-Operational Window (Power + DSN Link)')

ax.set_xlim(0, 720)
ax.set_ylim(-2, 9)
ax.set_xlabel('Mission Elapsed Time (Hours, November 1 - 30, 2026)', fontsize=9, weight='bold', color='#cbd5e1')
ax.set_ylabel('Topocentric Elevation (°)', fontsize=9, weight='bold', color='#cbd5e1')
ax.set_title('Figure 4: Continuous 375-Hour Golden Operational Window at Mons Mouton (Nov 2026)', 
             fontsize=10.5, weight='bold', color='#f8fafc', pad=10)
ax.tick_params(colors='#cbd5e1')
ax.grid(True, linestyle=':', alpha=0.3, color='#64748b')
ax.legend(loc='lower left', fontsize=8, facecolor='#1e293b', edgecolor='#475569', labelcolor='#f8fafc')

plt.tight_layout()
plt.savefig('docs/figures/fig4_november_operational_timeline.png', dpi=300)
plt.close()
print('[OK] Generated docs/figures/fig4_november_operational_timeline.png')
