# Family Vacation Navigator

A mobile-friendly Google Maps navigation planner for the Tuesday, Thursday, and Saturday family vacation routes.

## Features

- Embedded Google Maps route view so the in-app map uses familiar Google routing.
- Auto-selects the route for the current weekday and shows the day's plan (travel, rest, or resort day).
- Opt-in live location: tap **Use my location** to update ETA/distance and hand off live directions to Google Maps.
- Estimated ETA and remaining distance based on the saved route path.
- Route switching for Tuesday, Thursday, and Saturday, with a scrollable stop-by-stop strip.
- Per-route "Note" cards with turn-by-turn checkpoints.
- Installable PWA with an offline app shell — the interface and route notes stay available even with spotty signal (the live map still needs a connection).
- Responsive, map-first mobile layout with safe-area support for notched phones.
- Vercel-ready static deployment.

## Run locally

```bash
npm install
npm start
```

This serves the static files on a local port. Because the app registers a
service worker, use `http://localhost` (service workers require a secure
context; `localhost` counts) rather than opening `index.html` from the file
system.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Markup for the header, route picker, map pane, info panel, and note modal. |
| `style.css` | Theme tokens, responsive layout, and component styles. |
| `routes.js` | Route data plus the Google Maps embed/directions URL builders. |
| `app.js` | Route loading, distance/ETA math, geolocation, the note modal, and service-worker registration. |
| `manifest.json` / `icon.svg` | PWA metadata and app icon. |
| `sw.js` | Service worker that caches the app shell for offline use. |

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_GITHUB_USERNAME/map-navigation)

You can also deploy from the command line:

```bash
npm install
npm run deploy
```
