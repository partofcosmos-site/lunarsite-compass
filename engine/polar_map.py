"""
LunarSite Compass — Polar Stereographic Geospatial Mapping Module
Projections calibrated to NASA LRO LOLA polar stereographic coordinates.
"""

import numpy as np
import plotly.graph_objects as go
import pandas as pd

R_MOON_KM = 1737.4

def polar_to_xy(lat_deg, lon_deg):
    """
    Project Selenographic coordinates (latitude, longitude) to 
    standard Lunar South Pole Stereographic coordinates (X, Y in km).
    Origin (0,0) is the Lunar South Pole (90°S).
    Y-axis negative direction aligns with 0° Longitude (facing Earth).
    X-axis positive direction aligns with 90° East Longitude.
    """
    colat_rad = np.radians(90.0 - abs(lat_deg))
    lon_rad = np.radians(lon_deg)
    r = 2.0 * R_MOON_KM * np.tan(colat_rad / 2.0)
    x = r * np.sin(lon_rad)
    y = -r * np.cos(lon_rad)
    return float(x), float(y)

# Prominent South Pole Geomorphological Features (Craters and Massifs)
CRATER_FEATURES = [
    {"name": "Shackleton", "lat": -89.67, "lon": 129.78, "radius_km": 10.5, "psr": True},
    {"name": "Faustini", "lat": -87.1, "lon": 84.3, "radius_km": 19.5, "psr": True},
    {"name": "Shoemaker", "lat": -88.1, "lon": 45.9, "radius_km": 25.5, "psr": True},
    {"name": "Haworth", "lat": -87.5, "lon": 354.8, "radius_km": 25.5, "psr": True},
    {"name": "Amundsen", "lat": -84.4, "lon": 83.1, "radius_km": 51.5, "psr": False},
    {"name": "Nobile", "lat": -85.3, "lon": 53.3, "radius_km": 39.5, "psr": False},
    {"name": "de Gerlache", "lat": -88.3, "lon": 271.3, "radius_km": 16.0, "psr": True},
    {"name": "Mons Mouton (Plateau)", "lat": -84.9, "lon": 32.0, "radius_km": 35.0, "psr": False},
]

def generate_crater_boundary(center_lat, center_lon, radius_km, num_points=64):
    """Generate X, Y boundary coordinates for a circular crater rim."""
    cx, cy = polar_to_xy(center_lat, center_lon)
    angles = np.linspace(0, 2 * np.pi, num_points)
    xs = cx + radius_km * np.cos(angles)
    ys = cy + radius_km * np.sin(angles)
    return xs, ys

