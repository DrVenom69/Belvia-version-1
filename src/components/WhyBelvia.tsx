import React, { useState, useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   WHY BELVIA — "Signal Node" Transmission Interface
   
   Concept: Each reason is a DATA NODE on a live vertical backbone.
   The backbone pulses with signal packets travelling down a line.
   Hovering a node expands it into a detailed terminal read-out panel.
   On mobile: accordion vertical stack with scan-line animations.
   
   Aesthetic DNA: dark carbon base, amber/gold accent, DM Mono labels,
   military/industrial HUD grid overlays, scanline reveal animations.
───────────────────────────────────────────────────────────────────────── */

const NODES = [
  {
    id: 'N01',
    label: 'Micron Precision',
    tagline: '±0.1mm FDM Tolerance',
    body:
      'Every layer is calibrated to sub-millimetre tolerance on Bambu Lab X1 Carbon fleets. Mechanical assemblies, sliding joints, and interlocking gears hold clearance spec on first print.',
    metric: '±0.1mm',
    metricLabel: 'Layer Accuracy',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" />
        <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
      </svg>
    ),
    color: '#f5af19',
  },
  {
    id: 'N02',
    label: 'Same-Day Dhaka',
    tagline: 'Order → Door in Hours',
    body:
      'Ready prints dispatched from our Dhaka facility within 2–4 hours of confirmation. Same-day delivery available across all 40 zones of Dhaka city — no courier delays, no cold chain.',
    metric: '4h',
    metricLabel: 'Avg. Dispatch',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
    color: '#22d3ee',
  },
  {
    id: 'N03',
    label: 'Custom on Demand',
    tagline: 'STL → Physical in 24h',
    body:
      'Upload any STL, 3MF, or OBJ file through the Custom Studio. Our slicer engine validates geometry, checks overhangs, and returns a material quote within minutes. No minimums, no setup fees.',
    metric: '24h',
    metricLabel: 'Custom Turnaround',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M12 8v8M8 12h8" strokeLinecap="round" />
      </svg>
    ),
    color: '#a78bfa',
  },
  {
    id: 'N04',
    label: 'Premium Filaments',
    tagline: 'PLA+ · PETG · TPU · CF',
    body:
      'We stock Bambu Lab, Polymaker, and eSUN premium lines. From soft food-safe TPU to high-strength carbon fibre reinforced filament — every material is dried, calibrated, and print-ready.',
    metric: '12+',
    metricLabel: 'Active Filaments',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: '#34d399',
  },
  {
    id: 'N05',
    label: '10,000+ Designs',
    tagline: 'MakerWorld Catalogue',
    body:
      'Browse and order any model from our integrated MakerWorld catalogue of 10,000+ designs. We handle the licensing, slicing, and fulfilment — you just pick the design and colour.',
    metric: '10k+',
    metricLabel: 'Catalogue Designs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path d="M4 6h16M4 10h16M4 14h10M4 18h6" strokeLinecap="round" />
      </svg>
    ),
    color: '#f472b6',
  },
  {
    id: 'N06',
    label: 'Dedicated Support',
    tagline: 'Real Humans, Real Fast',
    body:
      'WhatsApp-first support with sub-30 minute response times. Every order includes live tracking, a print preview photo before dispatch, and a satisfaction guarantee with free re-prints.',
    metric: '<30m',
    metricLabel: 'Response Time',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: '#fb923c',
  },
  {
    id: 'N07',
    label: 'Pre-Order Imports',
    tagline: 'Endless Possibility',
    body:
      'Pre-order any product from China, Japan, or USA — we handle customs, import duty, and last-mile delivery. Pay a 30% deposit and track your shipment in real-time on your dashboard.',
    metric: '30%',
    metricLabel: 'Deposit to Lock',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" strokeLinecap="round" />
      </svg>
    ),
    color: '#f5af19',
  },
];

