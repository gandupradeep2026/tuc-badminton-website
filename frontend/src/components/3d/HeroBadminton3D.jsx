import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Sparkles, Play, RotateCw, Eye, Zap } from 'lucide-react';
import { createShuttlecock, createRacket, generateCourtTexture } from './models3d';

export default function HeroBadminton3D({ className = '' }) {
  const mountRef = useRef(null);
  const [isSmashing, setIsSmashing] = useState(false);
  const [cameraMode, setCameraMode] = useState('dynamic'); // 'dynamic' | 'side' | 'top'
  const [autoRotate, setAutoRotate] = useState(true);
  const smashAnimRef = useRef({ active: false, progress: 0 });
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const triggerSmash = useCallback(() => {
    if (smashAnimRef.current.active) return;
    smashAnimRef.current = { active: true, progress: 0 };
    setIsSmashing(true);
    setTimeout(() => setIsSmashing(false), 900);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 340;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.4, 2.0, 3.8);
    camera.lookAt(0, 0.5, 0);

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
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup (Dramatic Stadium Look)
    const ambientLight = new THREE.AmbientLight(0xdcfce7, 0.7);
    scene.add(ambientLight);

    // Key Spotlight from above
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 6, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Emerald Rim Light
    const rimLight = new THREE.DirectionalLight(0x10b981, 2.5);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    // Cyan Fill Light
    const fillLight = new THREE.PointLight(0x38bdf8, 1.2, 10);
    fillLight.position.set(0, 1.5, 2.5);
    scene.add(fillLight);

    // 3. Mini Court Platform (Floor)
    const courtFloorGeo = new THREE.BoxGeometry(6.5, 0.08, 4.0);
    const courtMat = new THREE.MeshStandardMaterial({
      map: generateCourtTexture('green'),
      roughness: 0.65,
      metalness: 0.1,
    });
    const courtMesh = new THREE.Mesh(courtFloorGeo, courtMat);
    courtMesh.position.y = -0.55;
    courtMesh.receiveShadow = true;
    scene.add(courtMesh);

    // Shadow catcher contact plane
    const shadowPlaneGeo = new THREE.PlaneGeometry(8, 6);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.50;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 4. Shuttlecock
    const shuttlecock = createShuttlecock({ scale: 1.35 });
    shuttlecock.position.set(0, 0.55, 0);
    shuttlecock.rotation.z = -0.35;
    shuttlecock.rotation.x = 0.2;
    scene.add(shuttlecock);

    // 5. Racket in Strike Position
    const racket = createRacket({ scale: 0.52 });
    racket.position.set(-1.15, 0.9, -0.6);
    racket.rotation.set(0.4, 0.8, -0.6);
    scene.add(racket);

    // 6. Floating Ambient Particles (Speed sparks / stadium atmosphere)
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 6;
      particlePositions[i + 1] = Math.random() * 3 - 0.2;
      particlePositions[i + 2] = (Math.random() - 0.5) * 4;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.045,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 7. Shockwave Ring (for smash effect)
    const ringGeo = new THREE.RingGeometry(0.05, 0.12, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6ee7b7,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const shockwave = new THREE.Mesh(ringGeo, ringMat);
    shockwave.position.set(0, 0.55, 0);
    shockwave.rotation.x = Math.PI / 2;
    scene.add(shockwave);

    // Mouse movement listener
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = x * 0.8;
      mouseRef.current.targetY = y * 0.5;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Touch support
    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((touch.clientY - rect.top) / rect.height) * 2 - 1);
        mouseRef.current.targetX = x * 0.8;
        mouseRef.current.targetY = y * 0.5;
      }
    };
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Handle container resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const targetCameraPos = new THREE.Vector3();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Handle Smash Animation
      if (smashAnimRef.current.active) {
        smashAnimRef.current.progress += 0.035;
        const p = smashAnimRef.current.progress;

        if (p < 0.25) {
          // Wind up: Racket pulls back, shuttlecock hovers
          const subP = p / 0.25;
          racket.position.set(-1.15 - subP * 0.3, 0.9 + subP * 0.4, -0.6 - subP * 0.2);
          racket.rotation.z = -0.6 - subP * 0.5;
        } else if (p < 0.55) {
          // Strike & Launch!
          const subP = (p - 0.25) / 0.3;
          racket.position.set(-1.15 + subP * 0.9, 0.9 - subP * 0.3, -0.6 + subP * 0.5);
          racket.rotation.z = -1.1 + subP * 1.6;

          // Shuttlecock launches forward along arc
          shuttlecock.position.x = subP * 2.8;
          shuttlecock.position.y = 0.55 + Math.sin(subP * Math.PI) * 0.4 - subP * 0.3;
          shuttlecock.position.z = subP * 1.8;
          shuttlecock.rotation.y += 0.4;
          shuttlecock.rotation.x = 0.9;

          // Trigger shockwave ring
          shockwave.scale.set(1 + subP * 8, 1 + subP * 8, 1);
          shockwave.material.opacity = Math.max(0, 0.8 - subP * 0.8);
        } else if (p < 1.0) {
          // Return to home position smoothly
          const subP = (p - 0.55) / 0.45;
          const ease = 1 - Math.pow(1 - subP, 3);
          shuttlecock.position.lerp(new THREE.Vector3(0, 0.55, 0), ease * 0.15);
          racket.position.lerp(new THREE.Vector3(-1.15, 0.9, -0.6), ease * 0.15);
          racket.rotation.set(0.4, 0.8, -0.6);
          shuttlecock.rotation.set(0.2, elapsedTime * 0.5, -0.35);
          shockwave.material.opacity = 0;
        } else {
          // Done
          smashAnimRef.current.active = false;
          shuttlecock.position.set(0, 0.55, 0);
          racket.position.set(-1.15, 0.9, -0.6);
          racket.rotation.set(0.4, 0.8, -0.6);
          shockwave.material.opacity = 0;
        }
      } else {
        // Idle gentle breathing floating animation
        const floatY = Math.sin(elapsedTime * 2.2) * 0.08;
        shuttlecock.position.y = 0.55 + floatY;

        if (autoRotate) {
          shuttlecock.rotation.y = elapsedTime * 0.8;
          shuttlecock.rotation.x = 0.2 + Math.sin(elapsedTime * 1.5) * 0.05 + mouseRef.current.y * 0.3;
          shuttlecock.rotation.z = -0.35 + mouseRef.current.x * 0.3;
        } else {
          shuttlecock.rotation.y += (mouseRef.current.x * 1.5 - shuttlecock.rotation.y) * 0.05;
          shuttlecock.rotation.x = 0.2 + mouseRef.current.y * 0.4;
        }

        // Racket idle float
        racket.position.y = 0.9 + Math.sin(elapsedTime * 2.0 + 1.2) * 0.05;
        racket.rotation.z = -0.6 + Math.sin(elapsedTime * 1.8) * 0.04;
      }

      // Camera Position by Mode
      if (cameraMode === 'dynamic') {
        targetCameraPos.set(
          2.4 + mouseRef.current.x * 0.8,
          2.0 + mouseRef.current.y * 0.6,
          3.8 - mouseRef.current.y * 0.4
        );
      } else if (cameraMode === 'side') {
        targetCameraPos.set(4.2, 1.2, 0.2);
      } else if (cameraMode === 'top') {
        targetCameraPos.set(0.1, 4.8, 0.6);
      }

      camera.position.lerp(targetCameraPos, 0.05);
      camera.lookAt(0, 0.45, 0);

      // Particle subtle drifting
      const positions = particleSystem.geometry.attributes.position.array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        positions[i] += 0.003;
        if (positions[i] > 3.0) positions[i] = -0.2;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchmove', handleTouchMove);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [cameraMode, autoRotate]);

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-950/60 via-slate-900/80 to-[#003B23]/70 border border-emerald-500/20 shadow-2xl backdrop-blur-md ${className}`}>
      
      {/* 3D WebGL Canvas Viewport */}
      <div 
        ref={mountRef} 
        onClick={triggerSmash}
        className="w-full h-72 sm:h-84 md:h-96 cursor-grab active:cursor-grabbing relative select-none"
        title="Klicken zum Schmettern! / Click to Smash!"
      />

      {/* Floating 3D Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-emerald-300 text-[11px] font-bold">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>INTERACTIVE 3D BADMINTON</span>
      </div>

      {/* Control Bar Overlay */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 text-xs">
        
        {/* Smash Action Button */}
        <button
          type="button"
          onClick={triggerSmash}
          disabled={isSmashing}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>{isSmashing ? 'SMASHING! 💥' : 'SMASH! 🏸'}</span>
        </button>

        {/* Camera Angles Switcher */}
        <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setCameraMode('dynamic')}
            className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
              cameraMode === 'dynamic' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            3D
          </button>
          <button
            type="button"
            onClick={() => setCameraMode('side')}
            className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
              cameraMode === 'side' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            Rally
          </button>
          <button
            type="button"
            onClick={() => setCameraMode('top')}
            className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
              cameraMode === 'top' ? 'bg-white text-slate-900 shadow-xs' : 'text-white/80 hover:text-white'
            }`}
          >
            Top
          </button>
        </div>

        {/* Auto Rotate Toggle */}
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all border ${
            autoRotate
              ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
              : 'bg-white/5 border-white/10 text-white/70'
          }`}
          title="Auto 360° Rotation"
        >
          <RotateCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          <span>360°</span>
        </button>

      </div>

    </div>
  );
}
