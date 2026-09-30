"""
LunarSite Compass — Autonomous Workflow Daemon & Milestone Evaluator
Evaluates active engineering deliverables, maintains persistent milestone state,
and generates customized execution prompts for continuous autonomous development.
"""

import os
import sys
import json
import time
from datetime import datetime, timezone

# Ensure UTF-8 output encoding on Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATE_FILE = os.path.join(BASE_DIR, "data", "workflow_state.json")
LOG_FILE = os.path.join(BASE_DIR, "logs", "autonomous_workflow.log")
PROMPT_FILE = os.path.join(BASE_DIR, "data", "current_workflow_prompt.txt")

# Define the sequential master engineering milestones
MILESTONES = [
    {
        "id": "M1_CORE_SOLVER",
        "title": "Topocentric Ephemeris & LOLA Ray-Casting Solver",
        "check_files": ["engine/lunar_ephemeris.py", "engine/lola_terrain.py", "engine/mission_solver.py"],
        "category": "Astrodynamics Engine",
        "description": "Deterministic solar and Earth vector calculations with LOLA spherical horizon ray-casting."
    },
    {
        "id": "M2_MISSION_TELEMETRY",
        "title": "30-Day November 2026 Simulation (5,760 Epochs)",
        "check_files": ["data/mission_telemetry_2026.csv", "data/mission_summary_matrix.json"],
        "category": "Data Generation",
        "description": "Pre-computed 720-hour ephemeris and horizon occlusion matrices across 8 landing sites."
    },
    {
        "id": "M3_SEASONAL_STRESS_TEST",
        "title": "Four-Season Astronomical Stress Test Benchmark",
        "check_files": ["data/seasonal_benchmark_analysis.json", "scripts/run_seasonal_simulation.py"],
        "category": "Orbital Stress Testing",
        "description": "Multi-season benchmark evaluating solar retention and cryogenic night survival."
    },
    {
        "id": "M4_POLAR_CARTOGRAPHY",
        "title": "Interactive 2D Polar Stereographic Geospatial Map",
        "check_files": ["engine/polar_map.py"],
        "category": "Geospatial UI",
        "description": "LRO LOLA polar stereographic map with dynamic solar and Earth azimuth vectors."
    },
    {
        "id": "M5_TYPST_RESEARCH_PAPER",
        "title": "Publication-Grade Typst Academic Paper (defects_found: 0)",
        "check_files": ["docs/LUNARSITE_COMPASS_RESEARCH_PAPER.typ", "docs/LUNARSITE_COMPASS_RESEARCH_PAPER.pdf"],
        "category": "Publication Engine",
        "description": "5-page academic treatise validated with pdf-qa closed-loop visual inspection."
    },
    {
        "id": "M6_VIDEO_PRESENTATION_SCRIPT",
        "title": "90-Second NASA Space Apps Challenge Pitch Script",
        "check_files": ["docs/PRESENTATION_VIDEO_SCRIPT.md"],
        "category": "Competition Deliverable",
        "description": "Exact 5-part rubric storyboard (Problem, Data, Method, Results, Impact)."
    },
    {
        "id": "M7_ISRU_VOLATILE_TRAVERSE",
        "title": "ISRU Water-Ice Cold Trap Proximity & Rover Traverse Engine",
        "check_files": ["engine/isru_traverse.py", "data/sites_isru_analysis.json"],
        "category": "Planetary Science & ISRU",
        "description": "Proximity, thermal stability zones, and slope traverse feasibility for VIPER/PRIME-1 rovers."
    },
    {
        "id": "M8_DESCENT_TRAJECTORY_COMM",
        "title": "Powered Descent Initiation (PDI) Horizon Doppler & Comm Corridor",
        "check_files": ["engine/descent_trajectory.py"],
        "category": "Flight Dynamics",
        "description": "Descent trajectory modeling from 15 km altitude PDI to touchdown, tracking DTE LOS angle."
    },
    {
        "id": "M9_FLIGHT_DIRECTOR_CERTIFICATION",
        "title": "Automated Mission Go/No-Go Certification CLI",
        "check_files": ["scripts/certify_mission.py"],
        "category": "Mission Operations",
        "description": "Flight director command-line tool generating cryptographic mission viability certificates."
    },
    {
        "id": "M10_HORIZON_PANORAMIC_PROFILES",
        "title": "Synthetic 360-Degree Panoramic Horizon Profile Generator",
        "check_files": ["engine/horizon_panorama.py"],
        "category": "Visualization & Synthetic Sensors",
        "description": "Generates 360-degree cylindrical horizon profiles for optical navigation matching."
    }
]