/* ── Inline keyframe styles injected once ── */
const CSS = `
@keyframes whyScan {
  0%   { transform: translateY(-100%); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(100%); opacity: 0; }
}
@keyframes whyPulse {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50%       { opacity: 0.55; transform: scale(1.25); }
}
@keyframes whySignal {
  0%   { top: -8px; opacity: 0; }
  5%   { opacity: 1; }
  95%  { opacity: 1; }
  100% { top: calc(100% + 8px); opacity: 0; }
}
@keyframes whyReveal {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes whyNodePop {
  0%   { transform: scale(0.85); opacity: 0; }
  60%  { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes whyFlicker {
  0%, 100% { opacity: 1; }
  48% { opacity: 1; }
  50% { opacity: 0.4; }
  52% { opacity: 1; }
}
@keyframes whyCountUp {
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0% 0 0); }
}
`;

function useIntersection(ref: React.RefObject<HTMLElement | null>, threshold = 0.15): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

/* ─── Individual Node ─────────────────────────────────────────────────── */
interface NodeProps {
  node: (typeof NODES)[0];
  index: number;
  isActive: boolean;
  onActivate: () => void;
  sectionVisible: boolean;
}

const Node: React.FC<NodeProps> = ({ node, index, isActive, onActivate, sectionVisible }) => {
  const delay = `${index * 80}ms`;
  const lineActive = sectionVisible;

  return (
    <div
      style={{ animationDelay: delay, animationFillMode: 'both' }}
      className={`relative flex gap-0 ${sectionVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* ── Left: backbone line + dot ── */}
      <div className="flex flex-col items-center shrink-0 w-14 sm:w-18">
        {/* Top line segment */}
        {index > 0 && (
          <div className="relative w-px flex-1 min-h-[24px] overflow-hidden">
            <div
              className="absolute inset-0 opacity-20"
              style={{ background: `linear-gradient(to bottom, ${node.color}40, ${node.color}20)` }}
            />
            {/* Signal packet travelling down */}
            {lineActive && (
              <div
                className="absolute left-0 w-full"
                style={{
                  height: '40px',
                  background: `linear-gradient(to bottom, transparent, ${node.color}, transparent)`,
                  animation: `whySignal ${2.5 + index * 0.3}s linear ${1 + index * 0.4}s infinite`,
                }}
              />
            )}
          </div>
        )}

        {/* Node circle */}
        <button
          onClick={onActivate}
          className="relative z-10 flex items-center justify-center rounded-full cursor-pointer shrink-0 transition-all duration-300 focus:outline-none"
          style={{
            width: 44,
            height: 44,
            border: `1.5px solid ${isActive ? node.color : node.color + '50'}`,
            background: isActive
              ? `radial-gradient(circle at 35% 35%, ${node.color}30, ${node.color}08)`
              : 'rgba(8,12,20,0.7)',
            boxShadow: isActive
              ? `0 0 22px ${node.color}50, 0 0 6px ${node.color}30 inset`
              : `0 0 10px ${node.color}20`,
            animation: sectionVisible
              ? `whyNodePop 0.4s ease ${0.1 + index * 0.08}s both`
              : undefined,
          }}
          aria-label={`Node ${node.id}: ${node.label}`}
        >
          {/* Pulse ring */}
          {isActive && (
            <span
              className="absolute inset-0 rounded-full"
              style={{
                border: `1px solid ${node.color}`,
                animation: 'whyPulse 1.8s ease-in-out infinite',
                transform: 'scale(1.5)',
              }}
            />
          )}
          <span style={{ color: isActive ? node.color : node.color + '90' }}>
            {node.icon}
          </span>
        </button>

        {/* Bottom line segment */}
        {index < NODES.length - 1 && (
          <div className="relative w-px flex-1 min-h-[24px] overflow-hidden">
            <div
              className="absolute inset-0 opacity-20"
              style={{ background: `linear-gradient(to bottom, ${node.color}20, ${NODES[index + 1].color}20)` }}
            />
            {lineActive && (
              <div
                className="absolute left-0 w-full"
                style={{
                  height: '40px',
                  background: `linear-gradient(to bottom, transparent, ${node.color}, transparent)`,
                  animation: `whySignal ${2.5 + (index + 0.5) * 0.3}s linear ${1.2 + index * 0.4}s infinite`,
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Right: content card ── */}
      <div className="flex-1 py-3 pl-4">
        <button
          onClick={onActivate}
          className="w-full text-left group focus:outline-none cursor-pointer"
        >
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* ID tag */}
              <span
                className="text-[9px] font-mono font-bold tracking-widest uppercase"
                style={{
                  color: node.color + 'cc',
                  animation: sectionVisible ? `whyFlicker 6s ease ${2 + index * 0.5}s infinite` : undefined,
                }}
              >
                SIG_{node.id} ▸ ONLINE
              </span>

              {/* Title */}
              <h3
                className="font-display font-bold text-base sm:text-lg leading-tight mt-0.5 transition-colors duration-200"
                style={{ color: isActive ? node.color : undefined }}
              >
                {node.label}
              </h3>

              {/* Tagline */}
              <p className="text-[11px] font-mono text-text-secondary mt-0.5">
                {node.tagline}
              </p>
            </div>

            {/* Metric badge */}
            <div
              className="shrink-0 text-right"
              style={{
                opacity: sectionVisible ? 1 : 0,
                animation: sectionVisible
                  ? `whyReveal 0.5s ease ${0.2 + index * 0.1}s both`
                  : undefined,
              }}
            >
              <div
                className="font-mono font-black text-xl sm:text-2xl leading-none"
                style={{ color: node.color }}
              >
                {node.metric}
              </div>
              <div className="text-[9px] font-mono text-text-secondary uppercase tracking-wider mt-0.5">
                {node.metricLabel}
              </div>
            </div>
          </div>

          {/* Separator bar */}
          <div
            className="mt-3 h-px transition-all duration-500"
            style={{
              background: isActive
                ? `linear-gradient(to right, ${node.color}, ${node.color}00)`
                : 'var(--border-premium)',
              width: isActive ? '100%' : '60%',
            }}
          />
        </button>

        {/* Expanded body — terminal readout */}
        <div
          className="overflow-hidden transition-all duration-500 ease-in-out"
          style={{ maxHeight: isActive ? '200px' : '0px' }}
        >
          <div
            className="pt-4 pb-2 pr-2"
            style={{
              animation: isActive ? 'whyReveal 0.35s ease both' : undefined,
            }}
          >
            {/* Terminal header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500/60" />
                <span className="w-2 h-2 rounded-full bg-yellow-500/60" />
                <span className="w-2 h-2 rounded-full" style={{ background: node.color + '80' }} />
              </div>
              <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest">
                belvia@node:{node.id.toLowerCase()} ~
              </span>
            </div>

            {/* Body text with scan-line overlay */}
            <div className="relative">
              <p className="text-text-secondary text-[13px] leading-relaxed font-sans">
                {node.body}
              </p>
              {/* Scan line passing through */}
              <div
                className="absolute inset-x-0 h-8 pointer-events-none"
                style={{
                  background: `linear-gradient(to bottom, transparent, ${node.color}06, transparent)`,
                  animation: 'whyScan 3s ease-in-out 0.3s 1 forwards',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Section Header stats ────────────────────────────────────────────── */
function StatPill({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center px-4 sm:px-6 first:pl-0 last:pr-0">
      <span className="font-mono font-black text-xl sm:text-2xl" style={{ color }}>
        {value}
      </span>
      <span className="text-[9px] font-mono uppercase tracking-widest text-text-secondary mt-0.5">
        {label}
      </span>
    </div>
  );
}

/* ─── Main Export ─────────────────────────────────────────────────────── */
export default function WhyBelvia() {
  const [activeNode, setActiveNode] = useState<number | null>(0);
  const sectionRef = useRef<HTMLElement>(null);
  const visible = useIntersection(sectionRef, 0.1);

  const handleActivate = (idx: number) => {
    setActiveNode((prev) => (prev === idx ? null : idx));
  };

  return (
    <>
      <style>{CSS}</style>

      <section
        ref={sectionRef}
        id="why-choose-belvia"
        className="relative py-20 sm:py-28 overflow-hidden"
        style={{ background: 'var(--bg-base)' }}
      >
        {/* ── Background: faint grid + amber radial glow ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(245,175,25,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,175,25,0.025) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(245,175,25,0.07) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Section header ── */}
          <div
            className="mb-16"
            style={{
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.6s ease',
            }}
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="h-px flex-1 max-w-[48px]"
                style={{ background: 'linear-gradient(to right, transparent, #f5af19)' }}
              />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent">
                System Diagnostic · BELVIA ADVANTAGE
              </span>
              <div
                className="h-px flex-1 max-w-[48px]"
                style={{ background: 'linear-gradient(to left, transparent, #f5af19)' }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
              <div>
                <h2 className="font-display font-black text-3xl sm:text-4xl xl:text-5xl text-text-primary leading-[1.05] tracking-tight">
                  Why Makers Choose{' '}
                  <span
                    className="relative inline-block"
                    style={{
                      background: 'linear-gradient(135deg, #f5af19 0%, #f8bc2e 50%, #e09e12 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Belvia
                  </span>
                </h2>
                <p className="text-text-secondary text-sm sm:text-base leading-relaxed mt-4 max-w-md">
                  Seven signal nodes. Each one a precision-engineered reason to print with us — not just once, but every time.
                </p>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-0 divide-x divide-border-premium lg:justify-end">
                <StatPill value="10k+" label="Catalogue" color="#f5af19" />
                <StatPill value="±0.1mm" label="Tolerance" color="#22d3ee" />
                <StatPill value="4h" label="Dispatch" color="#34d399" />
              </div>
            </div>
          </div>

          {/* ── Two-column layout on large screens ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-0">

            {/* Left column: nodes 1–4 */}
            <div className="flex flex-col">
              {NODES.slice(0, 4).map((node, idx) => (
                <Node
                  key={node.id}
                  node={node}
                  index={idx}
                  isActive={activeNode === idx}
                  onActivate={() => handleActivate(idx)}
                  sectionVisible={visible}
                />
              ))}
            </div>

            {/* Right column: nodes 5–7 + promo card */}
            <div className="flex flex-col">
              {NODES.slice(4).map((node, idx) => (
                <Node
                  key={node.id}
                  node={node}
                  index={idx + 4}
                  isActive={activeNode === idx + 4}
                  onActivate={() => handleActivate(idx + 4)}
                  sectionVisible={visible}
                />
              ))}

              {/* ── Terminal CTA card ── */}
              <div
                className="mt-6 rounded-2xl p-5 relative overflow-hidden"
                style={{
                  border: '1px solid rgba(245,175,25,0.20)',
                  background: 'rgba(245,175,25,0.04)',
                  opacity: visible ? 1 : 0,
                  animation: visible ? 'whyReveal 0.6s ease 0.9s both' : undefined,
                }}
              >
                {/* Corner accent */}
                <div
                  className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at top right, rgba(245,175,25,0.15) 0%, transparent 65%)',
                  }}
                />
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(245,175,25,0.12)', border: '1px solid rgba(245,175,25,0.25)' }}
                  >
                    <span className="text-accent text-sm font-mono font-black">▸</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Ready to print
                    </p>
                    <p className="text-text-primary font-display font-bold text-sm">
                      Start your first order — no account needed. Just browse, pick a colour, and check out.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom accent line ── */}
          <div
            className="mt-16 h-px"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(245,175,25,0.25) 30%, rgba(245,175,25,0.25) 70%, transparent)',
            }}
          />
        </div>
      </section>
    </>
  );
}
