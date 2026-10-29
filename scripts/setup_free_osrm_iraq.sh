#!/bin/bash
# 🇮🇶 مسار العراق (Masar Iraq) — 100% Free Iraq OpenStreetMap OSRM Builder
# Downloads free Iraq OSM extract from Geofabrik and builds OSRM graph

set -e

mkdir -p ./data/osrm
cd ./data/osrm

echo "📥 1/3 Downloading free Iraq OpenStreetMap extract from Geofabrik..."
if [ ! -f "iraq-latest.osm.pbf" ]; then
  curl -L -o iraq-latest.osm.pbf https://download.geofabrik.de/asia/iraq-latest.osm.pbf
fi

echo "⚙️ 2/3 Extracting road network with car profile (Docker)..."
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/iraq-latest.osm.pbf

echo "🗺️ 3/3 Partitioning and customizing MLD routing graph..."
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-partition /data/iraq-latest.osrm
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-customize /data/iraq-latest.osrm

echo "✅ Iraq Routing Graph built successfully at ./data/osrm/iraq-latest.osrm"
echo "🚀 Run 'docker-compose up -d' to start Masar Iraq with 100% free local routing!"
