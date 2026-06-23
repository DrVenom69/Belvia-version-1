// ══════════════════════════════════════════════════════════════════════
// Belvia 3D — Service Worker  (public/sw.js)
// Handles browser push notifications for order status updates,
// manual admin sends, and promotional messages.
//
// Platform note: Works on Chrome/Firefox/Edge on Android and Desktop.
// On iOS Safari, push only works if the site is installed to Home Screen (iOS 16.4+).
// ══════════════════════════════════════════════════════════════════════

const BELVIA_ICON  = '/logo.png';
const BELVIA_BADGE = '/logo.png'; // Small monochrome icon shown in Android status bar

// ── Push Event ─────────────────────────────────────────────────────────
// Fired by the browser when the server sends a push message.
// This runs even when no Belvia tab is open.
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Belvia 3D',
    body: 'You have an update from Belvia.',
    icon: BELVIA_ICON,
    badge: BELVIA_BADGE,
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        title:  parsed.title  || payload.title,
        body:   parsed.body   || payload.body,
        icon:   parsed.icon   || BELVIA_ICON,
        badge:  parsed.badge  || BELVIA_BADGE,
        data:   parsed.data   || { url: '/' },
      };
    } catch (err) {
      // Raw text fallback
      payload.body = event.data.text();
    }
  }

  const options = {
    body:    payload.body,
    icon:    payload.icon,
    badge:   payload.badge,
    data:    payload.data,
    // Keep notification visible until user interacts with it
    requireInteraction: false,
    // Tag prevents duplicate notifications for the same order
    tag:     payload.data?.orderId ? `order-${payload.data.orderId}` : `belvia-${Date.now()}`,
    // Android: vibration pattern [on, off, on] in ms
    vibrate: [200, 100, 200],
    actions: payload.data?.orderId
      ? [{ action: 'view_order', title: '📦 View Order' }]
      : [{ action: 'open_store', title: '🏪 Open Store' }],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// ── Notification Click Event ────────────────────────────────────────────
// Fired when the user taps the notification or one of its action buttons.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  let targetUrl = notifData.url || '/';

  // If there's a specific order, deep-link into the orders tab
  if (notifData.orderId) {
    targetUrl = `/?tab=tracker&order=${notifData.orderId}`;
  }

  const fullUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a Belvia tab is already open, focus it and navigate
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(fullUrl);
          }
          return;
        }
      }
      // No tab open — open a new one
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});

// ── Push Subscription Change ────────────────────────────────────────────
// Fired when the push service silently rotates the subscription endpoint.
// We must re-register it with our server immediately.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    event.newSubscription
      ? fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event.newSubscription.toJSON()),
        })
      : Promise.resolve()
  );
});
