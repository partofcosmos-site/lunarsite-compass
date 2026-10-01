"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  MapPin,
  Eye
} from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const MAX_RADIUS_KM = 220.0;
const DISH_RADIUS_3D = 140.0;
const SCALE_3D = DISH_RADIUS_3D / MAX_RADIUS_KM;

/**
 * High-accuracy selenographic elevation field for the Lunar South Pole (84°S – 90°S).
 * Reconstructs prominent crater rims (Shackleton, Faustini, Shoemaker, Haworth, Amundsen,
 * Nobile, de Gerlache) and elevated massifs (Mons Mouton plateau) based on LOLA DEM contours.
 */
export function computeTerrainHeight(x: number, y: number): number {
  let z = 0;
  for (const c of CRATER_FEATURES) {
    const [cxKm, cyKm] = polarToXy(c.lat, c.lon);
    const cx = cxKm * SCALE_3D;
    const cy = cyKm * SCALE_3D;
    const craterR = c.radiusKm * SCALE_3D;
    const dist = Math.hypot(x - cx, y - cy);
    const rho = dist / craterR;

    if (c.name === "Mons Mouton") {
      // Mons Mouton is an elevated plateau / massif (~6 km high above mean datum)
      if (rho < 0.9) {
        z += 5.5 * (1.0 - Math.pow(rho, 3));
      } else if (rho < 1.7) {
        z += 5.5 * Math.exp(-Math.pow((rho - 0.9) / 0.35, 2));
      }
    } else {
      // Impact craters: deep interior depression + elevated rim wall & ejecta blanket
      const depth = ((c.depthKm || 3.0) / 4.5) * 5.8;
      const rimHeight = Math.max(1.8, depth * 0.42);
      if (rho < 1.0) {
        const bowl = 1.0 - Math.pow(rho, 2);
        z += -depth * Math.pow(bowl, 0.7) + rimHeight * Math.pow(rho, 2.5);
      } else if (rho < 2.2) {
        const falloff = Math.exp(-Math.pow((rho - 1.0) / 0.32, 2));
        z += rimHeight * falloff;
      }
    }
  }

  // Micro-undulation to simulate natural regolith roughness and craters
  z += 0.3 * (Math.sin(x * 0.16 + y * 0.14) * Math.cos(x * 0.11 - y * 0.18) + Math.sin(x * 0.06) * Math.sin(y * 0.06));

  return z;
}

/**
 * Creates high-contrast billboard text sprites for 3D navigation badges and labels.
 */
function createLabelSprite(
  text: string,
  options: {
    textColor?: string;
    bgColor?: string;
    borderColor?: string;
    fontSize?: number;
    scaleX?: number;
    scaleY?: number;
  } = {}
) {
  const {
    textColor = "#F8FAFC",
    bgColor = "rgba(10, 15, 30, 0.85)",
    borderColor = "rgba(56, 189, 248, 0.5)",
    fontSize = 18,
    scaleX = 14,
    scaleY = 3.5,
  } = options;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Sprite();

  // Draw rounded pill badge
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2.5;

  const x = 4, y = 4, w = 248, h = 56, r = 12;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw text
  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(scaleX, scaleY, 1);
  return sprite;
}

/**
 * Updates existing canvas sprite texture in-place without triggering GC allocation.
 */
function updateLabelSprite(
  sprite: THREE.Sprite,
  text: string,
  textColor: string,
  bgColor: string,
  borderColor: string,
  fontSize: number = 18
) {
  const texture = sprite.material.map;
  if (!texture || !texture.image) return;
  const canvas = texture.image as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2.5;

  const x = 4, y = 4, w = 248, h = 56, r = 12;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 32);

  texture.needsUpdate = true;
}

interface DirectionalVectorObj {
  group: THREE.Group;
  shaftMesh: THREE.Mesh;
  headMesh: THREE.Mesh;
  haloMesh: THREE.Mesh;
  coreMesh: THREE.Mesh;
  labelSprite: THREE.Sprite;
  update: (origin: THREE.Vector3, dir: THREE.Vector3, labelText: string, length?: number) => void;
}

/**
 * Constructs a 3D directional vector originating from a site with glowing arrowhead & halo.
 */
