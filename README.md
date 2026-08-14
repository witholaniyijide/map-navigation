# Family Vacation Navigator

A mobile-friendly Mapbox navigation planner for the Tuesday, Thursday, and Saturday family vacation routes.

## Features

- Mapbox GL map with real Mapbox Directions API routing for drivable roads.
- Live GPS marker with high-accuracy geolocation.
- ETA and remaining-distance cards from Mapbox route summaries.
- Route switching for Tuesday, Thursday, and Saturday.
- Follow My Location toggle.
- Google Maps fallback links for every route.
- Vercel-ready static deployment.

## Mapbox token

Replace `PASTE_YOUR_MAPBOX_ACCESS_TOKEN_HERE` in `app.js`, or define `window.MAPBOX_ACCESS_TOKEN` before `app.js` loads.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_GITHUB_USERNAME/map-navigation)

You can also deploy from the command line:

```bash
npm install
npm run deploy
```
