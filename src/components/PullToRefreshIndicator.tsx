/**
 * PullToRefreshIndicator — the visual "pull down" affordance shown at the top
 * of the screen during a pull-to-refresh gesture.
 *
 * States:
 *   0 < distance < threshold  →  arrow pointing down (hint: pull more)
 *   distance >= threshold      →  arrow pointing up (hint: release)
 *   isRefreshing               →  spinning loader
 */

import React from 'react';
import { ArrowDown, RotateCw, RefreshCw } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold: number;
}

export default function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const ready = pullDistance >= threshold;

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 z-[60] flex items-center justify-center"
      style={{
        top: 0,
        height: `${Math.max(pullDistance, isRefreshing ? threshold : 0)}px`,
        transition: isRefreshing ? 'none' : 'height 0.2s ease-out',
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          transform: `scale(${isRefreshing ? 1 : 0.5 + progress * 0.5})`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        {isRefreshing ? (
          <RefreshCw className="w-6 h-6 text-accent animate-spin" />
        ) : ready ? (
          <div className="flex flex-col items-center gap-0.5">
            <RotateCw className="w-5 h-5 text-accent" />
            <span className="text-[9px] font-mono font-bold text-accent/70 tracking-wider uppercase">
              Release
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <ArrowDown
              className="w-5 h-5 text-gray-400"
              style={{
                opacity: 0.4 + progress * 0.6,
              }}
            />
            <span
              className="text-[9px] font-mono font-bold tracking-wider uppercase"
              style={{
                color: `rgba(156, 163, 175, ${0.3 + progress * 0.5})`,
              }}
            >
              Pull to refresh
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