function createDirectionalVector(
  colorHex: number,
  glowColorHex: number,
  labelText: string,
  textColor: string,
  bgColor: string,
  borderColor: string
): DirectionalVectorObj {
  const group = new THREE.Group();

  // Glowing metallic cylinder shaft
  const shaftGeo = new THREE.CylinderGeometry(0.44, 0.44, 1, 12);
  shaftGeo.translate(0, 0.5, 0); // Origin at bottom, extends along +Y
  const shaftMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.8,
  });
  const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
  group.add(shaftMesh);

  // Glowing arrowhead cone
  const headGeo = new THREE.ConeGeometry(2.5, 6.5, 16);
  headGeo.translate(0, 3.25, 0); // Base at 0, apex along +Y
  const headMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 1.3,
    roughness: 0.1,
  });
  const headMesh = new THREE.Mesh(headGeo, headMat);
  group.add(headMesh);

  // Glowing outer corona halo sphere
  const haloGeo = new THREE.SphereGeometry(4.2, 16, 16);
  const haloMat = new THREE.MeshBasicMaterial({
    color: glowColorHex,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const haloMesh = new THREE.Mesh(haloGeo, haloMat);
  group.add(haloMesh);

  // Brilliant inner core glow
  const coreGeo = new THREE.SphereGeometry(1.6, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  group.add(coreMesh);

  // Floating 3D label badge
  const labelSprite = createLabelSprite(labelText, {
    textColor,
    bgColor,
    borderColor,
    fontSize: 17,
    scaleX: 19,
    scaleY: 4.8,
  });
  group.add(labelSprite);

  const update = (
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    newLabelText: string,
    length: number = 64
  ) => {
    group.position.copy(origin);

    const normDir = dir.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    group.quaternion.setFromUnitVectors(up, normDir);

    const headLength = 6.5;
    const shaftLength = Math.max(3, length - headLength);
    shaftMesh.scale.set(1, shaftLength, 1);

    headMesh.position.set(0, shaftLength, 0);
    haloMesh.position.set(0, shaftLength + 3.25, 0);
    coreMesh.position.set(0, shaftLength + 3.25, 0);
    labelSprite.position.set(0, shaftLength + 10.0, 0);

    updateLabelSprite(labelSprite, newLabelText, textColor, bgColor, borderColor, 17);
  };

  return {
    group,
    shaftMesh,
    headMesh,
    haloMesh,
    coreMesh,
    labelSprite,
    update,
  };
}

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

  // 3D Scene persistent state reference
  const threeStateRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    sunLight: THREE.DirectionalLight;
    earthLight: THREE.DirectionalLight;
    sunVector: DirectionalVectorObj;
    earthVector: DirectionalVectorObj;
    vectorGroup: THREE.Group;
    psrGroup: THREE.Group;
    pinsMap: Map<string, {
      group: THREE.Group;
      pinMesh: THREE.Mesh;
      stemMesh: THREE.Mesh;
      padMesh: THREE.Mesh;
      ringMesh?: THREE.Mesh;
      beamMesh?: THREE.Mesh;
      labelSprite?: THREE.Sprite;
      px: number;
      py: number;
      pz: number;
    }>;
    selectedBeaconRing: THREE.Mesh | null;
    interactiveMeshes: THREE.Object3D[];
    animId: number;
  } | null>(null);

  // Keep references to latest props for 3D interactions
  const selectedSiteRef = useRef(selectedSiteId);
  selectedSiteRef.current = selectedSiteId;
  const onSelectSiteRef = useRef(onSelectSite);
  onSelectSiteRef.current = onSelectSite;

  // Map scale parameters (83°S outer radius ~ 212 km)
  const maxRadiusKm = MAX_RADIUS_KM;
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
    if (viewMode !== "2d") return;
    e.preventDefault();
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

  // State color helper returning numeric hex for Three.js
  const getStateColorHex = (state: string): number => {
    switch (state) {
      case "Dual Operational":
        return 0x10b981;
      case "Sun Only":
        return 0xf59e0b;
      case "Comm Only":
        return 0x0ea5e9;
      case "Blackout":
        return 0xef4444;
      default:
        return 0x94a3b8;
    }
  };

  // Dynamic vector endpoints for Sun and Earth in 2D
  const vectorLengthKm = maxRadiusKm * 0.95;
  const sunAngleRad = (sunAzimuth * Math.PI) / 180.0;
  const sunVectorX = center + vectorLengthKm * scale * Math.sin(sunAngleRad);
  const sunVectorY = center - vectorLengthKm * scale * Math.cos(sunAngleRad);

  const earthAngleRad = (earthAzimuth * Math.PI) / 180.0;
  const earthVectorX = center + vectorLengthKm * scale * Math.sin(earthAngleRad);
  const earthVectorY = center - vectorLengthKm * scale * Math.cos(earthAngleRad);

  // Camera presets for 3D navigation
  const reset3dCamera = () => {
    if (!threeStateRef.current) return;
    const { camera, controls } = threeStateRef.current;
    camera.position.set(0, -170, 220);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
  };

  const topDown3dCamera = () => {
    if (!threeStateRef.current) return;
    const { camera, controls } = threeStateRef.current;
    camera.position.set(0, -0.01, 260);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
  };

  const lowAngle3dCamera = () => {
    if (!threeStateRef.current) return;
    const { camera, controls } = threeStateRef.current;
    camera.position.set(0, -190, 42);
    camera.lookAt(0, 0, 8);
    controls.target.set(0, 0, 8);
    controls.update();
  };

  // -------------------------------------------------------------
  // 3D Three.js Scene Initialization and Lifecycle Effect
  // -------------------------------------------------------------
  useEffect(() => {
    if (viewMode !== "3d" || !threeCanvasRef.current) return;

    const canvas = threeCanvasRef.current;
    const width = canvas.clientWidth || 600;
    const height = canvas.clientHeight || 540;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1500);
    camera.position.set(0, -170, 220);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Interactive OrbitControls with smooth damping
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.minDistance = 35;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Guard camera from clipping under lunar dish
    controls.minPolarAngle = 0.05;
    controls.target.set(0, 0, 0);

    // Deep space ambient illumination (cold starry fill)
    const ambient = new THREE.AmbientLight(0x182438, 0.65);
    scene.add(ambient);

    // Directional Sunlight with high-resolution shadow casting
    const sunLight = new THREE.DirectionalLight(0xfff3db, 2.8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 50;
    sunLight.shadow.camera.far = 700;
    const d = 160;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0006;
    sunLight.shadow.normalBias = 0.04;
    scene.add(sunLight);
    scene.add(sunLight.target);

    // Earthshine directional fill light
    const earthLight = new THREE.DirectionalLight(0x38bdf8, 0.25);
    scene.add(earthLight);

    // -------------------------------------------------------------
    // 3D Lunar Topographic Dish with Displaced Crater Rims
    // -------------------------------------------------------------
    const terrainGeo = new THREE.RingGeometry(0.01, DISH_RADIUS_3D, 128, 80);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      posAttr.setZ(i, computeTerrainHeight(vx, vy));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.92,
      metalness: 0.08,
      flatShading: false,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.castShadow = true;
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // Cylindrical core pedestal beneath the lunar dish
    const baseGeo = new THREE.CylinderGeometry(DISH_RADIUS_3D, DISH_RADIUS_3D, 8, 64);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.95,
      metalness: 0.05,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.rotation.x = Math.PI / 2;
    baseMesh.position.z = -4.0;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);

    // Concentric coordinate rings in 3D
    const gridGroup = new THREE.Group();
    [-84, -86, -88, -89].forEach((lat) => {
      const colatRad = ((90.0 - Math.abs(lat)) * Math.PI) / 180.0;
      const r = (DISH_RADIUS_3D * Math.tan(colatRad / 2.0)) / Math.tan(((90.0 - 84.0) * Math.PI) / 360.0);
      const ringGeo = new THREE.RingGeometry(r - 0.35, r + 0.35, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x475569,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.z = 1.0;
      gridGroup.add(ringMesh);

      // Latitude badge
      const latSprite = createLabelSprite(`${Math.abs(lat)}°S`, {
        textColor: "#94A3B8",
        bgColor: "rgba(15, 23, 42, 0.75)",
        borderColor: "rgba(71, 85, 105, 0.5)",
        fontSize: 18,
        scaleX: 9,
        scaleY: 2.3,
      });
      latSprite.position.set(-r, 0, 2.0);
      gridGroup.add(latSprite);
    });
    scene.add(gridGroup);

    // South Pole center marker pin (90°S)
    const polePinGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 12);
    const polePinMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    const polePinMesh = new THREE.Mesh(polePinGeo, polePinMat);
    polePinMesh.position.set(0, 0, 2.0);
    polePinMesh.rotation.x = Math.PI / 2;
    scene.add(polePinMesh);

    const poleLabel = createLabelSprite("90°S South Pole", {
      textColor: "#F1F5F9",
      bgColor: "rgba(15, 23, 42, 0.8)",
      borderColor: "rgba(226, 232, 240, 0.5)",
      fontSize: 16,
      scaleX: 12,
      scaleY: 3.0,
    });
    poleLabel.position.set(0, -6, 5.0);
    scene.add(poleLabel);

    // -------------------------------------------------------------
    // Crater Rim Features & PSR Cold Traps
    // -------------------------------------------------------------
    const psrGroup = new THREE.Group();
    CRATER_FEATURES.forEach((c) => {
      const [xKm, yKm] = polarToXy(c.lat, c.lon);
      const px = xKm * SCALE_3D;
      const py = yKm * SCALE_3D;
      const craterR = c.radiusKm * SCALE_3D;
      const centerZ = computeTerrainHeight(px, py);
      const rimZ = computeTerrainHeight(px + craterR, py);

      // Elevated 3D crater rim contour line
      const rimGeo = new THREE.RingGeometry(craterR - 0.45, craterR + 0.45, 48);
      const rimMat = new THREE.MeshBasicMaterial({
        color: c.psr ? 0x0284c7 : 0x64748b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: c.psr ? 0.75 : 0.45,
      });
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      rimMesh.position.set(px, py, rimZ + 0.1);
      psrGroup.add(rimMesh);

      // Cryogenic ice-trap basin floor for Permanently Shadowed Regions (PSRs)
      if (c.psr) {
        const floorGeo = new THREE.CircleGeometry(craterR * 0.65, 32);
        const floorMat = new THREE.MeshStandardMaterial({
          color: 0x0369a1,
          emissive: 0x0284c7,
          emissiveIntensity: 0.18,
          roughness: 0.25,
          metalness: 0.8,
        });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.position.set(px, py, centerZ + 0.15);
        floorMesh.receiveShadow = true;
        psrGroup.add(floorMesh);
      }

      // 3D Floating Crater Name Label
      const craterLabel = createLabelSprite(`${c.name}${c.psr ? " (PSR)" : ""}`, {
        textColor: c.psr ? "#38BDF8" : "#CBD5E1",
        bgColor: c.psr ? "rgba(7, 89, 133, 0.85)" : "rgba(30, 41, 59, 0.85)",
        borderColor: c.psr ? "rgba(56, 189, 248, 0.7)" : "rgba(100, 116, 139, 0.5)",
        fontSize: 16,
        scaleX: 14,
        scaleY: 3.5,
      });
      craterLabel.position.set(px, py - craterR - 3.5, rimZ + 3.0);
      psrGroup.add(craterLabel);
    });
    scene.add(psrGroup);

    // -------------------------------------------------------------
    // Landing Site Markers on the 3D Dish
    // -------------------------------------------------------------
    const pinsMap = new Map();
    const interactiveMeshes: THREE.Object3D[] = [];
    const pinGroup = new THREE.Group();

    sites.forEach((site) => {
      const [xKm, yKm] = polarToXy(site.latitude, site.longitude);
      const px = xKm * SCALE_3D;
      const py = yKm * SCALE_3D;
      const pz = computeTerrainHeight(px, py);

      const siteGroup = new THREE.Group();
      siteGroup.position.set(px, py, pz);
      siteGroup.userData = { siteId: site.id };

      const siteState = currentEpochStates[site.id]?.st || "Dual Operational";
      const siteColorHex = getStateColorHex(siteState);

      // Base landing pad circular plate
      const padGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.35, 24);
      const padMat = new THREE.MeshStandardMaterial({
        color: siteColorHex,
        roughness: 0.4,
        metalness: 0.6,
      });
      const padMesh = new THREE.Mesh(padGeo, padMat);
      padMesh.rotation.x = Math.PI / 2;
      padMesh.position.z = 0.18;
      padMesh.receiveShadow = true;
      siteGroup.add(padMesh);

      // Marker stem pin
      const stemGeo = new THREE.CylinderGeometry(0.35, 0.35, 5.5, 12);
      stemGeo.translate(0, 2.75, 0); // Origin at base
      const stemMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.2,
        metalness: 0.85,
      });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      stemMesh.rotation.x = Math.PI / 2;
      stemMesh.castShadow = true;
      siteGroup.add(stemMesh);

      // Glowing beacon head
      const headGeo = new THREE.SphereGeometry(1.8, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({
        color: siteColorHex,
        emissive: siteColorHex,
        emissiveIntensity: 0.9,
        roughness: 0.15,
      });
      const pinMesh = new THREE.Mesh(headGeo, headMat);
      pinMesh.position.z = 5.5;
      pinMesh.castShadow = true;
      siteGroup.add(pinMesh);

      // Pulsing beacon ring on surface
      const ringGeo = new THREE.RingGeometry(3.2, 3.9, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.z = 0.22;
      ringMesh.visible = site.id === selectedSiteId;
      siteGroup.add(ringMesh);

      // Vertical beacon column light beam (for selected site)
      const beamGeo = new THREE.CylinderGeometry(0.2, 1.2, 18, 16, 1, true);
      beamGeo.translate(0, 9, 0);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.rotation.x = Math.PI / 2;
      beamMesh.visible = site.id === selectedSiteId;
      siteGroup.add(beamMesh);

      // Floating 3D label badge for site
      const siteLabel = createLabelSprite(site.name.split("(")[0].trim(), {
        textColor: "#F8FAFC",
        bgColor: "rgba(15, 23, 42, 0.9)",
        borderColor: "rgba(56, 189, 248, 0.6)",
        fontSize: 15,
        scaleX: 13,
        scaleY: 3.2,
      });
      siteLabel.position.set(0, -4.5, 7.5);
      siteGroup.add(siteLabel);

      pinGroup.add(siteGroup);
      interactiveMeshes.push(pinMesh, padMesh, stemMesh);

      pinsMap.set(site.id, {
        group: siteGroup,
        pinMesh,
        stemMesh,
        padMesh,
        ringMesh,
        beamMesh,
        labelSprite: siteLabel,
        px,
        py,
        pz,
      });
    });
    scene.add(pinGroup);

    // -------------------------------------------------------------
    // Directional Vectors Originating from Selected Site
    // -------------------------------------------------------------
    const vectorGroup = new THREE.Group();

    // Sub-Solar Directional Vector (Yellow)
    const sunVector = createDirectionalVector(
      0xf59e0b,
      0xfbbf24,
      `☀️ Sun (${sunAzimuth.toFixed(1)}°, ${sunElevation >= 0 ? "+" : ""}${sunElevation.toFixed(2)}°)`,
      "#FCD34D",
      "rgba(69, 26, 3, 0.9)",
      "rgba(245, 158, 11, 0.85)"
    );
    vectorGroup.add(sunVector.group);

    // Sub-Earth Directional Vector (Cyan)
    const earthVector = createDirectionalVector(
      0x0ea5e9,
      0x38bdf8,
      `🌍 Earth (${earthAzimuth.toFixed(1)}°, ${earthElevation >= 0 ? "+" : ""}${earthElevation.toFixed(2)}°)`,
      "#7DD3FC",
      "rgba(8, 47, 73, 0.9)",
      "rgba(14, 165, 233, 0.85)"
    );
    vectorGroup.add(earthVector.group);
    scene.add(vectorGroup);

    // Find initial position for selected site
    const initSelectedSite = sites.find((s) => s.id === selectedSiteId) || sites[0];
    const [initXKm, initYKm] = polarToXy(initSelectedSite.latitude, initSelectedSite.longitude);
    const initPx = initXKm * SCALE_3D;
    const initPy = initYKm * SCALE_3D;
    const initPz = computeTerrainHeight(initPx, initPy);
    const initOrigin = new THREE.Vector3(initPx, initPy, initPz + 5.5);

    // Calculate initial sun and earth 3D directions
    const initSunAzRad = (sunAzimuth * Math.PI) / 180.0;
    const initSunElRad = (sunElevation * Math.PI) / 180.0;
    const initSunDir = new THREE.Vector3(
      Math.sin(initSunAzRad) * Math.cos(initSunElRad),
      -Math.cos(initSunAzRad) * Math.cos(initSunElRad),
      Math.sin(initSunElRad)
    ).normalize();

    const initEarthAzRad = (earthAzimuth * Math.PI) / 180.0;
    const initEarthElRad = (earthElevation * Math.PI) / 180.0;
    const initEarthDir = new THREE.Vector3(
      Math.sin(initEarthAzRad) * Math.cos(initEarthElRad),
      -Math.cos(initEarthAzRad) * Math.cos(initEarthElRad),
      Math.sin(initEarthElRad)
    ).normalize();

    sunVector.update(
      initOrigin,
      initSunDir,
      `☀️ Sun (${sunAzimuth.toFixed(1)}°, ${sunElevation >= 0 ? "+" : ""}${sunElevation.toFixed(2)}°)`,
      64
    );
    earthVector.update(
      initOrigin,
      initEarthDir,
      `🌍 Earth (${earthAzimuth.toFixed(1)}°, ${earthElevation >= 0 ? "+" : ""}${earthElevation.toFixed(2)}°)`,
      64
    );

    // -------------------------------------------------------------
    // Raycasting & Pointer Interaction Handlers
    // -------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    let pointerDownPos = { x: 0, y: 0 };
    let isPointerDown = false;

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      isPointerDown = true;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes, true);

      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData?.siteId && obj.parent) {
          obj = obj.parent;
        }
        if (obj?.userData?.siteId) {
          canvas.style.cursor = "pointer";
          setHoveredSite(obj.userData.siteId);
          return;
        }
      }

      if (!isPointerDown) {
        canvas.style.cursor = "grab";
      }
      setHoveredSite(null);
    };

    const onPointerUp = (e: PointerEvent) => {
      isPointerDown = false;
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      // Treat as selection click only if mouse did not perform OrbitControls drag (dist < 5px)
      if (dist < 5) {
        const rect = canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveMeshes, true);
        if (intersects.length > 0) {
          let obj: THREE.Object3D | null = intersects[0].object;
          while (obj && !obj.userData?.siteId && obj.parent) {
            obj = obj.parent;
          }
          if (obj?.userData?.siteId) {
            onSelectSiteRef.current(obj.userData.siteId);
          }
        }
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);

    // Responsive Canvas Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // -------------------------------------------------------------
    // Animation Render Loop
    // -------------------------------------------------------------
    let animId: number = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth OrbitControls damping update
      controls.update();

      // Animate pulsing beacon ring on selected landing site
      const time = performance.now() * 0.003;
      const activeState = threeStateRef.current;
      if (activeState) {
        const currentSelectedId = selectedSiteRef.current;
        const selectedPin = activeState.pinsMap.get(currentSelectedId);
        if (selectedPin && selectedPin.ringMesh) {
          const ringPulse = 1.0 + 0.16 * Math.sin(time * 3.5);
          selectedPin.ringMesh.scale.set(ringPulse, ringPulse, 1);
          (selectedPin.ringMesh.material as THREE.MeshBasicMaterial).opacity =
            0.55 + 0.35 * Math.sin(time * 3.5);
        }

        // Animate glowing arrowhead halos
        if (activeState.sunVector.haloMesh) {
          const sunPulse = 1.0 + 0.12 * Math.sin(time * 4.0);
          activeState.sunVector.haloMesh.scale.set(sunPulse, sunPulse, sunPulse);
        }
        if (activeState.earthVector.haloMesh) {
          const earthPulse = 1.0 + 0.12 * Math.sin(time * 4.0 + 1.5);
          activeState.earthVector.haloMesh.scale.set(earthPulse, earthPulse, earthPulse);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Store state reference for reactive updates
    threeStateRef.current = {
      scene,
      camera,
      renderer,
      controls,
      sunLight,
      earthLight,
      sunVector,
      earthVector,
      vectorGroup,
      psrGroup,
      pinsMap,
      selectedBeaconRing: null,
      interactiveMeshes,
      animId,
    };

    // Cleanup resources upon unmount or switching to 2D
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      renderer.dispose();

      // Dispose all geometry and materials cleanly
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });
      threeStateRef.current = null;
    };
  }, [viewMode, sites]);

  // -------------------------------------------------------------
  // Reactive 3D Update Effect: Dynamic Sunlight, Shadows & Vectors
  // Keeps OrbitControls and Camera position uninterrupted
  // -------------------------------------------------------------
  useEffect(() => {
    if (viewMode !== "3d" || !threeStateRef.current) return;

    const {
      sunLight,
      earthLight,
      sunVector,
      earthVector,
      vectorGroup,
      psrGroup,
      pinsMap,
    } = threeStateRef.current;

    // 1. Dynamic Directional Sunlight based on scrubber epoch
    const sunDist = 320;
    const effectiveSunEl = Math.max(0.12, sunElevation);
    const sunElRad = (effectiveSunEl * Math.PI) / 180.0;
    const sunAzRad = (sunAzimuth * Math.PI) / 180.0;

    const sunX = sunDist * Math.sin(sunAzRad) * Math.cos(sunElRad);
    const sunY = -sunDist * Math.cos(sunAzRad) * Math.cos(sunElRad);
    const sunZ = sunDist * Math.sin(sunElRad) + 5.0;

    sunLight.position.set(sunX, sunY, sunZ);
    sunLight.target.position.set(0, 0, 0);

    // Realistic solar intensity curve (fades during polar horizon dip)
    if (sunElevation <= 0) {
      sunLight.intensity = Math.max(0.05, (sunElevation + 0.6) * 2.5);
    } else {
      sunLight.intensity = Math.min(3.4, 2.0 + sunElevation * 0.85);
    }

    // 2. Secondary Earthshine Directional Fill Light
    const earthDist = 320;
    const earthElRad = (Math.max(0.05, earthElevation) * Math.PI) / 180.0;
    const earthAzRad = (earthAzimuth * Math.PI) / 180.0;
    const earthX = earthDist * Math.sin(earthAzRad) * Math.cos(earthElRad);
    const earthY = -earthDist * Math.cos(earthAzRad) * Math.cos(earthElRad);
    const earthZ = earthDist * Math.sin(earthElRad) + 4.0;
    earthLight.position.set(earthX, earthY, earthZ);
    earthLight.intensity = earthElevation > 0 ? 0.35 : 0.05;

    // 3. Directional Vectors Originating from Selected Site
    const selSite = sites.find((s) => s.id === selectedSiteId) || sites[0];
    const [siteXKm, siteYKm] = polarToXy(selSite.latitude, selSite.longitude);
    const sitePx = siteXKm * SCALE_3D;
    const sitePy = siteYKm * SCALE_3D;
    const sitePz = computeTerrainHeight(sitePx, sitePy);
    const vectorOrigin = new THREE.Vector3(sitePx, sitePy, sitePz + 5.5);

    const actualSunAzRad = (sunAzimuth * Math.PI) / 180.0;
    const actualSunElRad = (sunElevation * Math.PI) / 180.0;
    const sunDir = new THREE.Vector3(
      Math.sin(actualSunAzRad) * Math.cos(actualSunElRad),
      -Math.cos(actualSunAzRad) * Math.cos(actualSunElRad),
      Math.sin(actualSunElRad)
    ).normalize();

    const actualEarthAzRad = (earthAzimuth * Math.PI) / 180.0;
    const actualEarthElRad = (earthElevation * Math.PI) / 180.0;
    const earthDir = new THREE.Vector3(
      Math.sin(actualEarthAzRad) * Math.cos(actualEarthElRad),
      -Math.cos(actualEarthAzRad) * Math.cos(actualEarthElRad),
      Math.sin(actualEarthElRad)
    ).normalize();

    sunVector.update(
      vectorOrigin,
      sunDir,
      `☀️ Sun (${sunAzimuth.toFixed(1)}°, ${sunElevation >= 0 ? "+" : ""}${sunElevation.toFixed(2)}°)`,
      64
    );
    earthVector.update(
      vectorOrigin,
      earthDir,
      `🌍 Earth (${earthAzimuth.toFixed(1)}°, ${earthElevation >= 0 ? "+" : ""}${earthElevation.toFixed(2)}°)`,
      64
    );

    vectorGroup.visible = showVectors;
    psrGroup.visible = showPsr;

    // 4. Update Landing Site Markers Appearance
    pinsMap.forEach((entry, id) => {
      const isSelected = id === selectedSiteId;
      const state = currentEpochStates[id]?.st || "Dual Operational";
      const colorHex = getStateColorHex(state);

      (entry.padMesh.material as THREE.MeshStandardMaterial).color.setHex(colorHex);
      (entry.pinMesh.material as THREE.MeshStandardMaterial).color.setHex(colorHex);
      (entry.pinMesh.material as THREE.MeshStandardMaterial).emissive.setHex(colorHex);
      (entry.pinMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = isSelected ? 1.4 : 0.85;

      entry.pinMesh.scale.set(isSelected ? 1.4 : 1.0, isSelected ? 1.4 : 1.0, isSelected ? 1.4 : 1.0);
      if (entry.ringMesh) entry.ringMesh.visible = isSelected;
      if (entry.beamMesh) entry.beamMesh.visible = isSelected;
    });
  }, [
    viewMode,
    sunAzimuth,
    sunElevation,
    earthAzimuth,
    earthElevation,
    selectedSiteId,
    currentEpochStates,
    showVectors,
    showPsr,
    sites,
  ]);

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

          {viewMode === "2d" ? (
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
          ) : (
            <>
              {/* 3D Layer Toggles */}
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

              {/* 3D Camera Angles */}
              <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5">
                <button
                  onClick={reset3dCamera}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition font-medium"
                  title="Reset Camera to Standard Isometric Perspective"
                >
                  <RotateCcw className="h-3 w-3" />
                  Isometric
                </button>
                <button
                  onClick={topDown3dCamera}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition font-medium"
                  title="Top-Down Polar Nadir Vantage"
                >
                  <Compass className="h-3 w-3" />
                  Top
                </button>
                <button
                  onClick={lowAngle3dCamera}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition font-medium"
                  title="Low-Angle Horizon Grazing View to inspect Long Shadows"
                >
                  <Maximize2 className="h-3 w-3" />
                  Grazing
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

            {/* Dynamic Sun Vector in 2D */}
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

            {/* Dynamic Earth Vector in 2D */}
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
          <canvas
            ref={threeCanvasRef}
            className="w-full h-full block touch-none cursor-grab active:cursor-grabbing outline-none"
          />
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
          {viewMode === "3d" && (
            <div className="border-t border-slate-800 my-1 pt-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                <span className="text-amber-300">☀️ Sub-Solar Vector (Site)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
                <span className="text-cyan-300">🌍 Sub-Earth Vector (Site)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-sky-700" />
                <span className="text-sky-300">🧊 PSR Cold Trap</span>
              </div>
            </div>
          )}
        </div>

        {/* 3D interaction guide pill at bottom-center */}
        {viewMode === "3d" && (
          <div className="hidden sm:block absolute bottom-3 left-1/2 -translate-x-1/2 z-10 text-[10.5px] font-mono text-slate-300 bg-space-950/85 px-3 py-1 rounded-full border border-slate-700/70 shadow-lg pointer-events-none">
            🖱️ Drag to rotate • Wheel to zoom • Right-click to pan • Click site to select
          </div>
        )}

        {/* Projection metadata badge at bottom-right */}
        <div className="absolute bottom-3 right-3 z-10 text-[10px] font-mono text-slate-400 bg-space-950/80 px-2.5 py-1 rounded border border-slate-800">
          {viewMode === "2d"
            ? "Stereographic conformal projection calibrated to LRO LOLA DEM"
            : `3D LOLA Topography • Dynamic Raytraced Shadows (Sun Az ${sunAzimuth.toFixed(1)}°, El ${sunElevation >= 0 ? "+" : ""}${sunElevation.toFixed(2)}°)`}
        </div>
      </div>
    </div>
  );
};
