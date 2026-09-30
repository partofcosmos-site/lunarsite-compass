"""
LunarSite Compass — Interactive CLPS Mission Planner & Temporal Window Browser
NASA Space Apps Challenge 2026 | Challenge Track: "CLPS Lunar Mission Browser"
"""

import os
import json
import pandas as pd
import numpy as np
import streamlit as st
import plotly.graph_objects as go
from datetime import datetime, timezone
from engine.polar_map import create_polar_geospatial_figure, polar_to_xy

st.set_page_config(
    page_title="LunarSite Compass | CLPS Mission Browser",
    page_icon="🌕",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for dark aerospace UI theme
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 800;
        color: #E2E8F0;
        letter-spacing: -0.02em;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #94A3B8;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background: #1E293B;
        border-radius: 8px;
        padding: 1rem;
        border-left: 4px solid #38BDF8;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .metric-val {
        font-size: 1.6rem;
        font-weight: 700;
        color: #F8FAFC;
    }
    .metric-label {
        font-size: 0.85rem;
        color: #94A3B8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
</style>
""", unsafe_allow_html=True)

# Cache data loading
@st.cache_data
def load_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    summary_path = os.path.join(base_dir, "data", "mission_summary_matrix.json")
    telemetry_path = os.path.join(base_dir, "data", "mission_telemetry_2026.csv")
    seasonal_path = os.path.join(base_dir, "data", "seasonal_benchmark_analysis.json")
    
    with open(summary_path, "r", encoding="utf-8") as f:
        summaries = json.load(f)
    
    df_telemetry = pd.read_csv(telemetry_path)
    df_telemetry["datetime"] = pd.to_datetime(df_telemetry["datetime"])
    
    seasonal_data = []
    if os.path.exists(seasonal_path):
        with open(seasonal_path, "r", encoding="utf-8") as f:
            seasonal_data = json.load(f)
            
    return summaries, df_telemetry, seasonal_data

def main():
    st.markdown('<div class="main-header">🌕 LunarSite Compass</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Temporal Illumination & Earth-Communication Window Browser for CLPS South Pole Landers</div>', unsafe_allow_html=True)

    try:
        summaries, df_telemetry, seasonal_data = load_data()
    except Exception as e:
        st.error(f"Please run scripts/generate_mission_data.py first to pre-compute telemetry: {e}")
        return

    # Sidebar: Site Selection & Mission Constraints
    st.sidebar.header("🎯 Mission Parameters")
    
    site_names = [s["site_name"] for s in summaries]
    selected_name = st.sidebar.selectbox("Select Candidate Landing Site", site_names, index=2)
    
    selected_site = next(s for s in summaries if s["site_name"] == selected_name)
    site_id = selected_site["site_id"]
    
    st.sidebar.markdown("---")
    st.sidebar.markdown(f"**Target Site ID:** `{site_id}`")
    st.sidebar.markdown(f"**Coordinates:** `{selected_site['latitude']}° S, {selected_site['longitude']}° E`")
    st.sidebar.markdown(f"**Elevation:** `{selected_site['elevation_m']} m`")
    st.sidebar.markdown(f"**Slope:** `{selected_site['slope_deg']}°` {'✅ Safe (<15°)' if selected_site['slope_deg'] < 15 else '⚠️ Steep'}")
    st.sidebar.markdown(f"**Mission Context:** _{selected_site['mission_context']}_")
    
    st.sidebar.markdown("---")
    st.sidebar.markdown("### 📡 NASA Data Sources")
    st.sidebar.markdown("- **Topography:** LRO / LOLA 20m DEM")
    st.sidebar.markdown("- **Ephemeris:** JPL Horizons / SPICE (DE440)")
    st.sidebar.markdown("- **Ground Truth:** NASA SVS Hyperwall Maps")

    # Filter telemetry for selected site
    df_site = df_telemetry[df_telemetry["site_id"] == site_id].copy().reset_index(drop=True)

    # Top KPI Row
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        st.metric(
            label="Continuous Sunlight",
            value=f"{selected_site['max_continuous_illumination_days']} d",
            delta=f"{selected_site['illumination_percentage']}% total"
        )
    with col2:
        st.metric(
            label="Continuous Earth Comm",
            value=f"{selected_site['max_continuous_comm_days']} d",
            delta=f"{selected_site['comm_percentage']}% total"
        )
    with col3:
        st.metric(
            label="Dual-Op Window",
            value=f"{selected_site['max_continuous_dual_days']} d",
            delta=f"{selected_site['dual_operational_percentage']}% overlap"
        )
    with col4:
        st.metric(
            label="Max Dark Survival",
            value=f"{selected_site['max_continuous_night_hours']} h",
            delta=f"-{selected_site['blackout_hours']}h blackout",
            delta_color="inverse"
        )
    with col5:
        st.metric(
            label="CLPS Suitability",
            value=f"{selected_site['clps_suitability_score']} / 100",
            delta="Ranked"
        )

    # Main Visualizer Tabs
    tab_map, tab_timeline, tab_comparison, tab_seasons, tab_methodology = st.tabs([
        "🗺️ Polar Geospatial Map",
        "📈 Temporal Window Telemetry", 
        "⚖️ Multi-Site Comparative Scorecard", 
        "❄️ Four-Season Orbital Stress Test",
        "🔬 Scientific Methodology & Math"
    ])

    with tab_map:
        st.subheader("🗺️ Lunar South Pole Stereographic Map & Dynamic Horizon Vectors")
        st.caption("Standard LRO LOLA polar stereographic projection (84°S to 90°S). Drag the temporal scrubber to observe real-time solar illumination and Earth line-of-sight vectors sweeping across candidate landing sites.")
        
        # Scrubber slider
        unique_datetimes = df_telemetry["datetime"].drop_duplicates().sort_values().tolist()
        num_epochs = len(unique_datetimes)
        
        scrubber_col1, scrubber_col2 = st.columns([3, 1])
        with scrubber_col1:
            epoch_idx = st.slider(
                "Mission Elapsed Time (Hours from Nov 1, 2026 00:00 UTC)",
                min_value=0,
                max_value=num_epochs - 1,
                value=min(120, num_epochs - 1),
                step=1,
                format="%d h"
            )
        
        selected_epoch = unique_datetimes[epoch_idx]
        with scrubber_col2:
            st.markdown(f"**Current UTC Epoch:**")
            st.markdown(f"`{selected_epoch.strftime('%Y-%m-%d %H:%M:%S UTC')}`")
        
        # Sub-metrics for this epoch across all sites
        epoch_slice = df_telemetry[df_telemetry["datetime"] == selected_epoch]
        dual_count = len(epoch_slice[epoch_slice["state"] == "Dual Operational"])
        sun_count = len(epoch_slice[epoch_slice["state"] == "Sun Only"])
        comm_count = len(epoch_slice[epoch_slice["state"] == "Comm Only"])
        dark_count = len(epoch_slice[epoch_slice["state"] == "Blackout"])
        
        mcol1, mcol2, mcol3, mcol4 = st.columns(4)
        mcol1.metric("Dual Operational Sites", f"{dual_count} / 8", delta="🟢 Optimal", delta_color="normal")
        mcol2.metric("Sun Only (Power OK)", f"{sun_count} / 8", delta="🟡 DTE Blocked", delta_color="off")
        mcol3.metric("Comm Only (DTE OK)", f"{comm_count} / 8", delta="🔵 Cryo Dark", delta_color="off")
        mcol4.metric("Blackout Sites", f"{dark_count} / 8", delta="🔴 No Power/Comm", delta_color="inverse")
        
        # Render Polar Map
        fig_polar = create_polar_geospatial_figure(
            summaries=summaries,
            df_telemetry=df_telemetry,
            selected_time=selected_epoch,
            highlight_site_id=site_id
        )
        st.plotly_chart(fig_polar, use_container_width=True)

    with tab_timeline:
        st.subheader("Hour-by-Hour Celestial Elevation vs. Topographic Horizon")
        st.caption("Lines represent celestial body altitude; dashed lines represent local LOLA terrain obstruction threshold. When altitude > threshold, line-of-sight is unobstructed.")

        # Plot Sun and Earth elevation with horizon thresholds
        fig = go.Figure()

        # Sun line
        fig.add_trace(go.Scatter(
            x=df_site["datetime"],
            y=df_site["sun_elevation_deg"],
            mode="lines",
            name="Sun Elevation (°)",
            line=dict(color="#F59E0B", width=2.5)
        ))
        # Sun horizon line
        fig.add_trace(go.Scatter(
            x=df_site["datetime"],
            y=df_site["sun_horizon_deg"],
            mode="lines",
            name="Terrain Obstruction (Sun Azimuth)",
            line=dict(color="#D97706", width=1.5, dash="dot")
        ))
        # Earth line
        fig.add_trace(go.Scatter(
            x=df_site["datetime"],
            y=df_site["earth_elevation_deg"],
            mode="lines",
            name="Earth Elevation (°)",
            line=dict(color="#38BDF8", width=2.5)
        ))
        # Earth horizon line
        fig.add_trace(go.Scatter(
            x=df_site["datetime"],
            y=df_site["earth_horizon_deg"],
            mode="lines",
            name="Terrain Obstruction (Earth Azimuth)",
            line=dict(color="#0284C7", width=1.5, dash="dot")
        ))

        # Zero reference line
        fig.add_hline(y=0, line_width=1, line_dash="dash", line_color="#64748B")

        fig.update_layout(
            template="plotly_dark",
            height=420,
            margin=dict(l=20, r=20, t=30, b=20),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            xaxis_title="Mission Elapsed Date (UTC)",
            yaxis_title="Elevation Angle (°)",
            hovermode="x unified"
        )
        st.plotly_chart(fig, use_container_width=True)

        # Operational Status Lane
        st.subheader("Operational Window Classification Matrix")
        
        # Color mapping for operational state
        color_map = {
            "Dual Operational": "#10B981", # Emerald
            "Sun Only": "#F59E0B",          # Amber
            "Comm Only": "#0EA5E9",         # Cyan
            "Blackout": "#EF4444"           # Red
        }

        fig_status = go.Figure()
        
        # Draw status bars
        for state_name, color in color_map.items():
            state_df = df_site[df_site["state"] == state_name]
            if not state_df.empty:
                fig_status.add_trace(go.Scatter(
                    x=state_df["datetime"],
                    y=[1] * len(state_df),
                    mode="markers",
                    name=state_name,
                    marker=dict(size=12, symbol="square", color=color)
                ))

        fig_status.update_layout(
            template="plotly_dark",
            height=130,
            margin=dict(l=20, r=20, t=10, b=10),
            yaxis=dict(visible=False),
            xaxis_title="Mission Date (November 2026)",
            legend=dict(orientation="h", yanchor="bottom", y=1.05, xanchor="center", x=0.5)
        )
        st.plotly_chart(fig_status, use_container_width=True)

    with tab_comparison:
        st.subheader("Candidate Landing Site Strategic Comparison")
        st.write("Compare multi-criteria tradeoffs between solar energy autonomy, communication continuous windows, and surface slope safety.")

        comp_records = []
        for s in summaries:
            comp_records.append({
                "Site Name": s["site_name"],
                "Lat (°)": s["latitude"],
                "Lon (°)": s["longitude"],
                "Slope (°)": s["slope_deg"],
                "Max Sun Window (Days)": s["max_continuous_illumination_days"],
                "Max Comm Window (Days)": s["max_continuous_comm_days"],
                "Dual Window (Days)": s["max_continuous_dual_days"],
                "Dark Period (Hours)": s["max_continuous_night_hours"],
                "Suitability (/100)": s["clps_suitability_score"]
            })
        
        comp_df = pd.DataFrame(comp_records).sort_values("Suitability (/100)", ascending=False)
        st.dataframe(comp_df, use_container_width=True, hide_index=True)

        # Comparative Bar Chart
        fig_bar = go.Figure()
        fig_bar.add_trace(go.Bar(
            name="Max Sun Window (Days)",
            x=comp_df["Site Name"],
            y=comp_df["Max Sun Window (Days)"],
            marker_color="#F59E0B"
        ))
        fig_bar.add_trace(go.Bar(
            name="Max Comm Window (Days)",
            x=comp_df["Site Name"],
            y=comp_df["Max Comm Window (Days)"],
            marker_color="#38BDF8"
        ))
        fig_bar.add_trace(go.Bar(
            name="Dual Op Window (Days)",
            x=comp_df["Site Name"],
            y=comp_df["Dual Window (Days)"],
            marker_color="#10B981"
        ))

        fig_bar.update_layout(
            barmode="group",
            template="plotly_dark",
            height=380,
            margin=dict(l=20, r=20, t=30, b=20),
            yaxis_title="Duration (Days)",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
        )
        st.plotly_chart(fig_bar, use_container_width=True)

    with tab_seasons:
        st.subheader("❄️ Four-Season Orbital Stress Test & Cryogenic Night Survival")
        st.write("Evaluate how orbital precession and annual solar declination swings (±1.54°) alter illumination and Earth line-of-sight across the lunar year.")

        if seasonal_data:
            df_season = pd.DataFrame(seasonal_data)
            season_names = list(df_season["season"].unique())
            selected_season = st.selectbox("Select Orbital Season Window", season_names, index=0)
            
            df_filtered_season = df_season[df_season["season"] == selected_season].copy()
            
            cols_to_show = [
                "site_name", "slope_deg", "illumination_percentage", 
                "max_continuous_illumination_days", "comm_percentage", 
                "max_continuous_comm_days", "dual_operational_percentage", 
                "max_continuous_night_hours", "clps_suitability_score"
            ]
            season_display_df = df_filtered_season[cols_to_show].rename(columns={
                "site_name": "Landing Site",
                "slope_deg": "Slope (°)",
                "illumination_percentage": "Sun (%)",
                "max_continuous_illumination_days": "Sun Window (d)",
                "comm_percentage": "Comm (%)",
                "max_continuous_comm_days": "Comm Window (d)",
                "dual_operational_percentage": "Dual Op (%)",
                "max_continuous_night_hours": "Max Night (h)",
                "clps_suitability_score": "Score (/100)"
            }).sort_values("Score (/100)", ascending=False)

            st.dataframe(season_display_df, use_container_width=True, hide_index=True)

            # Seasonal Comparison Plot across all seasons
            st.subheader("Seasonal Sunlight Retention Across All Sites")
            fig_season = go.Figure()
            for sname in df_season["site_name"].unique():
                site_season_rows = df_season[df_season["site_name"] == sname]
                fig_season.add_trace(go.Scatter(
                    x=site_season_rows["season"],
                    y=site_season_rows["illumination_percentage"],
                    mode="lines+markers",
                    name=sname[:22]
                ))
            
            fig_season.update_layout(
                template="plotly_dark",
                height=400,
                margin=dict(l=20, r=20, t=30, b=20),
                yaxis_title="Solar Illumination (%)",
                xaxis_title="Orbital Season",
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
            )
            st.plotly_chart(fig_season, use_container_width=True)
        else:
            st.info("Run scripts/run_seasonal_simulation.py to view multi-season stress data.")

    with tab_methodology:
        st.subheader("Mathematical Model & Technical Architecture")
        st.markdown(r"""
        ### 1. The Core Scientific Premise
        Conventional landing site selection tools treat landing sites as static points on a map. However, at the lunar south pole:
        - **The Sun never rises more than $\approx 1.54^\circ$ above the mean horizon.**
        - **The Earth wobbles due to physical and optical librations by $\pm 7.9^\circ$ in longitude and $\pm 6.7^\circ$ in latitude.**
        - Local crater rims (elevated $1\text{--}4\text{ km}$) cast dynamic shadows that travel continuously across the terrain.

        ### 2. Spherical Ray-Casting Horizon Occlusion
        For an observer at site altitude $z_0$, looking along azimuth heading $\phi$, any topographic point at radial distance $r$ with terrain height $z(r)$ subtends an elevation angle $\theta$:
        $$\tan \theta = \frac{z(r) - z_0 - \frac{r^2}{2 R_{\text{Moon}}}}{r}$$
        The local horizon mask is computed by finding the maximal elevation angle across radial distance sweeps:
        $$H(\phi) = \max_{r \in [100\text{m}, 50\text{km}]} \arctan\left(\frac{z(r) - z_0 - \frac{r^2}{2 R_{\text{Moon}}}}{r}\right)$$

        ### 3. Dual-Constraint Decision Rule
        At any timestamp $t$:
        $$\text{Illuminated}(t) = \begin{cases} 1 & \text{if } \alpha_{\odot}(t) \ge H(\phi_{\odot}(t)) \\ 0 & \text{otherwise} \end{cases}$$
        $$\text{Earth Communication}(t) = \begin{cases} 1 & \text{if } \alpha_{\oplus}(t) \ge H(\phi_{\oplus}(t)) \\ 0 & \text{otherwise} \end{cases}$$
        $$\text{Mission Viability Score} = \int_{t_{\text{start}}}^{t_{\text{end}}} \left( w_1 \cdot \text{Dual}(t) + w_2 \cdot \text{Sun}(t) + w_3 \cdot \text{Comm}(t) \right) dt$$
        """)

if __name__ == "__main__":
    main()
