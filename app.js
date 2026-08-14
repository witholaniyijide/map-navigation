"use strict";

const AVERAGE_CITY_SPEED_KPH = 35;

const WEEKDAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

const DAY_TO_ROUTE = {
    Tuesday: "tuesday",
    Thursday: "thursday",
    Saturday: "saturday"
};

const DAY_PLAN = {
    Tuesday: "Travel day",
    Wednesday: "Rest day at Grailland",
    Thursday: "Travel day",
    Friday: "Resort day at Whimspring Palms",
    Saturday: "Return home"
};

const STORAGE_KEY = "vacation-nav:last-route";

let currentRouteKey;
let currentRoute;
let userLocation = null;
let followLocation = false;
let watchId = null;
let lastFocusedElement = null;
let roadSummaryActive = false;
let lastRoadFetch = 0;

const roadSummaryCache = new Map();

const mapFrame = document.getElementById("mapFrame");
const mapFallbackLink = document.getElementById("mapFallbackLink");
const destinationEl = document.getElementById("destination");
const statusEl = document.getElementById("status");
const etaEl = document.getElementById("eta");
const distanceEl = document.getElementById("distance");
const routeStripEl = document.getElementById("routeStrip");
const todayEl = document.getElementById("today");
const todayPlanEl = document.getElementById("todayPlan");
const googleButton = document.getElementById("googleMapsButton");
const followButton = document.getElementById("followButton");
const dayCards = document.querySelectorAll(".day[data-route]");
const noteButtons = document.querySelectorAll(".note-button[data-note-route]");
const routeNoteModal = document.getElementById("routeNoteModal");
const closeNoteButton = document.getElementById("closeNoteButton");
const noteTitleEl = document.getElementById("noteTitle");
const noteStepsEl = document.getElementById("noteSteps");

const mobileQuery = window.matchMedia("(max-width: 900px)");

function formatDistance(meters = 0) {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }

    return `${Math.round(meters)} m`;
}

function formatDuration(seconds = 0) {
    const minutes = Math.max(1, Math.round(seconds / 60));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (!hours) {
        return `${minutes} min`;
    }

    return `${hours} hr ${mins ? `${mins} min` : ""}`.trim();
}

