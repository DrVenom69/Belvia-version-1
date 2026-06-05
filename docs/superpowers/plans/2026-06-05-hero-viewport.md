# Hero Viewport & 3D Customizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Hero 3D viewport to show two trending Spline scenes with sequential cross-fading and add a drag-and-drop feature to render custom models (.splinecode, .stl, .obj, .glb) with customizable material finishes and settings persisted in localStorage.

**Architecture:** Create a separate `Hero3DStage.tsx` component to handle 3D rendering (both `@splinetool/react-spline` and Three.js canvas dynamically). The parent `HeroSection.tsx` manages viewport layout, drag-and-drop file processing, timer-based active scene state, and the Admin Settings Panel.

**Tech Stack:** React (v19), Tailwind CSS, TypeScript, `@splinetool/react-spline`, `three` (Three.js), `lucide-react`.

---

### Task 1: Install 3D Viewport Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install `three` and its typescript typings**

Run: `npm install three && npm install -D @types/three`
Expected: Command completes successfully, adding packages to `dependencies` and `devDependencies` in `package.json`.

- [ ] **Step 2: Verify package installation**

Check that `dependencies` contains `"three"` and `devDependencies` contains `"@types/three"`.

- [ ] **Step 3: Commit package updates**

```bash
git add package.json package-lock.json
git commit -m "chore: install three.js dependencies for hybrid 3D rendering"
```

---

### Task 2: Create Modular 3D Rendering Component

**Files:**
- Create: [Hero3DStage.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/Hero3DStage.tsx)

- [ ] **Step 1: Implement `Hero3DStage.tsx`**
Create a new file `src/components/Hero3DStage.tsx` that dynamically renders either a Spline canvas or a custom Three.js renderer based on file type. It must handle `three` loader classes: `GLTFLoader`, `STLLoader`, and `OBJLoader`.

