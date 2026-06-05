import React, { useState } from 'react';
import { ArrowRight, UploadCloud, Compass, Cpu, Move3d } from 'lucide-react';

interface HeroSectionProps {
  onStartShopping: () => void;
  onGoToCustom: () => void;
}

export default function HeroSection({ onStartShopping, onGoToCustom }: HeroSectionProps) {
  const [orbitAngle, setOrbitAngle] = useState<{ x: number; y: number }>({ x: -15, y: 25 });
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState({ yaw: 0, pitch: 0, scale: 1.0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Convert offsets into simulated yaw/pitch/rotation angles
    const calculatedYaw = Math.round((x / rect.width) * 180);
    const calculatedPitch = Math.round((y / rect.height) * -180);
    
    setOrbitAngle({
      x: -15 + (y / rect.height) * 45,
      y: 25 + (x / rect.width) * 45
    });

    setTelemetry({
      yaw: calculatedYaw,
      pitch: calculatedPitch,
      scale: Number((1.0 + Math.abs(x) / 3000).toFixed(2))
    });
  };

  const handleMouseEnter = () => {
    setIsTracking(true);
  };

  const handleMouseLeave = () => {
    setIsTracking(false);
    setOrbitAngle({ x: -15, y: 25 });
    setTelemetry({ yaw: 0, pitch: 0, scale: 1.0 });
  };

  return (
    <section id="belvia-hero" className="relative overflow-hidden pt-10 pb-20 md:py-24 bg-bg-base">
      {/* Background Glow Elements */}
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Text Column: The Frame */}
          <div className="lg:col-span-5 space-y-8 text-left">
            {/* Meta Tagline */}
            <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold tracking-widest text-accent bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full shadow-sm">
              <Cpu className="w-3.5 h-3.5 animate-spin" />
              <span>Additive Manufacturing Redefined</span>
            </div>

            {/* Giant Title */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-tight">
              3D Printed <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent-secondary-lt to-accent-secondary font-black">
                Masterpieces
              </span><br />
              &amp; Custom STL Slicing
            </h1>

            {/* Premium Description */}
            <p className="text-gray-400 text-sm leading-relaxed max-w-lg font-mono">
              Welcome to Belvia. We fuse industrial additive precision with artisanal finish. Explore our curated MakerWorld-inspired catalogue, or upload your own model for instant materials matching and automated print-on-demand services.
            </p>

            {/* Interactive Telemetry Widget */}
            <div className="grid grid-cols-3 gap-4 border-y border-gray-850 py-4.5 font-mono">
              <div>
                <span className="block text-[9px] text-gray-400 uppercase tracking-widest font-black">LAYER HEIGHT</span>
                <span className="text-sm font-bold text-gray-200">0.08 - 0.28mm</span>
              </div>
              <div>
                <span className="block text-[9px] text-gray-400 uppercase tracking-widest font-black">PRINTER FARM</span>
                <span className="text-sm font-bold text-gray-200">Bambu Flagships</span>
              </div>
              <div>
                <span className="block text-[9px] text-gray-400 uppercase tracking-widest font-black">FILAMENTS</span>
                <span className="text-sm font-extrabold text-accent">PLA/Carbon/PETG</span>
              </div>
            </div>

            {/* Call To Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                id="hero-shop-cta"
                onClick={onStartShopping}
                className="flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-accent to-accent-secondary hover:from-accent-hover hover:to-accent-secondary-lt text-text-on-accent font-black shadow-lg shadow-accent/15 cursor-pointer transform hover:-translate-y-0.5 transition-all duration-300 group text-xs tracking-wider"
              >
                <span>BROWSE READY PRINTS</span>
                <ArrowRight className="w-4 h-4 text-text-on-accent font-bold group-hover:translate-x-1.5 transition-transform" />
              </button>
              
              <button
                id="hero-custom-cta"
                onClick={onGoToCustom}
                className="flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl bg-gray-900 border border-bg-elevated hover:border-accent hover:bg-gray-800/50 text-gray-200 hover:text-white font-mono text-xs cursor-pointer transition-all duration-300"
              >
                <UploadCloud className="w-4 h-4 text-accent" />
                <span>UPLOAD CUSTOM STL</span>
              </button>
            </div>
          </div>

          {/* Right Visual Platform: Spline Placeholder Base */}
          <div className="lg:col-span-7 flex justify-center items-center">
            {/* The Outer Wireframe Build Area */}
            <div
              id="spline-viewport-container"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="w-full max-w-2xl aspect-square md:aspect-[4/3] rounded-3xl border-2 border-dashed border-bg-elevated bg-[#070c18]/50 relative flex items-center justify-center p-4 overflow-hidden shadow-2xl group transition-all duration-300 hover:border-accent/40"
            >
              {/* Internal Grid Lines to Mimic SLA/FDM Build Bed */}
              <div className="absolute inset-0 bg-grid-ambient pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity duration-300" />
              
              {/* Holographic Glowing Rings representing printing vectors */}
              <div className="absolute w-[80%] h-[80%] rounded-full border border-accent/10 pointer-events-none animate-[pulse_6s_infinite] scale-90" />
              <div className="absolute w-[50%] h-[50%] rounded-full border border-accent/15 pointer-events-none animate-[pulse_4s_infinite] scale-75" />
              <div className="absolute w-[30%] h-[30%] rounded-full border border-indigo-500/5 pointer-events-none animate-[pulse_8s_infinite] scale-110" />

              {/* Build Bed Platform Corners indicating scale */}
              <span className="absolute top-4 left-4 font-mono text-[9px] text-gray-650">[X:000.0, Y:000.0]</span>
              <span className="absolute top-4 right-4 font-mono text-[9px] text-gray-650">[X:256.0, Y:000.0]</span>
              <span className="absolute bottom-4 left-4 font-mono text-[9px] text-gray-650">[X:000.0, Y:256.0]</span>
              <span className="absolute bottom-4 right-4 font-mono text-[9px] text-gray-650">[X:256.0, Y:256.0, Z:256.0]</span>

              {/* Central Target Circle indicating laser focus */}
              <div className="absolute w-2 h-2 rounded-full bg-accent shadow-lg shadow-accent/80 animate-ping pointer-events-none" />

              {/* Technical Overlay Status Indicators */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-gray-950 border border-gray-850 text-[10px] font-mono text-gray-400 tracking-wider flex items-center space-x-2 select-none">
                <span className={`w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-accent animate-ping' : 'bg-gray-600'}`} />
                <span>{isTracking ? 'ORBIT CONTROLLERS ACTIVE' : 'SPLINE VIEWPORT HOLDER'}</span>
              </div>

              {/* Live telemetry sidebar floating in HUD space */}
              <div className="absolute left-4 top-12 font-mono text-[9px] text-gray-500 space-y-1 align-left text-left select-none pointer-events-none bg-bg-base/40 p-2 rounded">
                <div>YAW: <span className="text-accent">{telemetry.yaw}°</span></div>
                <div>PITCH: <span className="text-accent">{telemetry.pitch}°</span></div>
                <div>SCALE: <span className="text-accent">{telemetry.scale}x</span></div>
                <div className="text-[7.5px] mt-1 text-gray-600 font-bold">INPUT: Mouse Cursor</div>
              </div>

              {/* Interactive Vector Slices Cube - rotates dynamically using mouse tracking */}
              <div
                className="w-40 h-40 border-2 border-accent/25 bg-bg-base/80 backdrop-blur-sm rounded-2xl flex items-center justify-center relative shadow-2xl transition-transform duration-100 cursor-grab active:cursor-grabbing"
                style={{
                  transform: `perspective(600px) rotateX(${orbitAngle.x}deg) rotateY(${orbitAngle.y}deg)`
                }}
              >
                {/* Visual filament concentric path outlines */}
                <div className="absolute inset-3 border border-accent/10 rounded-xl" />
                <div className="absolute inset-6 border border-accent/10 rounded-lg" />
                <div className="absolute inset-10 border border-accent/5 rounded" />

                <div className="text-center font-mono space-y-2">
                  <Move3d className="w-8 h-8 text-accent mx-auto animate-pulse" />
                  <span className="block text-[8px] text-white tracking-widest font-bold">SPLINE MODEL ANCHOR</span>
                  <span className="block text-[7.5px] text-accent/80 uppercase">Layer [31/256]</span>
                </div>
              </div>

              {/* Center Callout explanation card when not tracking closely */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[85%] px-5 bg-gray-950/95 border border-gray-850 backdrop-blur-lg rounded-xl py-3.5 shadow-2xl text-center select-none pointer-events-none">
                <p className="text-[10px] text-gray-400 leading-relaxed font-sans mt-0.5">
                  <span className="text-accent font-bold">Centerpiece 3D Build Bed:</span> Hover and drag cursor to orbit the interactive G-code coordinate vectors. Spline target anchor is mapped to <code className="text-accent text-[9px] bg-bg-surface px-1 py-0.5 rounded font-mono">#spline-canvas</code> framework hooks.
                </p>
              </div>

              {/* Lower HUD status */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-mono text-gray-500 text-center select-none">
                <span>SYSTEM PARAMETERS: CAMERABED_ACTIVE // SENSITIVITY=0.75</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
