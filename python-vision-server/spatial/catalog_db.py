import sqlite3
import os
import time
import math
from typing import List, Dict, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "spatial_catalog.db")

class SpatialCatalogDB:
    def __init__(self, db_path: str = DB_FILE):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_schema()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_schema(self):
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS spatial_pois (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    ar_x REAL NOT NULL,
                    ar_y REAL NOT NULL,
                    ar_z REAL NOT NULL,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    distance_meters REAL NOT NULL,
                    first_seen_timestamp INTEGER NOT NULL,
                    last_seen_timestamp INTEGER NOT NULL,
                    sightings_count INTEGER DEFAULT 1
                )
            """)
            conn.commit()

    def ingest_poi(
        self,
        name: str,
        category: str,
        confidence: float,
        ar_coords: Dict[str, float],
        geo_coords: Dict[str, float],
        distance_meters: float
    ) -> Dict:
        now = int(time.time() * 1000)
        
        # Deduplication check: Within 2.5 meters
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM spatial_pois")
            rows = cursor.fetchall()
            
            for row in rows:
                dx = row["ar_x"] - ar_coords["x"]
                dy = row["ar_y"] - ar_coords["y"]
                dz = row["ar_z"] - ar_coords["z"]
                dist_3d = math.sqrt(dx*dx + dy*dy + dz*dz)
                
                # Check spatial closeness or identical text
                if dist_3d < 2.5 or (name.strip() and name.strip() == row["name"].strip() and dist_3d < 8.0):
                    cursor.execute("""
                        UPDATE spatial_pois
                        SET last_seen_timestamp = ?,
                            sightings_count = sightings_count + 1,
                            confidence = MAX(confidence, ?)
                        WHERE id = ?
                    """, (now, confidence, row["id"]))
                    conn.commit()
                    
                    return {
                        "action": "updated",
                        "id": row["id"],
                        "name": row["name"],
                        "category": row["category"],
                        "confidence": max(row["confidence"], confidence),
                        "geo": {"latitude": row["latitude"], "longitude": row["longitude"]},
                        "distance_meters": distance_meters
                    }

            # Insert new POI
            new_id = f"poi-vis-{int(time.time())}-{os.urandom(3).hex()}"
            cursor.execute("""
                INSERT INTO spatial_pois (
                    id, name, category, confidence, ar_x, ar_y, ar_z,
                    latitude, longitude, distance_meters,
                    first_seen_timestamp, last_seen_timestamp, sightings_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (
                new_id, name, category, confidence,
                ar_coords["x"], ar_coords["y"], ar_coords["z"],
                geo_coords["latitude"], geo_coords["longitude"], distance_meters,
                now, now
            ))
            conn.commit()
            
            return {
                "action": "created",
                "id": new_id,
                "name": name,
                "category": category,
                "confidence": confidence,
                "geo": geo_coords,
                "distance_meters": distance_meters
            }

    def get_all(self, category: Optional[str] = None) -> List[Dict]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if category:
                cursor.execute("SELECT * FROM spatial_pois WHERE category = ? ORDER BY last_seen_timestamp DESC", (category,))
            else:
                cursor.execute("SELECT * FROM spatial_pois ORDER BY last_seen_timestamp DESC")
            
            rows = cursor.fetchall()
            return [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "category": r["category"],
                    "confidence": r["confidence"],
                    "spatial_coordinates": {
                        "local_ar": {"x": r["ar_x"], "y": r["ar_y"], "z": r["ar_z"]},
                        "estimated_geo": {"latitude": r["latitude"], "longitude": r["longitude"]}
                    },
                    "visual_anchor": {
                        "distance_meters": r["distance_meters"],
                        "first_seen_timestamp": r["first_seen_timestamp"],
                        "last_seen_timestamp": r["last_seen_timestamp"],
                        "sightings_count": r["sightings_count"]
                    }
                }
                for r in rows
            ]

    def clear(self):
        with self._get_connection() as conn:
            conn.execute("DELETE FROM spatial_pois")
            conn.commit()
