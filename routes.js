function encodePlace(place) {
    return encodeURIComponent(place);
}

function buildGoogleDirections(origin, destination, waypoints = []) {
    const params = new URLSearchParams({
        api: "1",
        origin,
        destination,
        travelmode: "driving"
    });

    if (waypoints.length) {
        params.set("waypoints", waypoints.join("|"));
    }

    return `https://www.google.com/maps/dir/?${params}`;
}

function buildGoogleMapEmbed(query) {
    return `https://www.google.com/maps?q=${encodePlace(query)}&output=embed`;
}

function buildLiveGoogle(route, userLocation) {
    const [lng, lat] = userLocation;
    const origin = `${lat},${lng}`;

    return buildGoogleDirections(origin, route.destinationQuery, route.waypointQueries);
}

const routes = {
    tuesday: {
        day: "Tuesday",
        name: "Agric → Grailland",
        destination: "Grailland",
        originQuery: "Agric Ikorodu",
        destinationQuery: "Grailland Iju",
        waypointQueries: ["Berger Lagos", "Akowonjo Lagos", "Iju Lagos"],
        google: buildGoogleDirections("Agric Ikorodu", "Grailland Iju", ["Berger Lagos", "Akowonjo Lagos", "Iju Lagos"]),
        embed: buildGoogleMapEmbed("Grailland Iju"),
        liveGoogle(userLocation) {
            return buildLiveGoogle(this, userLocation);
        },
        center: [3.325, 6.647],
        zoom: 10.5,
        stops: ["Agric", "Berger", "Akowonjo", "Iju", "Grailland"],
        noteTitle: "From Agric to Grailland",
        noteSteps: [
            "Start from Agric in Ikorodu and move out toward the main Ikorodu Road corridor.",
            "Continue toward Berger, using it as the first major navigation checkpoint before crossing deeper into the mainland route.",
            "Proceed from Berger toward Akowonjo, keeping Akowonjo as the next notable stop on the way to the Agege/Iju axis.",
            "Move from Akowonjo toward Iju, then follow the local roads toward the final Grailland stop.",
            "Arrive at Grailland and use the Google Maps button if turn-by-turn road guidance is needed."
        ],
        coordinates: [
            [3.5154, 6.6194],
            [3.3797, 6.6370],
            [3.3128, 6.6050],
            [3.2550, 6.6760],
            [3.2470, 6.6980]
        ]
    },
    thursday: {
        day: "Thursday",
        name: "Grailland → Whimspring Palms",
        destination: "Whimspring Palms",
        originQuery: "Grailland Iju",
        destinationQuery: "Whispering Palms Badagry",
        waypointQueries: ["Agege Lagos", "Egbeda Lagos", "LASU Isheri Lagos", "Lagos-Badagry Expressway", "Aradagun"],
        google: buildGoogleDirections("Grailland Iju", "Whispering Palms Badagry", ["Agege Lagos", "Egbeda Lagos", "LASU Isheri Lagos", "Lagos-Badagry Expressway", "Aradagun"]),
        embed: buildGoogleMapEmbed("Whispering Palms Badagry"),
        liveGoogle(userLocation) {
            return buildLiveGoogle(this, userLocation);
        },
        center: [3.05, 6.50],
        zoom: 9,
        stops: ["Grailland", "Agege", "Egbeda", "LASU-Isheri Axis", "Lagos-Badagry Expressway", "Aradagun", "Whimspring Palms"],
        noteTitle: "From Grailland to Whimspring Palms",
        noteSteps: [
            "Leave Grailland and move toward Agege as the first notable checkpoint.",
            "Continue from Agege toward Egbeda, staying on the mainland connector route.",
            "Proceed from Egbeda toward the LASU-Isheri axis before joining the wider westbound corridor.",
            "Move from the LASU-Isheri axis toward the Lagos-Badagry Expressway and continue westbound.",
            "Use Aradagun as the last major checkpoint before entering the Whimspring Palms/Badagry area.",
            "Arrive at Whimspring Palms and open Google Maps for turn-by-turn final approach guidance if needed."
        ],
        coordinates: [
            [3.2470, 6.6980],
            [3.2580, 6.6480],
            [3.2730, 6.6180],
            [3.1600, 6.5180],
            [2.9500, 6.4700],
            [2.8000, 6.4300],
            [2.7600, 6.4200]
        ]
    },
    saturday: {
        day: "Saturday",
        name: "Return Home",
        destination: "Agric",
        originQuery: "Whispering Palms Badagry",
        destinationQuery: "Agric Ikorodu",
        waypointQueries: ["Mile 2 Lagos", "Oshodi Lagos", "Ikorodu Road Lagos", "Mile 12 Lagos"],
        google: buildGoogleDirections("Whispering Palms Badagry", "Agric Ikorodu", ["Mile 2 Lagos", "Oshodi Lagos", "Ikorodu Road Lagos", "Mile 12 Lagos"]),
        embed: buildGoogleMapEmbed("Agric Ikorodu"),
        liveGoogle(userLocation) {
            return buildLiveGoogle(this, userLocation);
        },
        center: [3.35, 6.56],
        zoom: 9,
        stops: ["Whimspring Palms", "Lagos-Badagry Expressway", "Mile 2", "Oshodi", "Ikorodu Road", "Mile 12", "Agric"],
        noteTitle: "From Whimspring Palms back to Agric (Home)",
        noteSteps: [
            "Depart Whimspring Palms and return toward the Lagos-Badagry Expressway.",
            "Continue eastbound along the Lagos-Badagry corridor toward Mile 2.",
            "Move from Mile 2 toward Oshodi, using Oshodi as the next major mainland interchange.",
            "Proceed from Oshodi toward Ikorodu Road and continue in the direction of Mile 12.",
            "Use Mile 12 as the final major checkpoint before heading back into the Ikorodu/Agric area.",
            "Arrive back at Agric, home."
        ],
        coordinates: [
            [2.7600, 6.4200],
            [2.9500, 6.4700],
            [3.2200, 6.4700],
            [3.3200, 6.5400],
            [3.3900, 6.5600],
            [3.4700, 6.6100],
            [3.5154, 6.6194]
        ]
    }
};
