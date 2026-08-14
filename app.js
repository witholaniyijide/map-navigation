const MAPBOX_TOKEN_PLACEHOLDER = "PASTE_YOUR_MAPBOX_ACCESS_TOKEN_HERE";
const mapboxToken = window.MAPBOX_ACCESS_TOKEN || MAPBOX_TOKEN_PLACEHOLDER;

mapboxgl.accessToken = mapboxToken;

const hasMapboxToken = Boolean(mapboxToken && mapboxToken !== MAPBOX_TOKEN_PLACEHOLDER);
const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: [3.38, 6.60],
    zoom: 10
});

map.addControl(new mapboxgl.NavigationControl(), "top-right");

let gpsMarker;
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

function setStatus(message) {
    statusEl.textContent = message;
}

function setMetricDefaults() {
    etaEl.textContent = "--";
    distanceEl.textContent = "--";
}

function updateActiveDay(routeKey) {
    dayCards.forEach(card => {
        card.classList.toggle("active", card.dataset.route === routeKey);
    });

    document.getElementById("today").textContent = routes[routeKey].day;
}

function buildDirectionsUrl(route, origin) {
    const coordinates = [origin || route.coordinates[0], ...route.coordinates.slice(1)]
        .map(point => point.join(","))
        .join(";");

    const params = new URLSearchParams({
        access_token: mapboxToken,
        alternatives: "false",
        geometries: "geojson",
        overview: "full",
        steps: "false"
    });

    return `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordinates}?${params}`;
}

async function getRoadRoute(route, origin) {
    if (!hasMapboxToken) {
        throw new Error("Add your Mapbox access token in app.js or set window.MAPBOX_ACCESS_TOKEN.");
    }

    const response = await fetch(buildDirectionsUrl(route, origin));

    if (!response.ok) {
        throw new Error("Mapbox Directions API request failed.");
    }

    const data = await response.json();

    if (!data.routes || !data.routes.length) {
        throw new Error("No drivable route was returned by Mapbox.");
    }

    return data.routes[0];
}

function drawRoute(coordinates) {
    const geojson = {
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates
        }
    };

    if (map.getSource("route")) {
        map.getSource("route").setData(geojson);
        return;
    }

    map.addSource("route", {
        type: "geojson",
        data: geojson
    });

    map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
            "line-join": "round",
            "line-cap": "round"
        },
        paint: {
            "line-color": "#1565C0",
            "line-width": 6,
            "line-opacity": 0.85
        }
    });
}

function showStops(route) {
    stopMarkers.forEach(marker => marker.remove());
    stopMarkers = [];

    route.coordinates.forEach((point, index) => {
        const label = route.stops[index] || `Stop ${index + 1}`;
        const marker = new mapboxgl.Marker({ color: index === route.coordinates.length - 1 ? "#d84315" : "#2E7D32" })
            .setLngLat(point)
            .setPopup(new mapboxgl.Popup({ offset: 24 }).setText(label))
            .addTo(map);

        stopMarkers.push(marker);
    });
}

function fitToRoute(coordinates) {
    const bounds = coordinates.reduce((mapBounds, coord) => mapBounds.extend(coord), new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

    map.fitBounds(bounds, {
        padding: { top: 90, right: 50, bottom: 190, left: 50 },
        maxZoom: 13,
        duration: 900
    });
}

function updateRouteSummary(routeSummary) {
    etaEl.textContent = formatDuration(routeSummary.duration);
    distanceEl.textContent = formatDistance(routeSummary.distance);
}

async function loadRoute(routeKey) {
    currentRouteKey = routeKey;
    currentRoute = routes[routeKey];

    destinationEl.textContent = currentRoute.destination;
    setMetricDefaults();
    updateActiveDay(routeKey);
    showStops(currentRoute);
    setStatus("Getting road route...");

    try {
        const roadRoute = await getRoadRoute(currentRoute, userLocation);
        drawRoute(roadRoute.geometry.coordinates);
        updateRouteSummary(roadRoute);
        fitToRoute(roadRoute.geometry.coordinates);
        setStatus(userLocation ? "Live navigation ready" : "Route ready");
    } catch (error) {
        drawRoute(currentRoute.coordinates);
        fitToRoute(currentRoute.coordinates);
        setStatus(error.message);
    }
}

function updateGps(position) {
    const lng = position.coords.longitude;
    const lat = position.coords.latitude;
    userLocation = [lng, lat];

    if (!gpsMarker) {
        gpsMarker = new mapboxgl.Marker({ color: "#e53935" })
            .setLngLat(userLocation)
            .setPopup(new mapboxgl.Popup({ offset: 24 }).setText("You are here"))
            .addTo(map);
    } else {
        gpsMarker.setLngLat(userLocation);
    }

    if (followLocation) {
        map.easeTo({ center: userLocation, zoom: Math.max(map.getZoom(), 13), duration: 800 });
    }

    if (currentRouteKey) {
        loadRoute(currentRouteKey);
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
        map.easeTo({ center: userLocation, zoom: Math.max(map.getZoom(), 13), duration: 800 });
    }
}

googleButton.addEventListener("click", openGoogleMaps);
followButton.addEventListener("click", toggleFollowLocation);

dayCards.forEach(card => {
    card.querySelector("button").addEventListener("click", () => loadRoute(card.dataset.route));
});

map.on("load", () => {
    loadRoute("tuesday");
    startGps();
});
