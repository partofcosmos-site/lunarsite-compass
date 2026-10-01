"""
LunarSite Compass — ISRU Volatile & Rover Traverse Engine
Computes proximity, thermal stability zones, and rover traverse feasibility
between CLPS landing sites and South Pole Permanently Shadowed Region (PSR) cold traps.
"""

import numpy as np
from typing import Dict, List, Tuple

R_MOON_KM = 1737.4

# Major South Pole Cryogenic Cold Traps & PSR Reservoirs
PSR_RESERVOIRS = [
    {
        "psr_id": "shackleton_floor",
        "name": "Shackleton Crater Floor",
        "latitude": -89.67,
        "longitude": 129.78,
        "depth_km": 4.2,
        "temperature_k": 38,
        "volatile_types": ["H2O Ice", "CO2", "NH3", "Organics"],
        "max_wall_slope_deg": 28.5,
        "scientific_priority": "Pristine Deep Cold Trap"
    },
    {
        "psr_id": "faustini_floor",
        "name": "Faustini Crater Floor",
        "latitude": -87.18,
        "longitude": 84.31,
        "depth_km": 3.1,
        "temperature_k": 42,
        "volatile_types": ["H2O Ice", "CH4", "H2S"],
        "max_wall_slope_deg": 22.0,
        "scientific_priority": "Sub-Surface Ice Deposits"
    },
    {
        "psr_id": "shoemaker_floor",
        "name": "Shoemaker Crater Floor",
        "latitude": -88.14,
        "longitude": 45.91,
        "depth_km": 2.8,
        "temperature_k": 40,
        "volatile_types": ["H2O Surface Frost", "SO2"],
        "max_wall_slope_deg": 19.5,
        "scientific_priority": "LCROSS Analog Volatiles"
    },
    {
        "psr_id": "haworth_floor",
        "name": "Haworth Crater Floor",
        "latitude": -87.45,
        "longitude": 354.83,
        "depth_km": 3.5,
        "temperature_k": 35,
        "volatile_types": ["Super-Volatiles (CO, Ar)", "H2O"],
        "max_wall_slope_deg": 24.0,
        "scientific_priority": "Extreme Cryogenic Laboratory"
    },
    {
        "psr_id": "mons_mouton_micro_psr",
        "name": "Mons Mouton Plateau Depressions",
        "latitude": -84.95,
        "longitude": 31.00,
        "depth_km": 0.35,
        "temperature_k": 65,
        "volatile_types": ["Shallow Buried Ice (1m depth)", "OH Minerals"],
        "max_wall_slope_deg": 6.8,
        "scientific_priority": "TRIDENT / PRIME-1 Drill Target"
    },
    {
        "psr_id": "nobile_micro_psr",
        "name": "Nobile West Rim Cold Pockets",
        "latitude": -85.35,
        "longitude": 38.00,
        "depth_km": 0.40,
        "temperature_k": 68,
        "volatile_types": ["Permafrost Regolith", "Hydrated Silicates"],
        "max_wall_slope_deg": 7.5,
        "scientific_priority": "VIPER Surface Mobility Zone"
    }
]

def calculate_lunar_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes Great-Circle surface distance on the lunar sphere (R = 1737.4 km).
    Uses Haversine formulation robust to polar singularities.
    """
    phi1 = np.radians(lat1)
    phi2 = np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlambda = np.radians(lon2 - lon1)

    a = np.sin(dphi / 2.0)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlambda / 2.0)**2
    c = 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))
    return float(R_MOON_KM * c)

def evaluate_site_isru_potential(site: Dict) -> Dict:
    """
    Evaluates proximity to nearest PSRs, traverse feasibility for robotic rovers,
    and returns an ISRU Accessibility Index.
    """
    slat = site["latitude"]
    slon = site["longitude"]
    slope = site["slope_deg"]

    psr_distances = []
    for psr in PSR_RESERVOIRS:
        dist_km = calculate_lunar_distance_km(slat, slon, psr["latitude"], psr["longitude"])
        
        # Traverse feasibility classification
        if dist_km <= 12.0 and psr["max_wall_slope_deg"] <= 10.0 and slope <= 8.0:
            traverse_class = "Direct Wheeled Traverse (Optimal)"
            feasibility_score = 95.0
        elif dist_km <= 25.0 and psr["max_wall_slope_deg"] <= 15.0 and slope <= 10.0:
            traverse_class = "Long-Range Rover Traverse"
            feasibility_score = 75.0
        elif psr["max_wall_slope_deg"] > 18.0:
            traverse_class = "Steep Crater Wall (Requires Tether/Hopper)"
            feasibility_score = 35.0
        elif dist_km > 50.0:
            traverse_class = "Beyond Mobile Range (>50 km)"
            feasibility_score = 15.0
        else:
            traverse_class = "Complex Multi-Ridge Traverse"
            feasibility_score = 50.0

        psr_distances.append({
            "psr_id": psr["psr_id"],
            "psr_name": psr["name"],
            "distance_km": round(dist_km, 2),
            "temperature_k": psr["temperature_k"],
            "volatiles": psr["volatile_types"],
            "wall_slope_deg": psr["max_wall_slope_deg"],
            "traverse_class": traverse_class,
            "feasibility_score": feasibility_score
        })

    # Sort by distance
    psr_distances.sort(key=lambda x: x["distance_km"])
    nearest = psr_distances[0]

    # Composite ISRU Index (0 to 100)
    # Higher score = closer to volatile reservoir with lower wall/traverse slope
    dist_factor = max(0.0, 1.0 - (nearest["distance_km"] / 40.0))
    slope_factor = max(0.0, 1.0 - (slope / 15.0))
    feasibility_factor = nearest["feasibility_score"] / 100.0

    isru_index = round(100.0 * (0.45 * dist_factor + 0.25 * slope_factor + 0.30 * feasibility_factor), 1)

    return {
        "site_id": site["id"],
        "site_name": site["name"],
        "nearest_psr_name": nearest["psr_name"],
        "nearest_psr_distance_km": nearest["distance_km"],
        "nearest_psr_temperature_k": nearest["temperature_k"],
        "nearest_psr_volatiles": nearest["volatiles"],
        "traverse_classification": nearest["traverse_class"],
        "isru_accessibility_index": isru_index,
        "all_psr_proximity": psr_distances
    }

def run_isru_analysis_all_sites(sites_data: List[Dict]) -> List[Dict]:
    """Runs ISRU analysis for all candidate landing sites."""
    results = []
    for site in sites_data:
        res = evaluate_site_isru_potential(site)
        results.append(res)
    results.sort(key=lambda x: x["isru_accessibility_index"], reverse=True)
    return results