```tsx
import React, { useEffect, useRef, useState, Suspense, lazy } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface Hero3DStageProps {
  sceneUrl: string;
  isActive: boolean;
  materialType: string;
  onLoaded: () => void;
}

export default function Hero3DStage({ sceneUrl, isActive, materialType, onLoaded }: Hero3DStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const splineRef = useRef<any>(null);
  const [isSpline, setIsSpline] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check file type
  useEffect(() => {
    if (!sceneUrl) return;
    const isSplineFile = sceneUrl.includes('.splinecode') || (!sceneUrl.endsWith('.glb') && !sceneUrl.endsWith('.gltf') && !sceneUrl.endsWith('.stl') && !sceneUrl.endsWith('.obj'));
    setIsSpline(isSplineFile);
  }, [sceneUrl]);

  // Three.js Logic for GLB / STL / OBJ
  useEffect(() => {
    if (isSpline || !containerRef.current) return;
    
    let scene = new THREE.Scene();
    scene.background = null; // transparent background

    // Camera
    let camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 10);

    // Renderer
    let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Controls
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf5af19, 0.5); // Brand gold light
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // Setup material based on preference
    let customMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.2
    });

    if (materialType === 'Reflective Gold Chrome') {
      customMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5af19, // Gold
        roughness: 0.08,
        metalness: 0.95,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
      });
    } else if (materialType === 'Ghost Glass (Semi-Transparent)') {
      customMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.9,
        opacity: 0.35,
        transparent: true
      });
    } else if (materialType === 'Cyberpunk Hologram Wireframe') {
      customMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5af19,
        wireframe: true,
        emissive: new THREE.Color(0xf5af19),
        emissiveIntensity: 0.5
      });
    }

    let loadedObject: THREE.Object3D | null = null;

    const applyMaterial = (object: THREE.Object3D) => {
      if (materialType === 'Original Embedded Textures') return;
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = customMaterial;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    };

    const centerAndScaleObject = (object: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Center
      object.position.x += (object.position.x - center.x);
      object.position.y += (object.position.y - center.y);
      object.position.z += (object.position.z - center.z);

      // Scale
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 4.0;
      const scale = targetSize / maxDim;
      object.scale.set(scale, scale, scale);

      scene.add(object);
      loadedObject = object;
      onLoaded();
    };

    // Loaders
    const ext = sceneUrl.split('.').pop()?.toLowerCase();
    if (ext === 'stl') {
      const loader = new STLLoader();
      loader.load(sceneUrl, (geometry) => {
        const mesh = new THREE.Mesh(geometry, customMaterial);
        centerAndScaleObject(mesh);
      }, undefined, (err) => setError('Failed to load STL file.'));
    } else if (ext === 'obj') {
      const loader = new OBJLoader();
      loader.load(sceneUrl, (obj) => {
        applyMaterial(obj);
        centerAndScaleObject(obj);
      }, undefined, (err) => setError('Failed to load OBJ file.'));
    } else if (ext === 'glb' || ext === 'gltf' || sceneUrl.startsWith('blob:')) {
      const loader = new GLTFLoader();
      loader.load(sceneUrl, (gltf) => {
        applyMaterial(gltf.scene);
        centerAndScaleObject(gltf.scene);
      }, undefined, (err) => {
        // Fallback for blobs that might be OBJ or STL renamed, or general load error
        setError('Failed to load GLTF model.');
      });
    }

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (loadedObject) {
        loadedObject.rotation.y += 0.005; // Gentle auto-rotate
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [sceneUrl, isSpline, materialType]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4 bg-bg-surface/50 text-red-400 font-mono text-[10px]">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
        isActive ? 'opacity-100 scale-100 filter-none pointer-events-auto' : 'opacity-0 scale-95 blur-md pointer-events-none'
      }`}
    >
      {isSpline && (
        <Suspense fallback={<div className="absolute inset-0 bg-[#080c14] animate-pulse" />}>
          <Spline
            scene={sceneUrl}
            onLoad={onLoaded}
            style={{ width: '100%', height: '100%' }}
          />
        </Suspense>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit `Hero3DStage.tsx`**

```bash
git add src/components/Hero3DStage.tsx
git commit -m "feat: implement dynamic Hero3DStage renderer for Spline and Three.js"
```

---

### Task 3: Redesign `HeroSection.tsx` & Integrate Settings Panel

**Files:**
- Modify: [HeroSection.tsx](file:///g:/Antigravity%20Projects/Belvia%20version%201/src/components/HeroSection.tsx)

- [ ] **Step 1: Redesign `HeroSection.tsx`**
Replace the content of `src/components/HeroSection.tsx` to include the settings configuration, timer switching logic, drag-and-drop file ingestion, and layout styling.

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, UploadCloud, Cpu, Settings, RefreshCw, X, Check, HelpCircle } from 'lucide-react';
import Hero3DStage from './Hero3DStage';

interface HeroSectionProps {
  onStartShopping: () => void;
  onGoToCustom: () => void;
}

interface ViewportConfig {
  scene1: string;
  scene2: string;
  switchDelay: number;
  material: string;
  bypassMobilePerformance: boolean;
}

const DEFAULT_CONFIG: ViewportConfig = {
  scene1: 'https://prod.spline.design/0Gj5CX-AhI9UHZgU/scene.splinecode',
  scene2: 'https://prod.spline.design/BeGRGjuilCpu6coy/scene.splinecode',
  switchDelay: 6,
  material: 'Matte Slate / Carbon',
  bypassMobilePerformance: false
};

export default function HeroSection({ onStartShopping, onGoToCustom }: HeroSectionProps) {
  const [config, setConfig] = useState<ViewportConfig>(DEFAULT_CONFIG);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [loadedScenes, setLoadedScenes] = useState<Record<number, boolean>>({});
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Form states for Admin panel
  const [formScene1, setFormScene1] = useState(DEFAULT_CONFIG.scene1);
  const [formScene2, setFormScene2] = useState(DEFAULT_CONFIG.scene2);
  const [formSwitchDelay, setFormSwitchDelay] = useState(DEFAULT_CONFIG.switchDelay);
  const [formMaterial, setFormMaterial] = useState(DEFAULT_CONFIG.material);
  const [formBypassMobile, setFormBypassMobile] = useState(DEFAULT_CONFIG.bypassMobilePerformance);

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // Load persisted configuration on mount
  useEffect(() => {
    const saved = localStorage.getItem('belvia_hero_viewport_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
        setFormScene1(parsed.scene1 || DEFAULT_CONFIG.scene1);
        setFormScene2(parsed.scene2 || DEFAULT_CONFIG.scene2);
        setFormSwitchDelay(parsed.switchDelay || DEFAULT_CONFIG.switchDelay);
        setFormMaterial(parsed.material || DEFAULT_CONFIG.material);
        setFormBypassMobile(parsed.bypassMobilePerformance ?? DEFAULT_CONFIG.bypassMobilePerformance);
      } catch (e) {
        console.error('Failed to load local viewport config', e);
      }
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Timer loop for switching active scene
  useEffect(() => {
    if (isAdminOpen) return; // Freeze transitions while configuring
    const interval = setInterval(() => {
      setActiveSceneIndex((prev) => (prev === 0 ? 1 : 0));
    }, config.switchDelay * 1000);

    return () => clearInterval(interval);
  }, [config.switchDelay, isAdminOpen]);

  const saveConfig = (newConfig: Partial<ViewportConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    localStorage.setItem('belvia_hero_viewport_config', JSON.stringify(updated));
    setLoadedScenes({}); // Reset loaded markers to trigger re-rendering
  };

  const handleAdminSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig({
      scene1: formScene1,
      scene2: formScene2,
      switchDelay: formSwitchDelay,
      material: formMaterial,
      bypassMobilePerformance: formBypassMobile
    });
    setIsAdminOpen(false);
  };

  const handleReset = () => {
    setFormScene1(DEFAULT_CONFIG.scene1);
    setFormScene2(DEFAULT_CONFIG.scene2);
    setFormSwitchDelay(DEFAULT_CONFIG.switchDelay);
    setFormMaterial(DEFAULT_CONFIG.material);
    setFormBypassMobile(DEFAULT_CONFIG.bypassMobilePerformance);
    saveConfig(DEFAULT_CONFIG);
  };

  // Drag & Drop Handling for files
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File, index: 0 | 1) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'splinecode' && ext !== 'stl' && ext !== 'obj' && ext !== 'glb' && ext !== 'gltf') {
      alert('Invalid file format. Upload .splinecode, .stl, .obj, or .glb/.gltf.');
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    if (index === 0) {
      setFormScene1(blobUrl);
      saveConfig({ scene1: blobUrl });
    } else {
      setFormScene2(blobUrl);
      saveConfig({ scene2: blobUrl });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], activeSceneIndex as 0 | 1);
    }
  };

  const show3D = !isMobile || config.bypassMobilePerformance;

  return (
    <section id="belvia-hero" className="relative overflow-hidden pt-12 pb-20 md:py-24 bg-bg-base border-b border-bg-elevated/40">
      {/* Background radial brand glows */}
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-5 space-y-8 text-left">
            <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold tracking-widest text-accent bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full shadow-sm">
              <Cpu className="w-3.5 h-3.5" />
              <span>Additive Precision Farm</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-tight">
              3D Printed <br />
              <span className="text-accent font-black">
                Masterpieces
              </span><br />
              &amp; Custom STL Slicing
            </h1>

            <p className="text-gray-400 text-sm leading-relaxed max-w-lg font-mono">
              Welcome to Belvia. Explore our trending MakerWorld-inspired catalogue, or upload your own model for instant materials matching and automated print-on-demand services.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                id="hero-shop-cta"
                onClick={onStartShopping}
                className="flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-text-on-accent font-black shadow-lg shadow-accent/10 cursor-pointer transition-all duration-300 group text-xs tracking-wider"
              >
                <span>BROWSE READY PRINTS</span>
                <ArrowRight className="w-4 h-4 text-text-on-accent font-bold group-hover:translate-x-1.5 transition-transform" />
              </button>
              
              <button
                id="hero-custom-cta"
                onClick={onGoToCustom}
                className="flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl bg-[#0d1322] border border-bg-elevated hover:border-accent hover:bg-bg-elevated text-gray-200 hover:text-white font-mono text-xs cursor-pointer transition-all duration-300"
              >
                <UploadCloud className="w-4 h-4 text-accent" />
                <span>UPLOAD CUSTOM STL</span>
              </button>
            </div>
          </div>

          {/* Right Visual Platform */}
          <div className="lg:col-span-7 flex justify-center items-center relative">
            <div
              id="spline-viewport-container"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`w-full max-w-2xl aspect-square md:aspect-[4/3] rounded-3xl bg-bg-surface/30 border relative flex items-center justify-center p-0 overflow-hidden shadow-2xl transition-all duration-300 ${
                dragActive ? 'border-accent bg-accent/5 scale-[1.01]' : 'border-bg-elevated hover:border-accent/20'
              }`}
            >
              {/* Settings gear button */}
              <button
                onClick={() => setIsAdminOpen(true)}
                className="absolute top-4 right-4 z-30 p-2.5 rounded-xl bg-bg-surface/80 border border-bg-elevated text-gray-400 hover:text-accent hover:border-accent/40 cursor-pointer transition shadow-md backdrop-blur-md"
                title="Viewport Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Scene Indicator Dots */}
              <div className="absolute bottom-4 left-6 z-30 flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full transition-all duration-300 ${activeSceneIndex === 0 ? 'bg-accent w-4' : 'bg-gray-700'}`} />
                <span className={`w-2 h-2 rounded-full transition-all duration-300 ${activeSceneIndex === 1 ? 'bg-accent w-4' : 'bg-gray-700'}`} />
                <span className="font-mono text-[9px] text-gray-500 tracking-wider uppercase ml-2">
                  {show3D ? '3D VIEWPORT LIVE' : 'PREVIEW STAGE'}
                </span>
              </div>

              {/* Drag overlay hint */}
              {dragActive && (
                <div className="absolute inset-0 z-20 bg-bg-base/85 flex flex-col items-center justify-center space-y-3 pointer-events-none animate-in fade-in duration-200">
                  <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
                    <UploadCloud className="w-7 h-7 text-accent animate-bounce" />
                  </div>
                  <p className="text-gray-200 text-xs font-mono">
                    Drop to load on Scene {activeSceneIndex + 1}
                  </p>
                </div>
              )}

              {/* 3D viewports */}
              {show3D ? (
                <>
                  <Hero3DStage
                    sceneUrl={config.scene1}
                    isActive={activeSceneIndex === 0}
                    materialType={config.material}
                    onLoaded={() => setLoadedScenes((prev) => ({ ...prev, 0: true }))}
                  />
                  <Hero3DStage
                    sceneUrl={config.scene2}
                    isActive={activeSceneIndex === 1}
                    materialType={config.material}
                    onLoaded={() => setLoadedScenes((prev) => ({ ...prev, 1: true }))}
                  />
                </>
              ) : (
                /* Fallback Stage for Mobile */
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-bg-surface/20 to-bg-base text-center space-y-4">
                  <div className="w-24 h-24 border border-accent/20 rounded-2xl bg-bg-surface flex items-center justify-center relative">
                    <div className="absolute inset-2 border border-accent/5 rounded-xl animate-pulse" />
                    <Cpu className="w-10 h-10 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-white text-xs font-mono font-bold uppercase tracking-widest">Interactive 3D Preview</h3>
                    <p className="text-gray-500 text-[10px] mt-1 font-mono max-w-xs mx-auto">
                      Heavy 3D rendering bypassed to preserve mobile performance. Customize URLs and materials in the settings panel.
                    </p>
                  </div>
                </div>
              )}

              {/* Loading progress overlay */}
              {!loadedScenes[activeSceneIndex] && show3D && (
                <div className="absolute inset-0 bg-[#080c14] flex items-center justify-center z-10 transition-opacity duration-300">
                  <div className="flex flex-col items-center space-y-3 font-mono text-[9px] text-gray-500 tracking-wider">
                    <RefreshCw className="w-5 h-5 text-accent animate-spin" />
                    <span>SYNCHRONIZING 3D ASSETS...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Admin settings modal */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#16112b] border border-bg-elevated rounded-2xl p-6 relative shadow-2xl text-left">
            <button
              onClick={() => setIsAdminOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-bg-elevated transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-extrabold text-base text-white mb-6 flex items-center space-x-2">
              <Settings className="w-4 h-4 text-accent animate-[spin_5s_linear_infinite]" />
              <span>Viewport Configuration</span>
            </h3>

            <form onSubmit={handleAdminSave} className="space-y-4 font-mono text-xs text-gray-300">
              {/* Scene 1 URL / file input */}
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 flex justify-between">
                  <span>Scene 1 Spline or Model Source:</span>
                  <span onClick={() => fileInputRef1.current?.click()} className="text-accent hover:underline cursor-pointer">Upload local file</span>
                </label>
                <input
                  ref={fileInputRef1}
                  type="file"
                  accept=".splinecode,.stl,.obj,.glb,.gltf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0], 0)}
                />
                <input
                  type="text"
                  value={formScene1}
                  onChange={(e) => setFormScene1(e.target.value)}
                  className="w-full bg-bg-base text-gray-200 border border-bg-elevated rounded-xl py-2.5 px-3 text-xs focus:border-accent"
                />
              </div>

              {/* Scene 2 URL / file input */}
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 flex justify-between">
                  <span>Scene 2 Spline or Model Source:</span>
                  <span onClick={() => fileInputRef2.current?.click()} className="text-accent hover:underline cursor-pointer">Upload local file</span>
                </label>
                <input
                  ref={fileInputRef2}
                  type="file"
                  accept=".splinecode,.stl,.obj,.glb,.gltf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0], 1)}
                />
                <input
                  type="text"
                  value={formScene2}
                  onChange={(e) => setFormScene2(e.target.value)}
                  className="w-full bg-bg-base text-gray-200 border border-bg-elevated rounded-xl py-2.5 px-3 text-xs focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Switch delay */}
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                    Rotate Interval (sec):
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={formSwitchDelay}
                    onChange={(e) => setFormSwitchDelay(Number(e.target.value))}
                    className="w-full bg-bg-base text-gray-200 border border-bg-elevated rounded-xl py-2 px-3 text-xs focus:border-accent text-center"
                  />
                </div>

                {/* Material Dropdown */}
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">
                    Upload Material Finish:
                  </label>
                  <select
                    value={formMaterial}
                    onChange={(e) => setFormMaterial(e.target.value)}
                    className="w-full bg-bg-base text-gray-200 border border-bg-elevated rounded-xl py-2 px-3 text-xs focus:border-accent"
                  >
                    <option>Reflective Gold Chrome</option>
                    <option>Matte Slate / Carbon</option>
                    <option>Ghost Glass (Semi-Transparent)</option>
                    <option>Cyberpunk Hologram Wireframe</option>
                    <option>Original Embedded Textures</option>
                  </select>
                </div>
              </div>

              {/* Mobile override */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="bypass-mobile"
                  checked={formBypassMobile}
                  onChange={(e) => setFormBypassMobile(e.target.checked)}
                  className="rounded border-bg-elevated bg-bg-base text-accent focus:ring-accent"
                />
                <label htmlFor="bypass-mobile" className="text-gray-400 select-none cursor-pointer">
                  Bypass mobile performance restriction
                </label>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between border-t border-bg-elevated/40 pt-4 mt-6">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl border border-gray-700 hover:border-white text-gray-400 hover:text-white cursor-pointer transition"
                >
                  Reset Defaults
                </button>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAdminOpen(false)}
                    className="px-4 py-2 rounded-xl bg-bg-elevated text-gray-300 hover:text-white cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-text-on-accent font-bold cursor-pointer transition shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Settings</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Verify compiling and commit `HeroSection.tsx`**
Run: `npm run build`
Expected: Build compiles successfully.

Stage and commit changes:
```bash
git add src/components/HeroSection.tsx
git commit -m "feat: complete HeroSection redesign with Admin Settings, timer switching, and drag-and-drop support"
```

---

### Task 4: Visual Verification & Test Suite

- [ ] **Step 1: Start local development check**
Verify the dev server is active and check the layout at `http://localhost:3000`.

- [ ] **Step 2: Verify manual interaction**
Confirm that the settings panel appears when clicking the gear overlay, changing switch time works, and dropping local files renders correctly.
