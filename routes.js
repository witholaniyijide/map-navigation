const routes = {
    tuesday: {
        day: "Tuesday",
        name: "Agric → Grailland",
        destination: "Grailland",
        google: "https://www.google.com/maps/dir/?api=1&origin=Agric%20Ikorodu&destination=Grailland%20Iju&travelmode=driving&waypoints=Berger%20Lagos%7CAkowonjo%20Lagos%7CIju%20Lagos",
        center: [3.325, 6.647],
        zoom: 10.5,
        stops: ["Agric", "Berger", "Akowonjo", "Iju", "Grailland"],
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