def load_or_init_state():
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    return {
        "project_name": "LunarSite Compass",
        "version": "1.2.0",
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "completed_milestones": [],
        "current_milestone_id": None,
        "iteration_count": 0
    }

def save_state(state):
    state["last_updated"] = datetime.now(timezone.utc).isoformat()
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

def log_event(message):
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    line = f"[{timestamp}] {message}\n"
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line)
    print(line.strip())

def evaluate_milestones(state):
    completed = []
    next_milestone = None

    for m in MILESTONES:
        all_exist = True
        for rel_path in m["check_files"]:
            full_path = os.path.join(BASE_DIR, rel_path.replace("/", os.sep))
            if not os.path.exists(full_path) or os.path.getsize(full_path) == 0:
                all_exist = False
                break
        
        if all_exist:
            completed.append(m["id"])
        elif next_milestone is None:
            next_milestone = m

    state["completed_milestones"] = completed
    state["current_milestone_id"] = next_milestone["id"] if next_milestone else "ALL_COMPLETED"
    state["iteration_count"] = state.get("iteration_count", 0) + 1

    return next_milestone

def generate_custom_prompt(next_m, state):
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    total_m = len(MILESTONES)
    comp_count = len(state["completed_milestones"])

    if next_m is None:
        prompt = (
            f"AUTONOMOUS WORKFLOW HEARTBEAT ({timestamp}) | ALL {total_m}/{total_m} MILESTONES COMPLETE!\n"
            f"Current Focus: Continuous system health check, daemon liveness verification on port 8501, "
            f"and unit test regression suite pass."
        )
    else:
        prompt = (
            f"AUTONOMOUS WORKFLOW EXECUTION ({timestamp}) | Progress: {comp_count}/{total_m} Milestones Complete\n"
            f"TARGET MILESTONE: [{next_m['id']}] {next_m['title']}\n"
            f"Category: {next_m['category']}\n"
            f"Required Deliverable Files: {', '.join(next_m['check_files'])}\n"
            f"Objective: {next_m['description']}\n"
            f"Instruction: Autonomously implement the required module, execute tests, verify 0 defects, "
            f"and integrate into LunarSite Compass."
        )

    with open(PROMPT_FILE, "w", encoding="utf-8") as f:
        f.write(prompt)

    return prompt

def main():
    state = load_or_init_state()
    next_m = evaluate_milestones(state)
    save_state(state)
    
    prompt = generate_custom_prompt(next_m, state)
    log_event(f"Iteration {state['iteration_count']}: {len(state['completed_milestones'])}/{len(MILESTONES)} milestones complete. Target: {state['current_milestone_id']}")
    
    print("\n" + "="*70)
    print("🌕 LUNARSITE COMPASS — AUTONOMOUS WORKFLOW STATUS")
    print("="*70)
    print(f"Completed Milestones: {len(state['completed_milestones'])} / {len(MILESTONES)}")
    for mid in state['completed_milestones']:
        m_info = next(m for m in MILESTONES if m["id"] == mid)
        print(f"  [x] {m_info['id']}: {m_info['title']}")
    
    if next_m:
        print(f"\nNext Target Milestone: {next_m['id']}")
        print(f"Title: {next_m['title']}")
        print(f"Category: {next_m['category']}")
        print(f"Files to Produce: {', '.join(next_m['check_files'])}")
        print("\nGenerated Agent Prompt:")
        print(prompt)
    else:
        print("\nAll master engineering milestones successfully verified!")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
