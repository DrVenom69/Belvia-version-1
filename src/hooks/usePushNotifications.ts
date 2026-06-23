/**
 * src/hooks/usePushNotifications.ts
 *
 * React hook for managing browser push notification subscriptions.
 *
 * Usage:
 *   const { isSupported, permission, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
 *
 * iOS Safari note:
 *   Push works on iOS 16.4+ ONLY when the site is installed to the Home Screen.
 *   `isSupported` will return false in plain iOS Safari — handle gracefully.
 */

import { useState, useEffect, useCallback } from 'react';

/** Converts a base64 URL-safe string to a Uint8Array (required for applicationServerKey) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushPermission = 'default' | 'granted' | 'denied';

export interface UsePushNotificationsReturn {
  /** True if the Push API + Service Worker are supported in this browser */
  isSupported: boolean;
  /** Current Notification.permission value */
  permission: PushPermission;
  /** True when a push subscription is active for this browser */
  isSubscribed: boolean;
  /** True while a subscribe/unsubscribe request is in-flight */
  isLoading: boolean;
  /** Last error message, or null */
  error: string | null;
  /** Request permission and register a push subscription */
  subscribe: (identityHints?: { phone?: string; email?: string }) => Promise<boolean>;
  /** Remove the push subscription from browser and server */
  unsubscribe: () => Promise<boolean>;
}

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<PushPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect support and read current subscription state on mount
  useEffect(() => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window &&
      !!VAPID_PUBLIC_KEY;

    setIsSupported(supported);

    if (!supported) return;

    setPermission(Notification.permission as PushPermission);

    // Check if we already have an active subscription
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(!!sub))
      .catch(() => setIsSubscribed(false));
  }, []);

  const subscribe = useCallback(
    async (identityHints?: { phone?: string; email?: string }): Promise<boolean> => {
      if (!isSupported) {
        setError('Push notifications are not supported in this browser.');
        return false;
      }
      if (!VAPID_PUBLIC_KEY) {
        setError('Push notification configuration is missing.');
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 1. Request permission (browser prompt)
        const result = await Notification.requestPermission();
        setPermission(result as PushPermission);

        if (result !== 'granted') {
          setError('Notification permission was denied. You can re-enable it in browser settings.');
          return false;
        }

        // 2. Get the active service worker registration
        const reg = await navigator.serviceWorker.ready;

        // 3. Subscribe to push (creates the PushSubscription with VAPID key)
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        // 4. Send the subscription to our server, attaching customer identity hints
        const subJson = sub.toJSON();
        const payload = {
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth_key: subJson.keys?.auth,
          user_agent: navigator.userAgent.substring(0, 200),
          ...(identityHints?.phone && { phone: identityHints.phone }),
          ...(identityHints?.email && { email: identityHints.email }),
        };

        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to register subscription on server.');
        }

        setIsSubscribed(true);
        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to subscribe to push notifications.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported]
  );

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (!sub) {
        setIsSubscribed(false);
        return true;
      }

      // Tell the server first (so it can mark the row is_active = false)
      const subJson = sub.toJSON();
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subJson.endpoint }),
      }).catch(() => {/* server unavailable — still unsubscribe locally */});

      // Then remove the browser subscription
      await sub.unsubscribe();
      setIsSubscribed(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to unsubscribe.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isSupported, permission, isSubscribed, isLoading, error, subscribe, unsubscribe };
}
