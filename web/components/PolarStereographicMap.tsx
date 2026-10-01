"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { CandidateSite, SiteSummary, EpochSiteState } from "../lib/types";
import { 
  polarToXy, 
  CRATER_FEATURES, 
  R_MOON_KM, 
  calculateLunarDistanceKm 
} from "../lib/physics";
import { 
  Sun, 
  Radio, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Compass, 
  Info,
  Globe2,
  MapPin
} from "lucide-react";
import * as THREE from "three";

interface PolarMapProps {
  sites: CandidateSite[];
  summaries: SiteSummary[];
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
  currentEpochStates?: Record<string, EpochSiteState>;
  sunAzimuth?: number;
  sunElevation?: number;
  earthAzimuth?: number;
  earthElevation?: number;
  utcDateString?: string;
}

export const PolarStereographicMap: React.FC<PolarMapProps> = ({
  sites,
  summaries,
  selectedSiteId,
  onSelectSite,
  currentEpochStates = {},
  sunAzimuth = 160.0,
  sunElevation = 1.2,
  earthAzimuth = 238.0,
  earthElevation = -4.0,
  utcDateString = "2026-11-01 00:00 UTC",
}) => {
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showPsr, setShowPsr] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showGrids, setShowGrids] = useState<boolean>(true);
  const [hoveredSite, setHoveredSite] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Map scale parameters (83°S outer radius ~ 212 km)
  const maxRadiusKm = 220.0;
  const viewBoxSize = 600;
  const center = viewBoxSize / 2;
  const scale = (center - 30) / maxRadiusKm; // pixels per km

  // Convert km coordinates to SVG canvas coordinates
  const kmToSvg = (xKm: number, yKm: number): [number, number] => {
    return [center + xKm * scale, center + yKm * scale];
  };

  // Pre-calculate site projected positions
  const projectedSites = useMemo(() => {
    return sites.map((site) => {
      const [xKm, yKm] = polarToXy(site.latitude, site.longitude);
      const [svgX, svgY] = kmToSvg(xKm, yKm);
      const summary = summaries.find((s) => s.site_id === site.id);
      const epochState = currentEpochStates[site.id]?.st || "Dual Operational";
      return {
        ...site,
        xKm,
        yKm,
        svgX,
        svgY,
        summary,
        state: epochState,
      };
    });
  }, [sites, summaries, currentEpochStates, scale, center]);

  // Pre-calculate crater boundaries
  const projectedCraters = useMemo(() => {
    return CRATER_FEATURES.map((crater) => {
      const [cxKm, cyKm] = polarToXy(crater.lat, crater.lon);
      const [cxSvg, cySvg] = kmToSvg(cxKm, cyKm);
      const radiusSvg = crater.radiusKm * scale;
      return {
        ...crater,
        cxKm,
        cyKm,
        cxSvg,
        cySvg,
        radiusSvg,
      };
    });
  }, [scale, center]);

  // Pan & Zoom mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== "2d") return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || viewMode !== "2d") return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (viewMode !== "2d") return;
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((prev) => Math.min(4.0, Math.max(0.6, prev * zoomFactor)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // State color helper
  const getStateColor = (state: string) => {
    switch (state) {
      case "Dual Operational":
        return "#10B981"; // Emerald
      case "Sun Only":
        return "#F59E0B"; // Amber
      case "Comm Only":
        return "#0EA5E9"; // Cyan
      case "Blackout":
        return "#EF4444"; // Rose
      default:
        return "#94A3B8";
    }
  };

  // Dynamic vector endpoints for Sun and Earth
  // Sub-solar azimuth angle theta in polar stereographic frame:
  // In our projection, 0° long is down (y > 0 in svg), 90° long is right (x > 0 in svg).
  const vectorLengthKm = maxRadiusKm * 0.95;
  const sunAngleRad = (sunAzimuth * Math.PI) / 180.0;
  const sunVectorX = center + vectorLengthKm * scale * Math.sin(sunAngleRad);
  const sunVectorY = center - vectorLengthKm * scale * Math.cos(sunAngleRad);

  const earthAngleRad = (earthAzimuth * Math.PI) / 180.0;
  const earthVectorX = center + vectorLengthKm * scale * Math.sin(earthAngleRad);
  const earthVectorY = center - vectorLengthKm * scale * Math.cos(earthAngleRad);

  // 3D Three.js rendering effect
  useEffect(() => {
    if (viewMode !== "3d" || !threeCanvasRef.current) return;

    const canvas = threeCanvasRef.current;
    const width = canvas.clientWidth || 500;
    const height = canvas.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050814);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -180, 240);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Ambient light
    const ambient = new THREE.AmbientLight(0x223344, 1.2);
    scene.add(ambient);

    // Directional Sun Light based on sunAzimuth and sunElevation
    const sunDist = 300;
    const sunElRad = ((Math.max(0.2, sunElevation)) * Math.PI) / 180.0;
    const sunAzRad = (sunAzimuth * Math.PI) / 180.0;
    const sunLight = new THREE.DirectionalLight(0xfff1c5, 2.8);
    sunLight.position.set(
      sunDist * Math.sin(sunAzRad) * Math.cos(sunElRad),
      -sunDist * Math.cos(sunAzRad) * Math.cos(sunElRad),
      sunDist * Math.sin(sunElRad) + 20
    );
    scene.add(sunLight);

    // Lunar terrain dish geometry (centered at south pole)
    const terrainGeo = new THREE.CylinderGeometry(140, 140, 4, 64);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.1,
    });
    const moonPlate = new THREE.Mesh(terrainGeo, terrainMat);
    moonPlate.rotation.x = Math.PI / 2;
    scene.add(moonPlate);

    // Concentric coordinate rings in 3D
    [-84, -86, -88, -89].forEach((lat) => {
      const colatRad = ((90 - Math.abs(lat)) * Math.PI) / 180;
      const r = (140 * Math.tan(colatRad / 2)) / Math.tan(((90 - 84) * Math.PI) / 360);
      const ringGeo = new THREE.RingGeometry(r - 0.4, r + 0.4, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x475569, side: THREE.DoubleSide });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.z = 2.1;
      scene.add(ringMesh);
    });

    // Crater depressions & PSR cold traps
    CRATER_FEATURES.forEach((c) => {
      const [xKm, yKm] = polarToXy(c.lat, c.lon);
      const px = (xKm / maxRadiusKm) * 140;
      const py = (yKm / maxRadiusKm) * 140;
      const r = (c.radiusKm / maxRadiusKm) * 140;

      const craterGeo = new THREE.CylinderGeometry(r, r * 0.7, 3, 32);
      const craterMat = new THREE.MeshStandardMaterial({
        color: c.psr ? 0x0c4a6e : 0x1e293b,
        roughness: 0.9,
      });
      const craterMesh = new THREE.Mesh(craterGeo, craterMat);
      craterMesh.position.set(px, py, 2.2);
      craterMesh.rotation.x = Math.PI / 2;
      scene.add(craterMesh);
    });

    // Site Markers in 3D
    const pinGroup = new THREE.Group();
    sites.forEach((s) => {
      const [xKm, yKm] = polarToXy(s.latitude, s.longitude);
      const px = (xKm / maxRadiusKm) * 140;
      const py = (yKm / maxRadiusKm) * 140;
      const isSelected = s.id === selectedSiteId;

      const pinGeo = new THREE.SphereGeometry(isSelected ? 3.5 : 2.2, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x38bdf8 : 0x10b981,
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.set(px, py, 4);
      pinGroup.add(pinMesh);

      // Stems
      const stemGeo = new THREE.CylinderGeometry(0.4, 0.4, 4, 8);
      const stemMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      stemMesh.position.set(px, py, 2);
      stemMesh.rotation.x = Math.PI / 2;
      pinGroup.add(stemMesh);
    });
    scene.add(pinGroup);

    // Sun Vector in 3D
    const sunArrowDir = new THREE.Vector3(Math.sin(sunAzRad), -Math.cos(sunAzRad), 0).normalize();
    const sunArrow = new THREE.ArrowHelper(sunArrowDir, new THREE.Vector3(0, 0, 3), 130, 0xf59e0b, 12, 6);
    scene.add(sunArrow);

    let reqId: number;
    let rotationAngle = 0;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      rotationAngle += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      renderer.dispose();
    };
  }, [viewMode, sunAzimuth, sunElevation, sites, selectedSiteId]);

  return (
    <div className="relative w-full rounded-2xl bg-space-900/90 border border-slate-800 shadow-xl overflow-hidden flex flex-col">
      {/* Map Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:px-4 border-b border-slate-800 bg-space-950/60 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              Conformal Polar Stereographic Lunar South Pole Map
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                84°S – 90°S
              </span>
            </h3>
          </div>
        </div>

        {/* Layer Toggles & View Mode */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 2D vs 3D Switch */}
          <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700">
            <button
              onClick={() => setViewMode("2d")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                viewMode === "2d"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              2D Conformal
            </button>
            <button
              onClick={() => setViewMode("3d")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1 ${
                viewMode === "3d"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe2 className="h-3 w-3" />
              3D Terrain
            </button>
          </div>

          {viewMode === "2d" && (
            <>
              {/* Layer checkboxes */}
              <button
                onClick={() => setShowPsr(!showPsr)}
                className={`px-2 py-1 text-xs rounded-lg border transition ${
                  showPsr
                    ? "bg-cyan-950/70 border-cyan-500/50 text-cyan-300"
                    : "bg-slate-800/60 border-slate-700 text-slate-400"
                }`}
                title="Toggle Permanently Shadowed Regions (PSR)"
              >
                PSRs
              </button>
              <button
                onClick={() => setShowVectors(!showVectors)}
                className={`px-2 py-1 text-xs rounded-lg border transition ${
                  showVectors
                    ? "bg-amber-950/70 border-amber-500/50 text-amber-300"
                    : "bg-slate-800/60 border-slate-700 text-slate-400"
                }`}
                title="Toggle Sun and Earth Directional Vectors"
              >
                Vectors
              </button>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5">
                <button
                  onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(0.6, z - 0.25))}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={resetView}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                  title="Reset View"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Interactive Map Canvas / SVG Area */}
      <div
        ref={containerRef}
        className="relative w-full h-[460px] sm:h-[540px] bg-[#020617] cursor-grab active:cursor-grabbing select-none overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {viewMode === "2d" ? (
          <svg
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
          >
            <defs>
              {/* Radial gradient for space background */}
              <radialGradient id="spaceGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0B132B" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#050B1B" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#020617" stopOpacity="1" />
              </radialGradient>

              {/* PSR Cryogenic Reservoir Shading */}
              <radialGradient id="psrGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0284C7" stopOpacity="0.65" />
                <stop offset="85%" stopColor="#0369A1" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#075985" stopOpacity="0.05" />
              </radialGradient>

              {/* Sun vector marker */}
              <marker
                id="arrowSun"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#F59E0B" />
              </marker>

              {/* Earth vector marker */}
              <marker
                id="arrowEarth"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
              </marker>
            </defs>

            {/* Background Disc */}
            <circle cx={center} cy={center} r={maxRadiusKm * scale} fill="url(#spaceGradient)" />

            {/* Latitude Rings */}
            {showGrids &&
              [-84, -86, -88, -89].map((lat) => {
                const colatRad = ((90.0 - Math.abs(lat)) * Math.PI) / 180.0;
                const rKm = 2.0 * R_MOON_KM * Math.tan(colatRad / 2.0);
                const rSvg = rKm * scale;
                return (
                  <g key={lat}>
                    <circle
                      cx={center}
                      cy={center}
                      r={rSvg}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={center - rSvg + 4}
                      y={center - 3}
                      fill="#64748B"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {Math.abs(lat)}°S
                    </text>
                  </g>
                );
              })}

            {/* Longitude Axes */}
            {showGrids && (
              <g stroke="#1E293B" strokeWidth="1" strokeDasharray="2 4">
                {/* 0° (Facing Earth) to 180° (Far Side) */}
                <line x1={center} y1={center - maxRadiusKm * scale} x2={center} y2={center + maxRadiusKm * scale} />
                {/* 90°E to 270°E */}
                <line x1={center - maxRadiusKm * scale} y1={center} x2={center + maxRadiusKm * scale} y2={center} />

                {/* Meridian Labels */}
                <text x={center} y={center + maxRadiusKm * scale - 6} fill="#64748B" fontSize="9" textAnchor="middle" fontFamily="monospace">
                  0° (Sub-Earth)
                </text>
                <text x={center} y={center - maxRadiusKm * scale + 12} fill="#64748B" fontSize="9" textAnchor="middle" fontFamily="monospace">
                  180° (Far Side)
                </text>
                <text x={center + maxRadiusKm * scale - 10} y={center - 4} fill="#64748B" fontSize="9" textAnchor="end" fontFamily="monospace">
                  90°E
                </text>
                <text x={center - maxRadiusKm * scale + 8} y={center - 4} fill="#64748B" fontSize="9" textAnchor="start" fontFamily="monospace">
                  270°E
                </text>
              </g>
            )}

            {/* Crater Outlines and PSR Footprints */}
            {projectedCraters.map((crater) => (
              <g key={crater.name}>
                {crater.psr && showPsr && (
                  <circle
                    cx={crater.cxSvg}
                    cy={crater.cySvg}
                    r={crater.radiusSvg}
                    fill="url(#psrGradient)"
                    stroke="#0284C7"
                    strokeWidth="1"
                    strokeOpacity="0.4"
                  />
                )}
                <circle
                  cx={crater.cxSvg}
                  cy={crater.cySvg}
                  r={crater.radiusSvg}
                  fill="none"
                  stroke={crater.psr ? "#0EA5E9" : "#475569"}
                  strokeWidth={crater.psr ? "1.5" : "1"}
                  strokeDasharray={crater.psr ? "none" : "2 2"}
                />
                <text
                  x={crater.cxSvg}
                  y={crater.cySvg - crater.radiusSvg - 3}
                  fill={crater.psr ? "#38BDF8" : "#94A3B8"}
                  fontSize="8.5"
                  fontWeight="600"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {crater.name}
                </text>
              </g>
            ))}

            {/* Dynamic Sun Vector */}
            {showVectors && (
              <g>
                <line
                  x1={center}
                  y1={center}
                  x2={sunVectorX}
                  y2={sunVectorY}
                  stroke="#F59E0B"
                  strokeWidth="2"
                  markerEnd="url(#arrowSun)"
                />
                <circle cx={sunVectorX} cy={sunVectorY} r="7" fill="#F59E0B" fillOpacity="0.9" />
                <circle cx={sunVectorX} cy={sunVectorY} r="12" fill="#F59E0B" fillOpacity="0.2" className="animate-ping" />
                <text
                  x={sunVectorX + (sunVectorX > center ? 10 : -10)}
                  y={sunVectorY}
                  fill="#FCD34D"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor={sunVectorX > center ? "start" : "end"}
                  fontFamily="monospace"
                >
                  ☀️ Sub-Solar ({sunAzimuth.toFixed(1)}°, {sunElevation >= 0 ? `+${sunElevation.toFixed(2)}` : sunElevation.toFixed(2)}°)
                </text>
              </g>
            )}

            {/* Dynamic Earth Vector */}
            {showVectors && (
              <g>
                <line
                  x1={center}
                  y1={center}
                  x2={earthVectorX}
                  y2={earthVectorY}
                  stroke="#38BDF8"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  markerEnd="url(#arrowEarth)"
                />
                <circle cx={earthVectorX} cy={earthVectorY} r="6" fill="#0EA5E9" />
                <text
                  x={earthVectorX + (earthVectorX > center ? 10 : -10)}
                  y={earthVectorY}
                  fill="#7DD3FC"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor={earthVectorX > center ? "start" : "end"}
                  fontFamily="monospace"
                >
                  🌍 Sub-Earth ({earthAzimuth.toFixed(1)}°, {earthElevation >= 0 ? `+${earthElevation.toFixed(2)}` : earthElevation.toFixed(2)}°)
                </text>
              </g>
            )}

            {/* South Pole Center Axis Marker */}
            <circle cx={center} cy={center} r="3" fill="#E2E8F0" />
            <text x={center + 5} y={center + 4} fill="#E2E8F0" fontSize="9" fontWeight="bold" fontFamily="monospace">
              90°S Pole
            </text>

            {/* Candidate Landing Site Markers */}
            {projectedSites.map((site) => {
              const isSelected = site.id === selectedSiteId;
              const isHovered = site.id === hoveredSite;
              const color = getStateColor(site.state);

              return (
                <g
                  key={site.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSite(site.id);
                  }}
                  onMouseEnter={() => setHoveredSite(site.id)}
                  onMouseLeave={() => setHoveredSite(null)}
                  className="cursor-pointer transition-all duration-200"
                >
                  {/* Outer Pulsing Ring for Selected Site */}
                  {isSelected && (
                    <circle
                      cx={site.svgX}
                      cy={site.svgY}
                      r="16"
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      strokeOpacity="0.8"
                      className="animate-pulse"
                    />
                  )}

                  {/* Highlight Glow */}
                  <circle
                    cx={site.svgX}
                    cy={site.svgY}
                    r={isSelected ? "9" : isHovered ? "7" : "5"}
                    fill={color}
                    fillOpacity={isSelected ? 0.9 : 0.75}
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? "2" : "1"}
                  />

                  {/* Text Label */}
                  <text
                    x={site.svgX}
                    y={site.svgY + (isSelected ? 16 : 14)}
                    fill={isSelected ? "#F8FAFC" : "#CBD5E1"}
                    fontSize={isSelected ? "9.5" : "8"}
                    fontWeight={isSelected ? "bold" : "normal"}
                    textAnchor="middle"
                    fontFamily="sans-serif"
                    className="pointer-events-none drop-shadow-md"
                  >
                    {site.name.split("(")[0].trim()}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <canvas ref={threeCanvasRef} className="w-full h-full block" />
        )}

        {/* Hovered Site Details Overlay Card */}
        {hoveredSite && (
          <div className="absolute top-4 left-4 z-20 p-3 rounded-xl bg-space-950/95 border border-cyan-500/50 shadow-2xl backdrop-blur-md max-w-xs text-xs pointer-events-none">
            {(() => {
              const s = projectedSites.find((p) => p.id === hoveredSite);
              if (!s) return null;
              return (
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    {s.name}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase"
                      style={{
                        backgroundColor: `${getStateColor(s.state)}22`,
                        color: getStateColor(s.state),
                        border: `1px solid ${getStateColor(s.state)}66`,
                      }}
                    >
                      {s.state}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      Score: {s.summary?.clps_suitability_score.toFixed(1)}/100
                    </span>
                  </div>
                  <div className="mt-2 text-slate-300 space-y-0.5 font-mono text-[11px]">
                    <div>Lat: {s.latitude.toFixed(3)}°S | Lon: {s.longitude.toFixed(3)}°E</div>
                    <div>Elevation: +{s.elevation_m} m | Slope: {s.slope_deg}°</div>
                    <div>Sun Window: {s.summary?.max_continuous_illumination_days.toFixed(1)}d</div>
                    <div>Comm Window: {s.summary?.max_continuous_comm_days.toFixed(1)}d</div>
                  </div>
                  <div className="mt-1.5 text-[10px] text-slate-400 italic">
                    {s.mission_context}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Legend Overlay at bottom-left */}
        <div className="absolute bottom-3 left-3 z-10 p-2.5 rounded-lg bg-space-950/85 border border-slate-800 backdrop-blur-sm text-[11px] text-slate-300 space-y-1">
          <div className="font-semibold text-slate-200 text-xs mb-1">Operational State Legend:</div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Dual-Op (Power + Comm)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>Sun Only (Power OK)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
            <span>Comm Only (Earth Contact)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>Mission Blackout</span>
          </div>
        </div>

        {/* Projection metadata badge at bottom-right */}
        <div className="absolute bottom-3 right-3 z-10 text-[10px] font-mono text-slate-400 bg-space-950/80 px-2.5 py-1 rounded border border-slate-800">
          Stereographic conformal projection calibrated to LRO LOLA DEM
        </div>
      </div>
    </div>
  );
};
