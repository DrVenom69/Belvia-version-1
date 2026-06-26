/**
 * usePullToRefresh — Instagram/Twitter-style pull-to-refresh for PWA.
 *
 * Tracks touch gestures when the page is scrolled to the top and the user
 * drags downward.  Provides visual pull-distance state and triggers a
 * configurable refresh callback once the pull exceeds a threshold.
 *
 * Usage:
 *   const { pullDistance, isRefreshing, pullToRefreshHandlers } = usePullToRefresh({
 *     onRefresh: () => window.location.reload(),
 *     threshold: 80,
 *   });
 *   <div {...pullToRefreshHandlers}> … </div>
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';

const DEFAULT_THRESHOLD = 80;   // px — distance required to trigger refresh
const PULL_LIMIT = 150;         // px — maximum visual pull distance (rubber-band clamp)

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  threshold?: number;
  pullLimit?: number;
  /** Optional flag to disable PTR when modals/drawers are open */
  disabled?: boolean;
}

interface UsePullToRefreshReturn {
  pullDistance: number;
  isRefreshing: boolean;
  pullToRefreshHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

export function usePullToRefresh({
  onRefresh,
  threshold = DEFAULT_THRESHOLD,
  pullLimit = PULL_LIMIT,
  disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;
      // Only activate when scrolled to the very top
      if (window.scrollY > 0) return;
      // Ignore touches inside scrollable child elements (modals, drawers)
      const target = e.target as HTMLElement;
      if (target.closest('[data-no-pull]')) return;

      startYRef.current = e.touches[0].clientY;
      pullingRef.current = false;
    },
    [disabled, isRefreshing],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      // Ignore upward swipes or very small movements
      if (diff <= 2) {
        pullingRef.current = false;
        setPullDistance(0);
        return;
      }

      // Only activate if we're at the top of the page
      if (window.scrollY > 0) return;

      pullingRef.current = true;

      // Rubber-band easing: feels natural like native pull-to-refresh
      const clamped = Math.min(diff * 0.45, pullLimit);
      setPullDistance(clamped);

      // Resist slightly when passing the threshold to give haptic-like feedback
      if (diff >= threshold && navigator.vibrate) {
        navigator.vibrate(10);
      }
    },
    [disabled, isRefreshing, threshold, pullLimit],
  );

  const onTouchEnd = useCallback(
    async (_e: React.TouchEvent) => {
      if (!pullingRef.current || disabled || isRefreshing) {
        setPullDistance(0);
        return;
      }

      pullingRef.current = false;

      if (pullDistance >= threshold) {
        // Trigger the refresh
        setIsRefreshing(true);
        setPullDistance(threshold); // hold at threshold visual while refreshing

        // If onRefresh returns a promise, await it; otherwise wrap in resolved promise
        try {
          const result = onRefresh();
          if (result instanceof Promise) {
            refreshPromiseRef.current = result;
            await result;
          }
        } catch (err) {
          console.error('[PullToRefresh] Refresh failed:', err);
        } finally {
          refreshPromiseRef.current = null;
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        // Snap back
        setPullDistance(0);
      }
    },
    [disabled, isRefreshing, pullDistance, threshold, onRefresh],
  );

  const handlers = useMemo(
    () => ({ onTouchStart, onTouchMove, onTouchEnd }),
    [onTouchStart, onTouchMove, onTouchEnd],
  );

  return { pullDistance, isRefreshing, pullToRefreshHandlers: handlers };
}
