const routes = {
    tuesday: {
        day: "Tuesday",
        name: "Agric → Grailland",
        destination: "Grailland",
        google: "https://www.google.com/maps/dir/?api=1&origin=Agric%20Ikorodu&destination=Grailland%20Iju&travelmode=driving&waypoints=Berger%20Lagos%7CAkowonjo%20Lagos%7CIju%20Lagos",
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
        google: "https://www.google.com/maps/dir/?api=1&origin=Grailland%20Iju&destination=Whispering%20Palms%20Badagry&travelmode=driving&waypoints=Agege%20Lagos%7CEgbeda%20Lagos%7CLASU%20Isheri%20Lagos%7CLagos-Badagry%20Expressway%7CAradagun",
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
        google: "https://www.google.com/maps/dir/?api=1&origin=Whispering%20Palms%20Badagry&destination=Agric%20Ikorodu&travelmode=driving&waypoints=Mile%202%20Lagos%7COshodi%20Lagos%7CIkorodu%20Road%20Lagos%7CMile%2012%20Lagos",
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
