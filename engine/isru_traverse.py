"""
LunarSite Compass — ISRU Volatile & Rover Traverse Engine
Computes proximity, thermal stability zones, and rover traverse feasibility
between CLPS landing sites and South Pole Permanently Shadowed Region (PSR) cold traps.
"""

import numpy as np
from typing import Dict, List, Tuple, Any, Optional

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
    Uses Haversine formulation robust to polar singularities and floating point overshoot.
    """
    lat1_c = max(-90.0, min(90.0, float(lat1)))
    lat2_c = max(-90.0, min(90.0, float(lat2)))
    phi1 = np.radians(lat1_c)
    phi2 = np.radians(lat2_c)
    dphi = np.radians(lat2_c - lat1_c)
    dlambda = np.radians(float(lon2) - float(lon1))

    a = np.sin(dphi / 2.0)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlambda / 2.0)**2
    a_clipped = float(np.clip(a, 0.0, 1.0))
    c = 2.0 * np.arctan2(np.sqrt(a_clipped), np.sqrt(max(0.0, 1.0 - a_clipped)))
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

# ---------------------------------------------------------------------------
# Terramechanics Slope Penalty & Dijkstra Traverse Pathfinding Engine
# ---------------------------------------------------------------------------

def compute_slope_penalty(slope_deg: float, critical_slope_deg: float = 15.0, exponent: float = 2.0) -> float:
    """
    Evaluates terramechanic mobility penalty on lunar regolith.
    Based on Bekker-Wong lunar wheel-soil interaction mechanics.
    Returns 0.0 on flat terrain, non-linear penalty as slope approaches
    critical climb threshold (15.0° for typical CLPS rovers), and float('inf')
    beyond critical threshold where rover tipping/slip hazard becomes impassable.
    """
    if slope_deg <= 0.0:
        return 0.0
    if slope_deg >= critical_slope_deg:
        return float("inf")
    return float((slope_deg / critical_slope_deg) ** exponent)

def calculate_traverse_edge_cost(distance_m: float, slope_deg: float, critical_slope_deg: float = 15.0) -> float:
    """
    Calculates energy/risk cost of traversing an edge segment:
    cost = distance_m * (1.0 + slope_penalty)
    Returns float('inf') if slope exceeds critical tipping threshold.
    """
    penalty = compute_slope_penalty(slope_deg, critical_slope_deg=critical_slope_deg)
    if penalty == float("inf"):
        return float("inf")
    return float(distance_m * (1.0 + penalty))

def classify_thermal_regime(temperature_k: float) -> str:
    """Classifies volatile cold trap thermal regimes based on sublimation equilibrium."""
    if temperature_k <= 40.0:
        return "Super-Volatile Cryogenic Cold Trap"
    elif temperature_k <= 70.0:
        return "H2O Permafrost Thermal Stability Zone"
    else:
        return "Sub-Surface Volatile Burial Zone"

def solve_dijkstra_traverse(
    slope_grid: np.ndarray,
    start: Tuple[int, int],
    goal: Tuple[int, int],
    cell_size_m: float = 20.0,
    critical_slope_deg: float = 15.0
) -> Dict[str, Any]:
    """
    Finds the optimal, lowest-cost traverse route on a 2D slope grid (degrees)
    using Dijkstra's algorithm. Avoids steep crater walls and returns total
    distance, maximum slope encountered, and path waypoints.
    """
    import heapq

    rows, cols = slope_grid.shape
    r_start, c_start = start
    r_goal, c_goal = goal

    if not (0 <= r_start < rows and 0 <= c_start < cols):
        raise ValueError(f"Start coordinates {start} out of bounds")
    if not (0 <= r_goal < rows and 0 <= c_goal < cols):
        raise ValueError(f"Goal coordinates {goal} out of bounds")

    # If start or goal itself exceeds critical slope, traverse is impossible
    if slope_grid[r_start, c_start] >= critical_slope_deg or slope_grid[r_goal, c_goal] >= critical_slope_deg:
        return {
            "success": False,
            "path": [],
            "total_cost": float("inf"),
            "total_distance_m": 0.0,
            "max_slope_deg": float(max(slope_grid[r_start, c_start], slope_grid[r_goal, c_goal])),
            "mean_slope_deg": 0.0,
            "num_waypoints": 0,
            "message": "Start or goal site exceeds critical slope safety limit"
        }

    distances = np.full((rows, cols), np.inf, dtype=np.float64)
    distances[r_start, c_start] = 0.0
    predecessors: Dict[Tuple[int, int], Optional[Tuple[int, int]]] = {start: None}

    # Priority queue: (cost, r, c)
    pq = [(0.0, r_start, c_start)]

    # 8-connected neighbors
    neighbor_offsets = [
        (-1, 0, 1.0), (1, 0, 1.0), (0, -1, 1.0), (0, 1, 1.0),
        (-1, -1, np.sqrt(2.0)), (-1, 1, np.sqrt(2.0)),
        (1, -1, np.sqrt(2.0)), (1, 1, np.sqrt(2.0))
    ]

    found = False
    while pq:
        curr_cost, r, c = heapq.heappop(pq)

        if curr_cost > distances[r, c]:
            continue

        if (r, c) == goal:
            found = True
            break

        for dr, dc, dist_factor in neighbor_offsets:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols:
                edge_slope = max(slope_grid[r, c], slope_grid[nr, nc])
                seg_dist = cell_size_m * dist_factor
                seg_cost = calculate_traverse_edge_cost(seg_dist, edge_slope, critical_slope_deg)

                if seg_cost == float("inf"):
                    continue

                new_cost = curr_cost + seg_cost
                if new_cost < distances[nr, nc]:
                    distances[nr, nc] = new_cost
                    predecessors[(nr, nc)] = (r, c)
                    heapq.heappush(pq, (new_cost, nr, nc))

    if not found:
        return {
            "success": False,
            "path": [],
            "total_cost": float("inf"),
            "total_distance_m": 0.0,
            "max_slope_deg": float("inf"),
            "mean_slope_deg": float("inf"),
            "num_waypoints": 0,
            "message": "No passable route exists within slope constraints"
        }

    # Reconstruct path
    path = []
    curr = goal
    while curr is not None:
        path.append(curr)
        curr = predecessors.get(curr)
    path.reverse()

    # Compute path statistics
    path_slopes = [float(slope_grid[pr, pc]) for pr, pc in path]
    total_dist = 0.0
    for i in range(len(path) - 1):
        dr = abs(path[i+1][0] - path[i][0])
        dc = abs(path[i+1][1] - path[i][1])
        factor = np.sqrt(2.0) if (dr != 0 and dc != 0) else 1.0
        total_dist += cell_size_m * factor

    return {
        "success": True,
        "path": path,
        "total_cost": round(float(distances[r_goal, c_goal]), 2),
        "total_distance_m": round(float(total_dist), 2),
        "max_slope_deg": round(float(max(path_slopes)), 2),
        "mean_slope_deg": round(float(np.mean(path_slopes)), 2),
        "num_waypoints": len(path),
        "message": "Optimal traverse path successfully planned"
    }

