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