def create_polar_geospatial_figure(
    summaries, 
    df_telemetry=None, 
    selected_time=None, 
    highlight_site_id=None
):
    """
    Constructs an interactive 2D Polar Stereographic Cartographic Map of the Lunar South Pole.
    Features:
      - Concentric Latitude circles (84°S, 86°S, 88°S, 89°S)
      - Longitude axes (0° Earth-facing, 90°E, 180° Far Side, 270°E)
      - Outlines of major craters and PSR reservoirs
      - Landing site markers with real-time operational status or suitability score
      - Instantaneous Sun and Earth azimuth directional vectors
    """
    fig = go.Figure()

    # 1. Concentric Latitude Grids
    lat_circles = [-84, -86, -88, -89]
    for lat in lat_circles:
        colat_rad = np.radians(90.0 - abs(lat))
        r = 2.0 * R_MOON_KM * np.tan(colat_rad / 2.0)
        theta = np.linspace(0, 2 * np.pi, 120)
        circ_x = r * np.sin(theta)
        circ_y = -r * np.cos(theta)
        
        fig.add_trace(go.Scatter(
            x=circ_x, y=circ_y,
            mode="lines",
            line=dict(color="#334155", width=1, dash="dot"),
            hoverinfo="text",
            text=f"Latitude {abs(lat)}°S (r = {r:.1f} km)",
            showlegend=False
        ))
        
        # Add label along 270° axis
        fig.add_annotation(
            x=-r, y=0,
            text=f"{abs(lat)}°S",
            showarrow=False,
            font=dict(color="#64748B", size=9),
            xanchor="right"
        )

    # 2. Quadrant Axes
    max_r = 2.0 * R_MOON_KM * np.tan(np.radians(7.0) / 2.0) # ~83°S boundary (~212 km)
    axis_coords = [
        ([0, 0], [0, -max_r], "0° (Sub-Earth Meridian)"),
        ([0, 0], [0, max_r], "180° (Far Side)"),
        ([0, max_r], [0, 0], "90°E (East Limb)"),
        ([0, -max_r], [0, 0], "270°E (West Limb)")
    ]
    for xs, ys, label in axis_coords:
        fig.add_trace(go.Scatter(
            x=xs, y=ys,
            mode="lines",
            line=dict(color="#1E293B", width=1.5),
            hoverinfo="text",
            text=label,
            showlegend=False
        ))

    # Add Axis Labels
    fig.add_annotation(x=0, y=-max_r - 12, text="0° (To Earth)", showarrow=False, font=dict(color="#38BDF8", size=10, weight="bold"))
    fig.add_annotation(x=0, y=max_r + 12, text="180° (Far Side)", showarrow=False, font=dict(color="#94A3B8", size=10))
    fig.add_annotation(x=max_r + 15, y=0, text="90°E", showarrow=False, font=dict(color="#94A3B8", size=10))
    fig.add_annotation(x=-max_r - 15, y=0, text="270°E", showarrow=False, font=dict(color="#94A3B8", size=10))

    # 3. Crater Formations & PSRs
    for c in CRATER_FEATURES:
        cx, cy = polar_to_xy(c["lat"], c["lon"])
        xs, ys = generate_crater_boundary(c["lat"], c["lon"], c["radius_km"])
        
        fill_color = "rgba(56, 189, 248, 0.08)" if c["psr"] else "rgba(148, 163, 184, 0.05)"
        line_color = "#0284C7" if c["psr"] else "#475569"
        
        fig.add_trace(go.Scatter(
            x=xs, y=ys,
            mode="lines",
            fill="toself",
            fillcolor=fill_color,
            line=dict(color=line_color, width=1.2, dash="solid" if c["psr"] else "dash"),
            hoverinfo="text",
            text=f"Crater: {c['name']}<br>Radius: {c['radius_km']} km<br>Permanently Shadowed: {'YES (PSR)' if c['psr'] else 'No'}",
            showlegend=False
        ))
        
        # Crater center label
        fig.add_annotation(
            x=cx, y=cy,
            text=c["name"].split()[0],
            showarrow=False,
            font=dict(color="#94A3B8", size=8)
        )

    # 4. Sun & Earth Azimuth Arrows (if timestamp provided)
    if selected_time is not None and df_telemetry is not None:
        # Get mean solar and earth azimuth from telemetry at this timestamp
        sub_df = df_telemetry[df_telemetry["datetime"] == selected_time]
        if not sub_df.empty:
            mean_sun_az = sub_df["sun_azimuth_deg"].mean()
            mean_earth_az = sub_df["earth_azimuth_deg"].mean()
            
            # Sun vector (shining from Sun towards origin, or pointing to Sun)
            # In polar plot, azimuth measured clockwise from 0° (which is along -Y)
            # Azimuth phi from North/0°: X = r*sin(phi), Y = -r*cos(phi)
            vec_len = max_r * 0.85
            sun_x = vec_len * np.sin(np.radians(mean_sun_az))
            sun_y = -vec_len * np.cos(np.radians(mean_sun_az))
            
            earth_x = (vec_len * 0.7) * np.sin(np.radians(mean_earth_az))
            earth_y = -(vec_len * 0.7) * np.cos(np.radians(mean_earth_az))

            # Solar vector arrow
            fig.add_annotation(
                x=sun_x, y=sun_y,
                ax=0, ay=0,
                xref="x", yref="y", axref="x", ayref="y",
                text="☀️ Sun Vector",
                showarrow=True,
                arrowhead=2,
                arrowsize=1.2,
                arrowwidth=2.5,
                arrowcolor="#F59E0B",
                font=dict(color="#F59E0B", size=10, weight="bold")
            )

            # Earth vector arrow
            fig.add_annotation(
                x=earth_x, y=earth_y,
                ax=0, ay=0,
                xref="x", yref="y", axref="x", ayref="y",
                text="🌍 Earth Vector",
                showarrow=True,
                arrowhead=2,
                arrowsize=1.2,
                arrowwidth=2.5,
                arrowcolor="#38BDF8",
                font=dict(color="#38BDF8", size=10, weight="bold")
            )

    # 5. Candidate Landing Sites
    state_color_map = {
        "Dual Operational": "#10B981", # Emerald
        "Sun Only": "#F59E0B",          # Amber
        "Comm Only": "#0EA5E9",         # Cyan
        "Blackout": "#EF4444"           # Red
    }

    # Prepare site status lookup if timestamp available
    site_status_lookup = {}
    if selected_time is not None and df_telemetry is not None:
        sub_df = df_telemetry[df_telemetry["datetime"] == selected_time]
        for _, row in sub_df.iterrows():
            site_status_lookup[row["site_id"]] = {
                "state": row["state"],
                "sun_elev": row["sun_elevation_deg"],
                "earth_elev": row["earth_elevation_deg"]
            }

    # Group sites by operational state for legend
    legend_states_added = set()

    for s in summaries:
        sid = s["site_id"]
        sx, sy = polar_to_xy(s["latitude"], s["longitude"])
        
        status_info = site_status_lookup.get(sid, None)
        if status_info is not None:
            curr_state = status_info["state"]
            color = state_color_map.get(curr_state, "#94A3B8")
            hover_text = (
                f"<b>{s['site_name']}</b><br>"
                f"Status: <b>{curr_state}</b><br>"
                f"Coordinates: {s['latitude']}°S, {s['longitude']}°E<br>"
                f"Elevation: {s['elevation_m']} m | Slope: {s['slope_deg']}°<br>"
                f"Sun Elev: {status_info['sun_elev']:.2f}° | Earth Elev: {status_info['earth_elev']:.2f}°<br>"
                f"Suitability Score: <b>{s['clps_suitability_score']}/100</b>"
            )
        else:
            curr_state = f"Score: {s['clps_suitability_score']}"
            color = "#10B981" if s["clps_suitability_score"] >= 80 else ("#F59E0B" if s["clps_suitability_score"] >= 65 else "#EF4444")
            hover_text = (
                f"<b>{s['site_name']}</b><br>"
                f"Coordinates: {s['latitude']}°S, {s['longitude']}°E<br>"
                f"Elevation: {s['elevation_m']} m | Slope: {s['slope_deg']}°<br>"
                f"Sun Window: {s['max_continuous_illumination_days']} d | Comm: {s['max_continuous_comm_days']} d<br>"
                f"Suitability Score: <b>{s['clps_suitability_score']}/100</b>"
            )

        show_in_legend = False
        legend_name = status_info["state"] if status_info else "Landing Sites"
        if legend_name not in legend_states_added:
            show_in_legend = True
            legend_states_added.add(legend_name)

        is_highlighted = (sid == highlight_site_id)
        marker_size = 15 if is_highlighted else 11
        marker_symbol = "star" if is_highlighted else "circle"

        # Trace for site
        fig.add_trace(go.Scatter(
            x=[sx], y=[sy],
            mode="markers+text",
            name=legend_name,
            showlegend=show_in_legend,
            text=[s["site_name"].split("(")[0].strip()[:14]],
            textposition="top center",
            textfont=dict(color="#F8FAFC" if is_highlighted else "#CBD5E1", size=10, weight="bold" if is_highlighted else "normal"),
            marker=dict(
                size=marker_size,
                symbol=marker_symbol,
                color=color,
                line=dict(color="#FFFFFF" if is_highlighted else "#0F172A", width=2.5 if is_highlighted else 1)
            ),
            hoverinfo="text",
            hovertext=hover_text
        ))

        # Glowing ring around selected site
        if is_highlighted:
            fig.add_trace(go.Scatter(
                x=[sx], y=[sy],
                mode="markers",
                marker=dict(size=24, symbol="circle-open", color="#F59E0B", line=dict(width=2.5)),
                hoverinfo="skip",
                showlegend=False
            ))

    # South Pole Center Pin
    fig.add_trace(go.Scatter(
        x=[0], y=[0],
        mode="markers",
        marker=dict(size=7, symbol="cross", color="#EF4444"),
        hoverinfo="text",
        text="Exact Lunar South Pole (90.0°S)",
        showlegend=False
    ))

    # Layout and Styling
    plot_bound = max_r + 25
    fig.update_layout(
        template="plotly_dark",
        height=620,
        width=None,
        margin=dict(l=20, r=20, t=30, b=20),
        xaxis=dict(
            title="Stereographic X (km) [East ->]",
            range=[-plot_bound, plot_bound],
            zeroline=False,
            showgrid=False
        ),
        yaxis=dict(
            title="Stereographic Y (km) [Sub-Earth v | Far Side ^]",
            range=[-plot_bound, plot_bound],
            scaleanchor="x",
            scaleratio=1,
            zeroline=False,
            showgrid=False
        ),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="center",
            x=0.5,
            bgcolor="rgba(15, 23, 42, 0.8)",
            bordercolor="#334155",
            borderwidth=1
        ),
        hoverlabel=dict(
            bgcolor="#0F172A",
            font_size=12,
            font_family="sans-serif"
        )
    )

    return fig