function distanceBetweenPoints(start, end) {
    const [startLng, startLat] = start;
    const [endLng, endLat] = end;
    const earthRadius = 6371000;
    const startPhi = (startLat * Math.PI) / 180;
    const endPhi = (endLat * Math.PI) / 180;
    const deltaPhi = ((endLat - startLat) * Math.PI) / 180;
    const deltaLambda = ((endLng - startLng) * Math.PI) / 180;
    const a =
        Math.sin(deltaPhi / 2) ** 2 +
        Math.cos(startPhi) * Math.cos(endPhi) * Math.sin(deltaLambda / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
}

function getRouteDistance(coordinates) {
    return coordinates.slice(1).reduce((total, point, index) => {
        return total + distanceBetweenPoints(coordinates[index], point);
    }, 0);
}

function getPathForRoute(route) {
    return followLocation && userLocation && route.coordinates.length
        ? [userLocation, ...route.coordinates.slice(1)]
        : route.coordinates;
}

function getRouteSummary(route) {
    const distance = getRouteDistance(getPathForRoute(route));
    const metersPerSecond = (AVERAGE_CITY_SPEED_KPH * 1000) / 3600;

    return {
        distance,
        duration: distance / metersPerSecond
    };
}

function setStatus(message) {
    statusEl.textContent = message;
}

function updateActiveDay(routeKey) {
    dayCards.forEach(card => {
        const isActive = card.dataset.route === routeKey;
        card.classList.toggle("active", isActive);
        card.setAttribute("aria-current", isActive ? "true" : "false");
    });
}

function updateRouteSummary(routeSummary) {
    etaEl.textContent = `~${formatDuration(routeSummary.duration)}`;
    distanceEl.textContent = `~${formatDistance(routeSummary.distance)}`;
}

function renderStops(route) {
    if (!routeStripEl) return;

    routeStripEl.innerHTML = "";

    route.stops.forEach((stop, index) => {
        if (index) {
            const arrow = document.createElement("span");
            arrow.className = "route-arrow";
            arrow.setAttribute("aria-hidden", "true");
            arrow.textContent = "›";
            routeStripEl.appendChild(arrow);
        }

        const chip = document.createElement("span");
        chip.className = "route-stop";
        if (index === 0) chip.classList.add("is-start");
        if (index === route.stops.length - 1) chip.classList.add("is-end");
        chip.textContent = stop;
        routeStripEl.appendChild(chip);
    });
}

function setMapUrl(route) {
    mapFrame.src = route.embed;
    mapFrame.title = `${route.name} map`;
    mapFallbackLink.href =
        followLocation && userLocation ? route.liveGoogle(userLocation) : route.google;
}

function applyRoadSummary(summary, routeKey, usingLocation) {
    // Ignore a late result if the user switched routes or toggled location.
    if (routeKey !== currentRouteKey) return;
    if (usingLocation !== (followLocation && Boolean(userLocation))) return;

    updateRouteSummary({ distance: summary.distance, duration: summary.duration });
    roadSummaryActive = true;
}

async function refreshRoadSummary(route) {
    const routeKey = currentRouteKey;
    const usingLocation = followLocation && Boolean(userLocation);
    const cacheKey = usingLocation ? null : routeKey;

    if (cacheKey && roadSummaryCache.has(cacheKey)) {
        applyRoadSummary(roadSummaryCache.get(cacheKey), routeKey, usingLocation);
        return;
    }

    try {
        const summary = await fetchRoadSummary(getPathForRoute(route));
        if (cacheKey) roadSummaryCache.set(cacheKey, summary);
        applyRoadSummary(summary, routeKey, usingLocation);
    } catch (error) {
        // Best-effort upgrade: keep the straight-line estimate on any failure.
    }
}

function maybeRefreshRoad(route) {
    // Throttle the live-follow refresh so GPS ticks don't hammer the router.
    const now = Date.now();
    if (now - lastRoadFetch < 25000) return;

    lastRoadFetch = now;
    refreshRoadSummary(route);
}

function loadRoute(routeKey, scrollToMap = false) {
    const route = routes[routeKey];
    if (!route) return;

    currentRouteKey = routeKey;
    currentRoute = route;
    saveRoute(routeKey);

    // Show the straight-line estimate immediately, then upgrade to road data.
    roadSummaryActive = false;
    lastRoadFetch = Date.now();

    destinationEl.textContent = route.destination;
    updateActiveDay(routeKey);
    updateRouteSummary(getRouteSummary(route));
    renderStops(route);
    setMapUrl(route);
    setStatus(
        followLocation && userLocation ? "Live location active." : "Planned route ready."
    );

    refreshRoadSummary(route);

    if (scrollToMap && mobileQuery.matches) {
        document.querySelector("main").scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function updateFollowButton() {
    followButton.classList.toggle("is-active", followLocation);
    followButton.setAttribute("aria-pressed", String(followLocation));
    followButton.textContent = followLocation ? "📍 Location on" : "Use my location";
}

function onGpsSuccess(position) {
    userLocation = [position.coords.longitude, position.coords.latitude];

    if (!currentRoute) return;

    if (followLocation) {
        setMapUrl(currentRoute);
        // Live straight-line estimate until the throttled road refresh lands.
        if (!roadSummaryActive) {
            updateRouteSummary(getRouteSummary(currentRoute));
        }
        maybeRefreshRoad(currentRoute);
    }

    setStatus("Live location active.");
}

function onGpsError() {
    // Only surface an error while the user is trying to turn location on and we
    // have never had a fix. A transient error after a good fix is ignored.
    if (userLocation) return;

    followLocation = false;
    updateFollowButton();
    setStatus("Location access is off. Showing the planned route.");
}

function startLocation() {
    if (!("geolocation" in navigator)) {
        setStatus("Location isn't supported on this device.");
        return;
    }

    followLocation = true;
    roadSummaryActive = false;
    lastRoadFetch = 0;
    updateFollowButton();
    setStatus("Getting your location…");

    watchId = navigator.geolocation.watchPosition(onGpsSuccess, onGpsError, {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 12000
    });
}

function stopLocation() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    followLocation = false;
    userLocation = null;
    updateFollowButton();

    if (currentRoute) {
        roadSummaryActive = false;
        lastRoadFetch = Date.now();
        updateRouteSummary(getRouteSummary(currentRoute));
        setMapUrl(currentRoute);
        setStatus("Planned route ready.");
        refreshRoadSummary(currentRoute);
    }
}

function toggleFollowLocation() {
    if (followLocation) {
        stopLocation();
    } else {
        startLocation();
    }
}

function openGoogleMaps() {
    if (!currentRoute) return;

    const url =
        followLocation && userLocation
            ? currentRoute.liveGoogle(userLocation)
            : currentRoute.google;
    window.open(url, "_blank", "noopener,noreferrer");
}

function openRouteNote(routeKey) {
    const route = routes[routeKey];
    if (!route) return;

    lastFocusedElement = document.activeElement;
    noteTitleEl.textContent = route.noteTitle || route.name;
    noteStepsEl.innerHTML = "";

    route.noteSteps.forEach(step => {
        const item = document.createElement("li");
        item.textContent = step;
        noteStepsEl.appendChild(item);
    });

    routeNoteModal.classList.add("is-open");
    routeNoteModal.setAttribute("aria-hidden", "false");
    closeNoteButton.focus();
}

function closeRouteNote() {
    routeNoteModal.classList.remove("is-open");
    routeNoteModal.setAttribute("aria-hidden", "true");

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}

function currentWeekday() {
    return WEEKDAYS[new Date().getDay()];
}

function updateTodayLabel() {
    const weekday = currentWeekday();

    if (todayEl) todayEl.textContent = weekday;
    if (todayPlanEl) todayPlanEl.textContent = DAY_PLAN[weekday] || "Trip starts Tuesday";
}

function saveRoute(routeKey) {
    try {
        localStorage.setItem(STORAGE_KEY, routeKey);
    } catch (error) {
        /* Storage can be unavailable (private mode); persistence is optional. */
    }
}

function readSavedRoute() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved && routes[saved] ? saved : null;
    } catch (error) {
        return null;
    }
}

