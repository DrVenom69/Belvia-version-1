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
    <section id="belvia-hero" className="relative overflow-hidden pt-12 pb-20 md:py-24 bg-bg-base">
      {/* Background Glow Elements */}
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Text Column: Sleek and Clean */}
          <div className="lg:col-span-5 space-y-8 text-left">
            {/* Meta Tagline */}
            <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold tracking-widest text-accent bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full shadow-sm">
              <Cpu className="w-3.5 h-3.5" />
              <span>Additive Precision Farm</span>
            </div>

            {/* Giant Title */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-tight">
              3D Printed <br />
              <span className="text-accent font-black">
                Masterpieces
              </span><br />
              &amp; Custom STL Slicing
            </h1>

            {/* Premium Description */}
            <p className="text-gray-400 text-sm leading-relaxed max-w-lg font-mono">
              Welcome to Belvia. We fuse industrial additive precision with an artisanal finish. Explore our curated MakerWorld-inspired catalogue, or upload your own model for instant materials matching and automated print-on-demand services.
            </p>

            {/* Call To Actions */}
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

          {/* Right Visual Platform: Sleek, Clean Spline 3D viewport */}
          <div className="lg:col-span-7 flex justify-center items-center">
            <div
              id="spline-viewport-container"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="w-full max-w-2xl aspect-square md:aspect-[4/3] rounded-3xl bg-bg-surface/30 border border-bg-elevated relative flex items-center justify-center p-8 overflow-hidden shadow-2xl group transition-all duration-300 hover:border-accent/20"
            >
              {/* Ambient radial glows */}
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-transparent pointer-events-none" />
              <div className="absolute w-72 h-72 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

              {/* Minimal vector lines */}
              <div className="absolute w-[85%] h-[85%] rounded-full border border-accent/5 pointer-events-none animate-[spin_20s_linear_infinite]" />
              <div className="absolute w-[60%] h-[60%] rounded-full border border-accent/5 pointer-events-none animate-[spin_12s_linear_infinite_reverse]" />

              {/* Interactive Vector Slices Cube - rotates dynamically using mouse tracking */}
              <div
                className="w-48 h-48 bg-gradient-to-b from-bg-elevated to-bg-surface border border-accent/15 rounded-2xl flex items-center justify-center relative shadow-2xl transition-transform duration-200 cursor-grab active:cursor-grabbing hover:border-accent/30"
                style={{
                  transform: `perspective(1000px) rotateX(${orbitAngle.x}deg) rotateY(${orbitAngle.y}deg)`
                }}
              >
                {/* Inner sleek wireframe borders */}
                <div className="absolute inset-3 border border-accent/5 rounded-xl pointer-events-none" />
                <div className="absolute inset-6 border border-accent/5 rounded-lg pointer-events-none" />
                
                {/* Core 3D visual preview */}
                <div className="text-center font-mono space-y-3 pointer-events-none">
                  <div className="w-16 h-16 mx-auto flex items-center justify-center bg-accent/5 rounded-full border border-accent/15">
                    <Move3d className="w-8 h-8 text-accent animate-pulse" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-white tracking-widest font-black uppercase">Interactive 3D Stage</span>
                    <span className="block text-[8px] text-accent/80 uppercase mt-0.5">Drag to Orbit Object</span>
                  </div>
                </div>
              </div>

              {/* Minimalist Lower telemetry indicator */}
              <div className="absolute bottom-4 left-6 font-mono text-[9px] text-gray-500 flex items-center space-x-2 select-none pointer-events-none">
                <span className={`w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-accent animate-ping' : 'bg-gray-700'}`} />
                <span>3D STAGE ACTIVE</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
