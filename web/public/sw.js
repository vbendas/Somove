self.addEventListener("push", function (event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: "Somove",
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: data.tag || "somove-notification",
    data: { url: data.url || "/" },
    actions: [],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      }
    )
  );
});

self.addEventListener("notificationclose", function (event) {
  event.notification.close();
});

const CACHE_NAME = "somove-v2";
const STATIC_ASSETS = [
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/manifest.json",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Only immutable static assets are cached. Page navigations, React Server
// Component payloads and API calls must always go to the network: they
// depend on the signed-in user and on redirects, and a service worker that
// answers a navigation with fetch(event.request) cannot follow a redirect
// (the browser aborts the navigation), while caching them serves one
// user's pages to the next.
function isStaticAsset(request) {
  if (request.method !== "GET") return false;
  if (request.mode === "navigate") return false;
  if (request.headers.get("RSC") === "1") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.searchParams.has("_rsc")) return false;
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/favicon.ico"
  );
}

self.addEventListener("fetch", function (event) {
  if (!isStaticAsset(event.request)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
