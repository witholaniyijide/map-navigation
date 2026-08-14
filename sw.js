const CACHE = "vacation-nav-v1";
const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css",
    "./routes.js",
    "./app.js",
    "./manifest.json",
    "./icon.svg"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches
            .open(CACHE)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches
            .keys()
            .then(keys =>
                Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const request = event.request;

    // Only handle same-origin GET requests. Let the browser deal with the
    // Google Maps embed and any other cross-origin traffic on its own.
    if (request.method !== "GET") return;
    if (new URL(request.url).origin !== self.location.origin) return;

    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;

            return fetch(request)
                .then(response => {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE).then(cache => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => cached);
        })
    );
});
