const AVERAGE_CITY_SPEED_KPH = 35;

const map = L.map("map", {
    zoomControl: false
}).setView([6.60, 3.38], 10);

L.control.zoom({ position: "topright" }).addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let gpsMarker;
let gpsAccuracyCircle;
let routeLine;
let currentRouteKey;
let currentRoute;
let userLocation;
let followLocation = true;
let stopMarkers = [];

const destinationEl = document.getElementById("destination");
const statusEl = document.getElementById("status");
const etaEl = document.getElementById("eta");
const distanceEl = document.getElementById("distance");
const googleButton = document.getElementById("googleMapsButton");
const followButton = document.getElementById("followButton");
const dayCards = document.querySelectorAll(".day[data-route]");

function toLatLng([lng, lat]) {
    return [lat, lng];
}

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

function drawRoute(coordinates) {
    const latLngs = coordinates.map(toLatLng);

    if (routeLine) {
        routeLine.setLatLngs(latLngs);
        return;
    }

    routeLine = L.polyline(latLngs, {
        color: "#1565C0",
        weight: 6,
        opacity: 0.85,
        lineJoin: "round"
    }).addTo(map);
}

function showStops(route) {
    stopMarkers.forEach(marker => marker.remove());
    stopMarkers = [];

    route.coordinates.forEach((point, index) => {
        const label = route.stops[index] || `Stop ${index + 1}`;
        const marker = L.marker(toLatLng(point), {
            title: label
        })
            .bindPopup(label)
            .addTo(map);

        stopMarkers.push(marker);
    });
}

function fitToRoute(coordinates) {
    const latLngs = coordinates.map(toLatLng);
    const bounds = L.latLngBounds(latLngs);

    map.fitBounds(bounds, {
        paddingTopLeft: [40, 80],
        paddingBottomRight: [40, 190],
        maxZoom: 13
    });
}

function updateRouteSummary(routeSummary) {
    etaEl.textContent = formatDuration(routeSummary.duration);
    distanceEl.textContent = formatDistance(routeSummary.distance);
}

function loadRoute(routeKey) {
    currentRouteKey = routeKey;
    currentRoute = routes[routeKey];

    destinationEl.textContent = currentRoute.destination;
    updateActiveDay(routeKey);
    showStops(currentRoute);
    drawRoute(currentRoute.coordinates);
    updateRouteSummary(getRouteSummary(currentRoute));
    fitToRoute(currentRoute.coordinates);
    setStatus(userLocation ? "Live GPS ready" : "Route ready");
}

function updateGps(position) {
    const lng = position.coords.longitude;
    const lat = position.coords.latitude;
    const accuracy = position.coords.accuracy || 0;
    userLocation = [lng, lat];
    const latLng = toLatLng(userLocation);

    if (!gpsMarker) {
        gpsMarker = L.marker(latLng, { title: "You are here" })
            .bindPopup("You are here")
            .addTo(map);
    } else {
        gpsMarker.setLatLng(latLng);
    }

    if (!gpsAccuracyCircle) {
        gpsAccuracyCircle = L.circle(latLng, {
            radius: accuracy,
            color: "#e53935",
            fillColor: "#e53935",
            fillOpacity: 0.12,
            weight: 1
        }).addTo(map);
    } else {
        gpsAccuracyCircle.setLatLng(latLng).setRadius(accuracy);
    }

    if (followLocation) {
        map.setView(latLng, Math.max(map.getZoom(), 13), { animate: true });
    }

    if (currentRoute) {
        updateRouteSummary(getRouteSummary(currentRoute));
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

    window.open(currentRoute.google, "_blank", "noopener,noreferrer");
}

function toggleFollowLocation() {
    followLocation = !followLocation;
    followButton.classList.toggle("is-active", followLocation);
    followButton.textContent = followLocation ? "Following My Location" : "Follow My Location";

    if (followLocation && userLocation) {
        map.setView(toLatLng(userLocation), Math.max(map.getZoom(), 13), { animate: true });
    }
}

googleButton.addEventListener("click", openGoogleMaps);
followButton.addEventListener("click", toggleFollowLocation);

dayCards.forEach(card => {
    card.querySelector("button").addEventListener("click", () => loadRoute(card.dataset.route));
});

loadRoute("tuesday");
startGps();
