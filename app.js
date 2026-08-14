mapboxgl.accessToken = "PASTE_YOUR_MAPBOX_ACCESS_TOKEN_HERE";

const map = new mapboxgl.Map({

    container: "map",

    style: "mapbox://styles/mapbox/streets-v12",

    center: [3.38,6.60],

    zoom: 10

});

map.addControl(new mapboxgl.NavigationControl());

let gpsMarker;

let currentRoute;

let currentSource;

navigator.geolocation.watchPosition(position=>{

    const lng = position.coords.longitude;

    const lat = position.coords.latitude;

    if(!gpsMarker){

        gpsMarker = new mapboxgl.Marker({

            color:"#e53935"

        })

        .setLngLat([lng,lat])

        .addTo(map);

    }

    else{

        gpsMarker.setLngLat([lng,lat]);

    }

});

function loadRoute(route){

    currentRoute = routes[route];

    document.getElementById("destination").innerHTML =
        currentRoute.destination;

    document.getElementById("status").innerHTML =
        "Navigation Ready";

    map.flyTo({

        center:currentRoute.center,

        zoom:currentRoute.zoom,

        speed:0.8

    });

    drawRoute(currentRoute.coordinates);

}
// ---------- ROUTE DRAWING ----------

function drawRoute(coordinates) {

    if (map.getLayer("route")) {
        map.removeLayer("route");
    }

    if (map.getSource("route")) {
        map.removeSource("route");
    }

    const geojson = {

        type: "Feature",

        geometry: {

            type: "LineString",

            coordinates: coordinates

        }

    };

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

    showStops(coordinates);

}



// ---------- STOP MARKERS ----------

let stopMarkers = [];

function showStops(coords){

    stopMarkers.forEach(marker => marker.remove());

    stopMarkers = [];

    coords.forEach(point=>{

        const marker = new mapboxgl.Marker({

            color:"#2E7D32"

        })

        .setLngLat(point)

        .addTo(map);

        stopMarkers.push(marker);

    });

}



// ---------- GOOGLE MAPS ----------

function openGoogleMaps(){

    if(!currentRoute) return;

    window.open(currentRoute.google,"_blank");

}



// ---------- ADD BUTTON ----------

const info = document.querySelector(".info");

const button = document.createElement("button");

button.innerHTML = "Open in Google Maps";

button.style.marginTop = "15px";

button.onclick = openGoogleMaps;

info.appendChild(button);



// ---------- LOAD DEFAULT ROUTE ----------

map.on("load",()=>{

    loadRoute("tuesday");

});
