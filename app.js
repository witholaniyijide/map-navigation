const AVERAGE_CITY_SPEED_KPH = 35;

let currentRouteKey;
let currentRoute;
let userLocation;
let followLocation = true;

const mapFrame = document.getElementById("mapFrame");
const mapFallbackLink = document.getElementById("mapFallbackLink");
const destinationEl = document.getElementById("destination");
const statusEl = document.getElementById("status");
const etaEl = document.getElementById("eta");
const distanceEl = document.getElementById("distance");
const googleButton = document.getElementById("googleMapsButton");
const followButton = document.getElementById("followButton");
const dayCards = document.querySelectorAll(".day[data-route]");
const noteButtons = document.querySelectorAll(".note-button[data-note-route]");
const routeNoteModal = document.getElementById("routeNoteModal");
const closeNoteButton = document.getElementById("closeNoteButton");
const noteTitleEl = document.getElementById("noteTitle");
const noteStepsEl = document.getElementById("noteSteps");

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
    const startPhi = startLat * Math.PI / 180;
    const endPhi = endLat * Math.PI / 180;
    const deltaPhi = (endLat - startLat) * Math.PI / 180;
    const deltaLambda = (endLng - startLng) * Math.PI / 180;
    const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(startPhi) * Math.cos(endPhi) * Math.sin(deltaLambda / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
}

function getRouteDistance(coordinates) {
    return coordinates.slice(1).reduce((total, point, index) => {
        return total + distanceBetweenPoints(coordinates[index], point);
    }, 0);
}

function getRouteSummary(route) {
    const distance = getRouteDistance(userLocation ? [userLocation, ...route.coordinates.slice(1)] : route.coordinates);
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
        card.classList.toggle("active", card.dataset.route === routeKey);
    });

    document.getElementById("today").textContent = routes[routeKey].day;
}

function updateRouteSummary(routeSummary) {
    etaEl.textContent = formatDuration(routeSummary.duration);
    distanceEl.textContent = formatDistance(routeSummary.distance);
}

function setMapUrl(route) {
    const mapUrl = followLocation && userLocation ? route.liveEmbed(userLocation) : route.embed;

    mapFrame.src = mapUrl;
    mapFrame.title = `${route.name} map`;
    mapFallbackLink.href = route.google;
}

function loadRoute(routeKey) {
    currentRouteKey = routeKey;
    currentRoute = routes[routeKey];

    destinationEl.textContent = currentRoute.destination;
    updateActiveDay(routeKey);
    updateRouteSummary(getRouteSummary(currentRoute));
    setMapUrl(currentRoute);
    setStatus(userLocation ? "Live GPS ready" : "Google Maps route ready");
}

function updateGps(position) {
    const lng = position.coords.longitude;
    const lat = position.coords.latitude;
    userLocation = [lng, lat];

    if (currentRoute) {
        updateRouteSummary(getRouteSummary(currentRoute));

        if (followLocation) {
            setMapUrl(currentRoute);
        }

        setStatus("Live GPS ready");
    }
}

function startGps() {
    if (!navigator.geolocation) {
        setStatus("GPS is not supported on this device.");
        return;
    }

    navigator.geolocation.watchPosition(updateGps, () => {
        setStatus("Enable location access for live GPS.");
    }, {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 12000
    });
}

function openGoogleMaps() {
    if (!currentRoute) return;

    const url = followLocation && userLocation ? currentRoute.liveGoogle(userLocation) : currentRoute.google;
    window.open(url, "_blank", "noopener,noreferrer");
}

function openRouteNote(routeKey) {
    const route = routes[routeKey];

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
}

function toggleFollowLocation() {
    followLocation = !followLocation;
    followButton.classList.toggle("is-active", followLocation);
    followButton.textContent = followLocation ? "Using My Location" : "Use My Location";

    if (currentRoute) {
        setMapUrl(currentRoute);
    }
}

googleButton.addEventListener("click", openGoogleMaps);
followButton.addEventListener("click", toggleFollowLocation);

dayCards.forEach(card => {
    card.querySelector(".route-button").addEventListener("click", () => loadRoute(card.dataset.route));
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

loadRoute("tuesday");
startGps();
