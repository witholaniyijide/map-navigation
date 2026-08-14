"use strict";

/**
 * Road-routing layer.
 *
 * By default this uses the keyless OSRM public server, which returns real
 * road distance and duration with nothing to sign up for. Paste a free
 * OpenRouteService key (https://openrouteservice.org/dev/#/signup — no credit
 * card) into ROUTING.orsApiKey to route via ORS instead: more reliable and
 * friendlier rate limits. Either way the caller treats a failure as "no data"
 * and keeps the straight-line estimate, so the app still works offline.
 */
const ROUTING = {
    // Leave empty to use OSRM. Set to a free OpenRouteService key to use ORS.
    orsApiKey: "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjRmZjYyN2MxYzY0NjQ5MmM4MjVmMDEyYTVhZDMwOWE0IiwiaCI6Im11cm11cjY0In0=",
    osrmBase: "https://router.project-osrm.org",
    orsBase: "https://api.openrouteservice.org",
    timeoutMs: 8000
};

function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ROUTING.timeoutMs);

    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function fetchFromOSRM(coordinates) {
    const path = coordinates.map(([lng, lat]) => `${lng},${lat}`).join(";");
    const url = `${ROUTING.osrmBase}/route/v1/driving/${path}?overview=false&alternatives=false&steps=false`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`OSRM ${response.status}`);

    const data = await response.json();
    const route = data.routes && data.routes[0];
    if (!route) throw new Error("OSRM: no route");

    return { distance: route.distance, duration: route.duration, source: "osrm" };
}

async function fetchFromORS(coordinates) {
    const response = await fetchWithTimeout(`${ROUTING.orsBase}/v2/directions/driving-car`, {
        method: "POST",
        headers: {
            Authorization: ROUTING.orsApiKey,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ coordinates })
    });
    if (!response.ok) throw new Error(`ORS ${response.status}`);

    const data = await response.json();
    const summary = data.routes && data.routes[0] && data.routes[0].summary;
    if (!summary) throw new Error("ORS: no route");

    return { distance: summary.distance, duration: summary.duration, source: "ors" };
}

/**
 * Resolve a road summary for a path of [lng, lat] points.
 * @returns {Promise<{distance:number, duration:number, source:string}>}
 */
function fetchRoadSummary(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
        return Promise.reject(new Error("need at least two points"));
    }

    return ROUTING.orsApiKey ? fetchFromORS(coordinates) : fetchFromOSRM(coordinates);
}
