import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, UploadCloud, Cpu, Settings, RefreshCw, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import Hero3DStage from './Hero3DStage';

interface HeroSectionProps {
  onStartShopping: () => void;
  onGoToCustom: () => void;
}

interface ViewportConfig {
  scene1: string;
  scene2: string;
  scene3: string;
  switchDelay: number;
  material: string;
  removeSplineBg: boolean;
  bypassMobilePerformance: boolean;
}

const DEFAULT_CONFIG: ViewportConfig = {
  scene1: 'https://prod.spline.design/0Gj5CX-AhI9UHZgU/scene.splinecode',
  scene2: 'https://prod.spline.design/BeGRGjuilCpu6coy/scene.splinecode',
  scene3: 'https://prod.spline.design/BeGRGjuilCpu6coy/scene.splinecode',
  switchDelay: 6,
  material: 'Matte Slate / Carbon',
  removeSplineBg: true,
  bypassMobilePerformance: false
};

export default function HeroSection({ onStartShopping, onGoToCustom }: HeroSectionProps) {
  const [config, setConfig] = useState<ViewportConfig>(DEFAULT_CONFIG);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [loadedScenes, setLoadedScenes] = useState<Record<number, boolean>>({});
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [dragActiveIndex, setDragActiveIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Form states for Admin panel
  const [formScene1, setFormScene1] = useState(DEFAULT_CONFIG.scene1);
  const [formScene2, setFormScene2] = useState(DEFAULT_CONFIG.scene2);
  const [formScene3, setFormScene3] = useState(DEFAULT_CONFIG.scene3);
  const [formSwitchDelay, setFormSwitchDelay] = useState(DEFAULT_CONFIG.switchDelay);
  const [formMaterial, setFormMaterial] = useState(DEFAULT_CONFIG.material);
  const [formRemoveBg, setFormRemoveBg] = useState(DEFAULT_CONFIG.removeSplineBg);
  const [formBypassMobile, setFormBypassMobile] = useState(DEFAULT_CONFIG.bypassMobilePerformance);

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const fileInputRef3 = useRef<HTMLInputElement>(null);

  // Load persisted configuration on mount
  useEffect(() => {
    const saved = localStorage.getItem('belvia_hero_viewport_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
        setFormScene1(parsed.scene1 || DEFAULT_CONFIG.scene1);
        setFormScene2(parsed.scene2 || DEFAULT_CONFIG.scene2);
        setFormScene3(parsed.scene3 || DEFAULT_CONFIG.scene3);
        setFormSwitchDelay(parsed.switchDelay || DEFAULT_CONFIG.switchDelay);
        setFormMaterial(parsed.material || DEFAULT_CONFIG.material);
        setFormRemoveBg(parsed.removeSplineBg ?? DEFAULT_CONFIG.removeSplineBg);
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
      setActiveSceneIndex((prev) => (prev + 1) % 3);
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
      scene3: formScene3,
      switchDelay: formSwitchDelay,
      material: formMaterial,
      removeSplineBg: formRemoveBg,
      bypassMobilePerformance: formBypassMobile
    });
    setIsAdminOpen(false);
  };

  const handleReset = () => {
    setFormScene1(DEFAULT_CONFIG.scene1);
    setFormScene2(DEFAULT_CONFIG.scene2);
    setFormScene3(DEFAULT_CONFIG.scene3);
    setFormSwitchDelay(DEFAULT_CONFIG.switchDelay);
    setFormMaterial(DEFAULT_CONFIG.material);
    setFormRemoveBg(DEFAULT_CONFIG.removeSplineBg);
    setFormBypassMobile(DEFAULT_CONFIG.bypassMobilePerformance);
    saveConfig(DEFAULT_CONFIG);
  };

  // Drag & Drop Handling for files
  const handleDrag = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActiveIndex(index);
    } else if (e.type === 'dragleave') {
      setDragActiveIndex(null);
    }
  };

  const processFile = (file: File, index: number) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'splinecode' && ext !== 'stl' && ext !== 'obj' && ext !== 'glb' && ext !== 'gltf') {
      alert('Invalid file format. Upload .splinecode, .stl, .obj, or .glb/.gltf.');
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    if (index === 0) {
      setFormScene1(blobUrl);
      saveConfig({ scene1: blobUrl });
    } else if (index === 1) {
      setFormScene2(blobUrl);
      saveConfig({ scene2: blobUrl });
    } else {
      setFormScene3(blobUrl);
      saveConfig({ scene3: blobUrl });
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveIndex(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], index);
    }
  };

  const nextScene = () => {
    setActiveSceneIndex((prev) => (prev + 1) % 3);
  };

  const prevScene = () => {
    setActiveSceneIndex((prev) => (prev - 1 + 3) % 3);
  };

  const show3D = !isMobile || config.bypassMobilePerformance;

  // Retrieve details per slot
  const getSlotDetails = (index: number) => {
    let url = config.scene1;
    if (index === 1) url = config.scene2;
    if (index === 2) url = config.scene3;

    // Calculate relative layout offsets for the 3 slots
    let offset = index - activeSceneIndex;
    if (offset > 1) offset -= 3;
    if (offset < -1) offset += 3;

    return { url, offset };
  };

  // Maps offsets (-1, 0, 1) to transition positioning, scales, and blur classes
  const getSlotClasses = (offset: number) => {
    if (offset === 0) {
      // Center Active Slot
      return 'absolute w-full md:w-[60%] h-full z-20 scale-100 opacity-100 transition-all duration-700 ease-out border border-accent/25 rounded-3xl bg-bg-surface/10 shadow-2xl shadow-accent/5 pointer-events-auto';
    } else if (offset === -1) {
      // Left Background Slot
      return 'absolute left-0 w-full md:w-[50%] h-[85%] z-10 -translate-x-[25%] md:-translate-x-[28%] scale-[0.80] opacity-30 transition-all duration-700 ease-out pointer-events-none cursor-pointer';
    } else {
      // Right Background Slot
      return 'absolute right-0 w-full md:w-[50%] h-[85%] z-10 translate-x-[25%] md:translate-x-[28%] scale-[0.80] opacity-30 transition-all duration-700 ease-out pointer-events-none cursor-pointer';
    }
  };

  return (
    <section id="belvia-hero" className="relative overflow-hidden pt-12 pb-14 bg-bg-base border-b border-bg-elevated/40">
      {/* Background radial brand glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-accent-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Centered Typography Header Block */}
        <div className="max-w-3xl mx-auto space-y-6 mb-12 flex flex-col items-center">
          <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold tracking-widest text-accent bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full shadow-sm">
            <Cpu className="w-3.5 h-3.5" />
            <span>Additive Precision Farm</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight uppercase">
            Redefining <span className="text-accent font-black">Connections</span>
          </h1>

          <p className="text-gray-400 text-sm leading-relaxed max-w-xl font-mono">
            Welcome to Belvia. We fuse industrial additive precision with an artisanal finish. Explore our curated MakerWorld-inspired catalogue, or upload your own model for instant materials matching.
          </p>

          <div className="flex flex-row items-center justify-center p-1 bg-bg-surface/50 border border-bg-elevated rounded-2xl shadow-lg mt-2 select-none">
            <button
              onClick={onStartShopping}
              className="px-6 py-2.5 rounded-xl bg-white text-black font-display text-xs font-bold transition shadow cursor-pointer"
            >
              Personal
            </button>
            <button
              onClick={onGoToCustom}
              className="px-6 py-2.5 rounded-xl text-gray-400 hover:text-white font-display text-xs font-semibold transition cursor-pointer"
            >
              Business
            </button>
          </div>
        </div>

        {/* Carousel Visual Container Box */}
        <div className="relative w-full max-w-5xl mx-auto h-[320px] sm:h-[380px] md:h-[450px] flex items-center justify-center select-none mt-6 group/viewport">
          
          {/* Settings gear button */}
          <button
            onClick={() => setIsAdminOpen(true)}
            className="absolute top-4 right-4 z-40 p-2.5 rounded-xl bg-bg-surface/85 border border-bg-elevated text-gray-400 hover:text-accent hover:border-accent/40 cursor-pointer transition shadow-md backdrop-blur-sm"
            title="Viewport Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Left Arrow */}
          <button
            onClick={prevScene}
            className="absolute left-2 z-40 p-3 rounded-full bg-bg-surface/70 border border-bg-elevated text-gray-400 hover:text-white hover:border-accent/50 cursor-pointer transition shadow-lg backdrop-blur-md hover:scale-105 active:scale-95"
            title="Previous Asset"
          >
            <ChevronLeft className="w-5 h-5 text-accent" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={nextScene}
            className="absolute right-2 z-40 p-3 rounded-full bg-bg-surface/70 border border-bg-elevated text-gray-400 hover:text-white hover:border-accent/50 cursor-pointer transition shadow-lg backdrop-blur-md hover:scale-105 active:scale-95"
            title="Next Asset"
          >
            <ChevronRight className="w-5 h-5 text-accent" />
          </button>

          {/* Slots Carousel Render Loop */}
          {[0, 1, 2].map((index) => {
            const { url, offset } = getSlotDetails(index);
            const classes = getSlotClasses(offset);
            const isActive = offset === 0;

            return (
              <div
                key={index}
                onDragEnter={(e) => handleDrag(e, index)}
                onDragOver={(e) => handleDrag(e, index)}
                onDragLeave={(e) => handleDrag(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => !isActive && setActiveSceneIndex(index)}
                className={classes}
              >
                {/* Drag file overlay container */}
                {dragActiveIndex === index && (
                  <div className="absolute inset-0 z-30 bg-bg-base/90 flex flex-col items-center justify-center space-y-2 pointer-events-none rounded-3xl animate-in fade-in duration-200">
                    <UploadCloud className="w-7 h-7 text-accent animate-bounce" />
                    <p className="text-gray-200 text-[10px] font-mono">Drop to override Slot {index + 1}</p>
                  </div>
                )}

                {/* 3D stage or fallback */}
                {show3D ? (
                  <Hero3DStage
                    sceneUrl={url}
                    isActive={isActive}
                    materialType={config.material}
                    removeSplineBg={config.removeSplineBg}
                    onLoaded={() => setLoadedScenes((prev) => ({ ...prev, [index]: true }))}
                  />
                ) : (
                  /* Mobile Stage Fallback */
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-bg-surface/20 to-bg-base text-center space-y-3 rounded-3xl">
                    <Cpu className="w-8 h-8 text-accent animate-pulse" />
                    <span className="text-white text-[10px] font-mono uppercase tracking-widest font-black">Asset Slot {index + 1}</span>
                  </div>
                )}

                {/* Glass overlay frame for inactive background cards (adds touch of glassmorphism + blur) */}
                {!isActive && (
                  <div className="absolute inset-0 z-20 bg-white/[0.02] backdrop-blur-[3px] border border-white/5 rounded-3xl pointer-events-none transition-all duration-700" />
                )}

                {/* Spinner during load */}
                {!loadedScenes[index] && show3D && (
                  <div className="absolute inset-0 bg-[#080c14]/90 flex items-center justify-center z-15 rounded-3xl">
                    <RefreshCw className="w-4 h-4 text-accent animate-spin" />
                  </div>
                )}
              </div>
            );
          })}

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
              {/* Scene 1 URL */}
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 flex justify-between">
                  <span>Slot 1 Spline or Model Source (Robot):</span>
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

              {/* Scene 2 URL */}
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 flex justify-between">
                  <span>Slot 2 Spline or Model Source:</span>
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

              {/* Scene 3 URL */}
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 flex justify-between">
                  <span>Slot 3 Spline or Model Source:</span>
                  <span onClick={() => fileInputRef3.current?.click()} className="text-accent hover:underline cursor-pointer">Upload local file</span>
                </label>
                <input
                  ref={fileInputRef3}
                  type="file"
                  accept=".splinecode,.stl,.obj,.glb,.gltf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0], 2)}
                />
                <input
                  type="text"
                  value={formScene3}
                  onChange={(e) => setFormScene3(e.target.value)}
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

              {/* Toggles Row */}
              <div className="space-y-2.5 pt-2">
                {/* Remove backgrounds */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remove-bg"
                    checked={formRemoveBg}
                    onChange={(e) => setFormRemoveBg(e.target.checked)}
                    className="rounded border-bg-elevated bg-bg-base text-accent focus:ring-accent"
                  />
                  <label htmlFor="remove-bg" className="text-gray-400 select-none cursor-pointer">
                    Automatically remove Spline background elements (hides backing cards)
                  </label>
                </div>

                {/* Mobile override */}
                <div className="flex items-center space-x-2">
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
