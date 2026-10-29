# دلدل — Duldul

**A community navigation pilot focused on Iraq.** The current build is a working prototype, not a full replacement for established navigation networks.

## What works today

- Online map display with MapLibre, CARTO, and OpenStreetMap attribution.
- GPS-based route requests through Mapbox Directions when configured, otherwise through OSRM.
- Route alternatives returned by the routing provider. These are the provider's available alternatives, not every mathematically possible route.
- Off-route detection and route recalculation.
- Community incident reports with confirmation and dismissal votes.
- Optional community speed sharing during active navigation.
- A service worker that can cache the app shell. Map tiles and routing still require a network connection.

## How community speed learning works

Speed sharing is **off by default**. A driver must turn it on in the route panel. The app sends a reading only while navigation is active and GPS accuracy is 35 metres or better.

The server rounds readings into roughly 1 km cells and five-minute time buckets. It does not write exact GPS coordinates, individual speeds, route histories, or session IDs to the traffic aggregate file. A signal is saved and shown only after at least three distinct temporary sessions contribute to the same cell and time bucket. Published aggregates expire after 24 hours; the map shows only signals from the last 15 minutes.

Route estimates use community speeds only when qualifying observations cover at least half the route geometry. Other portions use the routing provider's estimate. Grid cells do not identify a specific lane or direction, so early community estimates can be coarse. The bridge panel uses the same nearby cell signals and reports “no data” until enough drivers contribute.

The system starts with no crowd traffic. Useful coverage depends on real drivers opting in.

## Current limits

- Without a Mapbox token, OSRM supplies standard route estimates, not live traffic. Public OSRM availability and limits are outside this app's control.
- A configured Mapbox token may incur charges under the account's plan.
- Place search uses a small built-in pilot list; it is not a full geocoder.
- The fuel endpoint contains a small location list. It does not provide verified live queue times.
- Full offline maps and offline routing are not available.
- The speed-limit display is intentionally blank until a sourced speed-limit dataset is connected.
- Community reports are user-submitted and remain unconfirmed until other drivers review them.

## Run locally

Requirements: Node.js 18 or newer.

~~~bash
npm install
npm start
~~~

Open http://localhost:3000. Do not open the project folder or public/index.html with a file URL; the page needs the server APIs.

For live Mapbox routing, set MAPBOX_ACCESS_TOKEN in the server process environment. To use a self-hosted OSRM instance, set OSRM_BACKEND_URL. The example environment file documents variables but the Node server does not automatically load it.

To build the local Iraq OSRM graph, run scripts/setup_free_osrm_iraq.sh in an environment with Docker and then start the compose stack. The graph must be built first; the compose file alone does not create it.

## Data and attribution

Map data: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright). Base map tiles and style: © [CARTO](https://carto.com/attributions). Route availability and estimates depend on the configured provider.

The legacy npm test script currently targets a running server and writes incident fixtures to the project data file. It needs isolation before it is safe to run against a live dataset.
