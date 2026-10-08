import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { 
  Maximize2, 
  RotateCcw, 
  Layers, 
  Info, 
  Palette, 
  CheckCircle2,
  Eye,
  Sliders
} from 'lucide-react';
import { createCourtScene, createShuttlecock } from './models3d';

export default function BadmintonCourtViewer3D({ className = '' }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);
  const courtMeshGroupRef = useRef(null);

  // User Interactive Settings
  const [theme, setTheme] = useState('green'); // 'green' | 'blue' | 'wood'
  const [activeZone, setActiveZone] = useState('all'); // 'all' | 'singles' | 'doubles' | 'service' | 'fault'
  const [showShuttlecock, setShowShuttlecock] = useState(true);
  const [cameraPreset, setCameraPreset] = useState('isometric');

  const highlightMeshesRef = useRef([]);

  // Create or update zone highlight overlay planes
  const updateZoneHighlights = (scene, zone) => {
    // Remove existing
    highlightMeshesRef.current.forEach(m => scene.remove(m));
    highlightMeshesRef.current = [];

    if (zone === 'all') return;

    // Scale factors: Court is 13.4m (x from -6.7 to +6.7), 6.1m wide (z from -3.05 to +3.05)
    // Singles: z from -2.59 to +2.59 (5.18m wide)
    // Short service line: x = ±1.98
    // Doubles long service line: x = ±(6.7 - 0.76) = ±5.94
    // Centerline: z = 0

    if (zone === 'singles') {
      // Highlight singles court (13.4m x 5.18m)
      const geo = new THREE.PlaneGeometry(13.4, 5.18);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.01;
      scene.add(mesh);
      highlightMeshesRef.current.push(mesh);
    } else if (zone === 'doubles') {
      // Highlight full doubles court (13.4m x 6.10m)
      const geo = new THREE.PlaneGeometry(13.4, 6.10);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.01;
      scene.add(mesh);
      highlightMeshesRef.current.push(mesh);
    } else if (zone === 'service') {
      // Highlight Right Service Box on right half: x from 1.98 to 6.7, z from 0 to 2.59
      const widthX = 6.7 - 1.98; // 4.72m
      const widthZ = 2.59;
      const geo = new THREE.PlaneGeometry(widthX, widthZ);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(1.98 + widthX / 2, 0.01, widthZ / 2);
      scene.add(mesh);
      highlightMeshesRef.current.push(mesh);

      // And corresponding receiver box on left half: x from -6.7 to -1.98, z from -2.59 to 0
      const mesh2 = new THREE.Mesh(geo, mat);
      mesh2.rotation.x = -Math.PI / 2;
      mesh2.position.set(-(1.98 + widthX / 2), 0.01, -widthZ / 2);
      scene.add(mesh2);
      highlightMeshesRef.current.push(mesh2);
    } else if (zone === 'fault') {
      // Non-service zone near net: x from -1.98 to +1.98, full width 6.10
      const geo = new THREE.PlaneGeometry(3.96, 6.10);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, 0.01, 0);
      scene.add(mesh);
      highlightMeshesRef.current.push(mesh);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(11, 8.5, 9);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // don't go below floor
    controls.minDistance = 3.5;
    controls.maxDistance = 26;
    controls.target.set(0, 0.8, 0);
    controlsRef.current = controls;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(8, 14, 6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x6ee7b7, 0.8);
    fillLight.position.set(-8, 6, -6);
    scene.add(fillLight);

    // 5. Build Court
    const court = createCourtScene({ theme });
    courtMeshGroupRef.current = court;
    scene.add(court);

    // 6. Optional Shuttlecock in mid-air
    let shuttleMesh = null;
    if (showShuttlecock) {
      shuttleMesh = createShuttlecock({ scale: 0.85 });
      shuttleMesh.position.set(2.4, 2.1, 0.8);
      shuttleMesh.rotation.set(0.6, 0.4, -0.8);
      scene.add(shuttleMesh);
    }

    // 7. Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 8. Animation Loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();

      if (shuttleMesh) {
        shuttleMesh.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      controls.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [theme, showShuttlecock]);

  // Update highlights when activeZone changes
  useEffect(() => {
    if (sceneRef.current) {
      updateZoneHighlights(sceneRef.current, activeZone);
    }
  }, [activeZone]);

  // Camera Presets
  const setPresetAngle = (preset) => {
    setCameraPreset(preset);
    if (!cameraRef.current || !controlsRef.current) return;

    if (preset === 'isometric') {
      cameraRef.current.position.set(11, 8.5, 9);
      controlsRef.current.target.set(0, 0.8, 0);
    } else if (preset === 'top') {
      cameraRef.current.position.set(0.1, 16.5, 0.1);
      controlsRef.current.target.set(0, 0, 0);
    } else if (preset === 'baseline') {
      // Standing on the baseline looking toward net
      cameraRef.current.position.set(-8.2, 1.8, 0);
      controlsRef.current.target.set(0, 1.2, 0);
    } else if (preset === 'net') {
      cameraRef.current.position.set(0.5, 2.4, 4.2);
      controlsRef.current.target.set(0, 1.5, 0);
    }
    controlsRef.current.update();
  };

  return (
    <div className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden ${className}`}>
      
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-display font-black text-slate-900 dark:text-white text-base sm:text-lg">
              3D Spielfeld & Taktik Visualizer / Court Explorer
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Offizielle BWF Maße (13,40m × 6,10m) in interaktiver 3D-Ansicht frei drehen & erkunden.
          </p>
        </div>

        {/* View presets */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setPresetAngle('isometric')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              cameraPreset === 'isometric'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            3D Iso
          </button>
          <button
            type="button"
            onClick={() => setPresetAngle('top')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              cameraPreset === 'top'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Vogelperspektive
          </button>
          <button
            type="button"
            onClick={() => setPresetAngle('baseline')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              cameraPreset === 'baseline'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Grundlinie (Spieler)
          </button>
          <button
            type="button"
            onClick={() => setPresetAngle('net')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              cameraPreset === 'net'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Netzkante (1,55m)
          </button>
        </div>
      </div>

      {/* 3D Canvas Box */}
      <div className="relative w-full h-[360px] sm:h-[440px] md:h-[500px] bg-gradient-to-b from-slate-900 to-slate-950 select-none">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Floating Instruction */}
        <div className="pointer-events-none absolute top-3 left-3 z-10 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white/80 text-[11px] font-medium border border-white/10 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ziehen: 360° drehen • Scrollen: Zoom • Rechtsklick: Verschieben</span>
        </div>

        {/* Theme & Highlight Toolbar (Floating bottom right) */}
        <div className="absolute bottom-3 right-3 left-3 sm:left-auto z-10 flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-black/65 backdrop-blur-md border border-white/15 text-xs text-white">
          
          {/* Court Color Selector */}
          <div className="flex items-center gap-1 border-r border-white/20 pr-2">
            <span className="text-[10px] text-white/60 font-bold uppercase mr-1 hidden sm:inline">Belag:</span>
            <button
              type="button"
              onClick={() => setTheme('green')}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                theme === 'green' ? 'border-white scale-110' : 'border-transparent opacity-70'
              }`}
              style={{ backgroundColor: '#006B3F' }}
              title="TUC Grün"
            />
            <button
              type="button"
              onClick={() => setTheme('blue')}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                theme === 'blue' ? 'border-white scale-110' : 'border-transparent opacity-70'
              }`}
              style={{ backgroundColor: '#1E40AF' }}
              title="BWF Blau"
            />
            <button
              type="button"
              onClick={() => setTheme('wood')}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                theme === 'wood' ? 'border-white scale-110' : 'border-transparent opacity-70'
              }`}
              style={{ backgroundColor: '#C89357' }}
              title="Hallenparkett"
            />
          </div>

          {/* Zones Highlighting */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveZone('all')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeZone === 'all' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Komplett
            </button>
            <button
              type="button"
              onClick={() => setActiveZone('singles')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeZone === 'singles' ? 'bg-sky-400 text-slate-950 font-black' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Einzel (5,18m)
            </button>
            <button
              type="button"
              onClick={() => setActiveZone('doubles')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeZone === 'doubles' ? 'bg-emerald-400 text-slate-950 font-black' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Doppel (6,10m)
            </button>
            <button
              type="button"
              onClick={() => setActiveZone('service')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeZone === 'service' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Aufschlagfeld
            </button>
            <button
              type="button"
              onClick={() => setActiveZone('fault')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeZone === 'fault' ? 'bg-rose-500 text-white font-black' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Netzzone (1,98m)
            </button>
          </div>

        </div>
      </div>

      {/* Official Court Dimensions Info Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-950 text-center p-3 text-xs">
        <div className="p-2">
          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Gesamtlänge</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-sm">13,40 m</span>
        </div>
        <div className="p-2">
          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Doppel / Einzel Breite</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-sm">6,10 m / 5,18 m</span>
        </div>
        <div className="p-2">
          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Netzhöhe Pfosten / Mitte</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-sm">1,55 m / 1,524 m</span>
        </div>
        <div className="p-2">
          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Kurze Aufschlaglinie</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-sm">1,98 m vom Netz</span>
        </div>
      </div>

    </div>
  );
}
