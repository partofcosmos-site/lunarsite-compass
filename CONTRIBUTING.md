# Contributing to LunarSite Compass

Thank you for your interest in contributing to **LunarSite Compass**, an open-source astrodynamics and planetary landing site optimization platform developed for the **NASA International Space Apps Challenge 2026** (*CLPS Lunar Mission Browser* track).

---

## 🏛️ Code of Conduct & Scientific Rigor

We hold our codebase to university-grade astrodynamic and software engineering standards:
1. **Zero Unverified Approximations:** All ephemeris and planetary vector mechanics must be mathematically derived from first principles (Jean Meeus, NAIF SPICE) or cross-verified against official NASA JPL Horizons APIs.
2. **Deterministic Reproducibility:** Every simulation run must produce deterministic, bit-for-bit verifiable outputs across standard platforms.
3. **Rigorous Closed-Loop Quality Assurance:**
   - Python unit tests (`python -m unittest discover tests -v`) must pass 100%.
   - Frontend builds (`npm run build` in `web/`) must complete with zero TypeScript or ESLint errors.
   - Typst document authoring must pass `pdf-qa` with `defects_found: 0`.

---

## 🛠️ Development Workflow

### Python Astrodynamics Engine
- Working directory: Repository root (`lunarsite-compass/`)
- Test runner:
  ```bash
  python -m unittest discover tests -v
  ```
- Mission data generation:
  ```bash
  python scripts/generate_mission_data.py
  python scripts/run_seasonal_simulation.py
  python scripts/generate_isru_data.py
  python scripts/export_web_data.py
  ```

### Next.js 14 Web Application
- Working directory: `web/`
- Development server:
  ```bash
  npm run dev
  ```
- Production static export:
  ```bash
  npm run build
  ```

---

## 📬 Pull Request Process
1. Fork the repository and create your feature branch: `git checkout -b feature/my-enhancement`.
2. Ensure no private API tokens, edge proxy URLs, or credentials are committed.
3. Ensure all unit tests pass before submitting.
4. Open a Pull Request against the `main` branch with a clear description of the physical or mathematical basis for your changes.