function pickInitialRoute() {
    // A route the traveller explicitly picked last time wins over the default.
    const saved = readSavedRoute();
    if (saved) return saved;

    const weekday = currentWeekday();

    if (DAY_TO_ROUTE[weekday]) return DAY_TO_ROUTE[weekday];
    if (weekday === "Wednesday") return "thursday";
    if (weekday === "Friday") return "saturday";

    return "tuesday";
}

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch(() => {
            /* Offline support is a progressive enhancement; ignore failures. */
        });
    });
}

googleButton.addEventListener("click", openGoogleMaps);
followButton.addEventListener("click", toggleFollowLocation);

dayCards.forEach(card => {
    const routeButton = card.querySelector(".route-button") || card.querySelector("button");

    if (routeButton) {
        routeButton.addEventListener("click", () => loadRoute(card.dataset.route, true));
    }
});

noteButtons.forEach(button => {
    button.addEventListener("click", () => openRouteNote(button.dataset.noteRoute));
});

closeNoteButton.addEventListener("click", closeRouteNote);
routeNoteModal.addEventListener("click", event => {
    if (event.target.hasAttribute("data-close-note")) {
        closeRouteNote();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && routeNoteModal.classList.contains("is-open")) {
        closeRouteNote();
    }
});

updateTodayLabel();
updateFollowButton();
loadRoute(pickInitialRoute());
registerServiceWorker();
