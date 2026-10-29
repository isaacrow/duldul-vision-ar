# Scraping Quarantined & Deprecated Notice

## Status: QUARANTINED FROM PRODUCTION

In compliance with the **Google Maps Platform Terms of Service (Section 3.2.3)**, automated scraping, bulk caching, extraction, and offline redistribution of Google Maps content is strictly prohibited.

### Actions Taken:
1. All scraped datasets (`places_iraq.json`) have been removed from the server startup and runtime search path.
2. The scraping script is archived and excluded from the production build pipeline.
3. The live application utilizes verified, open-license geographic data from **OpenStreetMap** and curated public civic landmarks under the Open Database License (ODbL).

### Recommended Production Alternative for Places in Iraq:
* **Overture Maps Foundation (Places Theme):** Provides over 54 million global places distributed in open GeoParquet under the CDLA-Permissive-2.0 license, backed by Meta, Amazon, Microsoft, and TomTom.
* **OpenStreetMap Nominatim / Photon:** Open-source, self-hostable geocoding engine for street and landmark search across Iraqi governorates.
