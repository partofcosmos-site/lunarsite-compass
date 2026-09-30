"""
LunarSite Compass — Synthetic 360-Degree Panoramic Horizon Engine
Generates 360-degree cylindrical skyline silhouettes and optical navigation profiles
calibrated against LOLA topography for Terrain Relative Navigation (TRN).
"""

import numpy as np
import plotly.graph_objects as go
from typing import Dict, List, Tuple

class HorizonPanoramaGenerator:
    """Generates 360-degree synthetic horizon panoramas and optical skyline profiles."""

    def __init__(self, terrain_engine=None):
        if terrain_engine is None:
            from engine.lola_terrain import LOLATerrainEngine
            self.terrain = LOLATerrainEngine()
        else:
            self.terrain = terrain_engine

    def generate_skyline_profile(self, site_id: str, step_deg: float = 1.0) -> Dict:
        """Computes continuous 360-degree skyline elevation angles."""
        azimuths = np.arange(0, 360.0 + step_deg, step_deg)
        elevations = np.array([self.terrain.get_horizon_elevation(site_id, az) for az in azimuths])

        return {
            "site_id": site_id,
            "azimuths_deg": azimuths.tolist(),
            "elevations_deg": elevations.tolist(),
            "mean_horizon_deg": round(float(np.mean(elevations)), 2),
            "max_horizon_deg": round(float(np.max(elevations)), 2),
            "min_horizon_deg": round(float(np.min(elevations)), 2),
            "max_occlusion_azimuth_deg": round(float(azimuths[np.argmax(elevations)]), 1)
        }

    def create_cylindrical_panorama_figure(
        self,
        site_id: str,
        site_name: str,
        sun_az: float = None,
        sun_el: float = None,
        earth_az: float = None,
        earth_el: float = None
    ) -> go.Figure:
        """
        Constructs a 360-degree cylindrical panoramic plot showing the terrain silhouette
        with Sun and Earth celestial markers.
        """
        skyline = self.generate_skyline_profile(site_id, step_deg=1.0)
        azs = np.array(skyline["azimuths_deg"])
        els = np.array(skyline["elevations_deg"])

        fig = go.Figure()

        # 1. Filled terrain ground polygon (from bottom -1° up to skyline)
        fig.add_trace(go.Scatter(
            x=azs,
            y=els,
            mode="lines",
            name="LOLA Terrain Horizon",
            line=dict(color="#475569", width=2),
            fill="tozeroy",
            fillcolor="rgba(30, 41, 59, 0.7)",
            hoverinfo="x+y"
        ))

        # 2. Celestial Body Markers (if supplied)
        if sun_az is not None and sun_el is not None:
            is_sun_visible = sun_el >= self.terrain.get_horizon_elevation(site_id, sun_az)
            sun_color = "#F59E0B" if is_sun_visible else "#78350F"
            sun_status = "UNOBSTRUCTED (POWER ON)" if is_sun_visible else "OCCULTED (IN SHADOW)"

            fig.add_trace(go.Scatter(
                x=[sun_az % 360.0],
                y=[sun_el],
                mode="markers+text",
                name=f"Sun ({sun_status})",
                marker=dict(size=16, color=sun_color, symbol="circle", line=dict(color="#FDE68A", width=2)),
                text=["☀️ Sun"],
                textposition="top center",
                textfont=dict(color="#FDE68A", size=11, weight="bold"),
                hovertext=f"<b>Sun</b><br>Azimuth: {sun_az:.1f}°<br>Elevation: {sun_el:.2f}°<br>Status: {sun_status}"
            ))

        if earth_az is not None and earth_el is not None:
            is_earth_visible = earth_el >= self.terrain.get_horizon_elevation(site_id, earth_az)
            earth_color = "#38BDF8" if is_earth_visible else "#0C4A6E"
            earth_status = "DTE LINK LOCKED" if is_earth_visible else "DTE OCCULTED"

            fig.add_trace(go.Scatter(
                x=[earth_az % 360.0],
                y=[earth_el],
                mode="markers+text",
                name=f"Earth ({earth_status})",
                marker=dict(size=16, color=earth_color, symbol="diamond", line=dict(color="#BAE6FD", width=2)),
                text=["🌍 Earth"],
                textposition="top center",
                textfont=dict(color="#BAE6FD", size=11, weight="bold"),
                hovertext=f"<b>Earth</b><br>Azimuth: {earth_az:.1f}°<br>Elevation: {earth_el:.2f}°<br>Status: {earth_status}"
            ))

        # Zero reference line
        fig.add_hline(y=0, line_width=1, line_dash="dash", line_color="#64748B")

        # Layout and styling
        y_max = max(10.0, float(np.max(els)) + 3.0)
        fig.update_layout(
            title=f"360° Cylindrical Horizon Skyline & Celestial Visibility — {site_name}",
            template="plotly_dark",
            height=360,
            margin=dict(l=20, r=20, t=40, b=20),
            xaxis=dict(
                title="Azimuth Heading (° from North / 0° Sub-Earth)",
                range=[0, 360],
                tickmode="array",
                tickvals=[0, 45, 90, 135, 180, 225, 270, 315, 360],
                ticktext=["0° (N)", "45° (NE)", "90° (E)", "135° (SE)", "180° (S)", "225° (SW)", "270° (W)", "315° (NW)", "360° (N)"]
            ),
            yaxis=dict(
                title="Elevation Angle above Horizontal (°)",
                range=[-0.5, y_max]
            ),
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
        )

        return fig
