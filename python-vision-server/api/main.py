import os
import cv2
import numpy as np
import logging
from fastapi import FastAPI, File, UploadFile, Form, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from models.road_detector import RealRoadDetector
from models.sign_ocr import RealSignOCR
from spatial.geo_math import compute_metric_coordinates, ar_to_geographic_coordinates
from spatial.catalog_db import SpatialCatalogDB

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("VisionServer")

app = FastAPI(
    title="Duldul Autonomous Road Vision & OCR API",
    description="Real-time on-device deep learning road perception, optical character recognition, and spatial GPS cataloging.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Deep Learning Models & DB
detector = RealRoadDetector()
ocr_engine = RealSignOCR()
catalog_db = SpatialCatalogDB()

class CatalogManualRequest(BaseModel):
    name: str
    category: str = "traffic_sign"
    confidence: float = 0.95
    latitude: float
    longitude: float
    ar_x: float = 0.0
    ar_y: float = 0.0
    ar_z: float = -6.0

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Duldul Real Autonomous Road AI & OCR",
        "detector_loaded": detector.is_loaded,
        "ocr_loaded": ocr_engine.is_loaded
    }

@app.post("/api/vision/frame")
async def process_frame(
    file: UploadFile = File(...),
    latitude: float = Form(33.3152),
    longitude: float = Form(44.3661),
    heading: float = Form(0.0)
):
    """
    Ingests live camera frame + GPS telemetry from phone/dashcam.
    Runs real object detection (vehicles, pedestrians, signs) and OCR.
    Computes metric depth and exact geographic GPS coordinates for detected signs.
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image encoding")

        h, w = img.shape[:2]

        # 1. Run Real Object Detection
        detections = detector.detect(img)

        # 2. Run Genuine OCR across the frame or detected sign boxes
        ocr_signs = []
        sign_detections = [d for d in detections if d.get("is_sign")]

        if sign_detections:
            for s in sign_detections:
                text_results = ocr_engine.recognize_text(img, crop_bbox=s["bbox"])
                for tr in text_results:
                    ocr_signs.append(tr)
        else:
            # Full frame OCR scan for road signs/storefronts
            ocr_signs = ocr_engine.recognize_text(img)

        # 3. Transform Detections & Signs into 3D Metric and Geographic Space
        processed_objects = []
        cataloged_pois = []

        for det in detections:
            metric = compute_metric_coordinates(
                bbox=det["bbox"],
                frame_width=w,
                frame_height=h,
                real_height_meters=det["real_height_meters"]
            )
            geo = ar_to_geographic_coordinates(
                origin_lat=latitude,
                origin_lng=longitude,
                heading_degrees=heading,
                ar_x=metric["x"],
                ar_y=metric["y"],
                ar_z=metric["z"]
            )
            processed_objects.append({
                "class": det["class"],
                "label_ar": det["label_ar"],
                "confidence": det["confidence"],
                "bbox": det["bbox"],
                "metric_3d": metric,
                "geographic": geo
            })

        for sign in ocr_signs:
            metric = compute_metric_coordinates(
                bbox=sign["bbox"],
                frame_width=w,
                frame_height=h,
                real_height_meters=0.55
            )
            geo = ar_to_geographic_coordinates(
                origin_lat=latitude,
                origin_lng=longitude,
                heading_degrees=heading,
                ar_x=metric["x"],
                ar_y=metric["y"],
                ar_z=metric["z"]
            )

            # Auto-catalog recognized text to spatial database
            catalog_entry = catalog_db.ingest_poi(
                name=sign["text"],
                category="traffic_sign" if ("توقف" in sign["text"] or "stop" in sign["text"].lower()) else "storefront",
                confidence=sign["confidence"],
                ar_coords=metric,
                geo_coords=geo,
                distance_meters=metric["distance_meters"]
            )
            cataloged_pois.append(catalog_entry)

        return {
            "status": "ok",
            "frame_dimensions": {"width": w, "height": h},
            "detected_objects": processed_objects,
            "recognized_signs": ocr_signs,
            "cataloged_pois": cataloged_pois
        }

    except Exception as e:
        logger.error(f"Frame processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/spatial/catalog")
def get_catalog(category: Optional[str] = None):
    pois = catalog_db.get_all(category)
    return {
        "status": "ok",
        "count": len(pois),
        "pois": pois
    }

@app.delete("/api/spatial/catalog")
def clear_catalog():
    catalog_db.clear()
    return {"status": "ok", "message": "Spatial catalog database reset to 0 entries."}

@app.post("/api/spatial/catalog/manual")
def add_manual(req: CatalogManualRequest):
    entry = catalog_db.ingest_poi(
        name=req.name,
        category=req.category,
        confidence=req.confidence,
        ar_coords={"x": req.ar_x, "y": req.ar_y, "z": req.ar_z},
        geo_coords={"latitude": req.latitude, "longitude": req.longitude},
        distance_meters=round((req.ar_x**2 + req.ar_y**2 + req.ar_z**2)**0.5, 2)
    )
    return {"status": "ok", "entry": entry}

@app.websocket("/ws/stream")
async def websocket_video_stream(websocket: WebSocket):
    await websocket.accept()
    logger.info("Client connected to real-time video stream WebSocket.")
    try:
        while True:
            # Expects binary frame buffer from phone camera
            data = await websocket.receive_bytes()
            nparr = np.frombuffer(data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is not None:
                h, w = img.shape[:2]
                detections = detector.detect(img)
                response = {
                    "count": len(detections),
                    "detections": [
                        {
                            "class": d["class"],
                            "label_ar": d["label_ar"],
                            "confidence": d["confidence"],
                            "bbox": d["bbox"]
                        } for d in detections
                    ]
                }
                await websocket.send_json(response)
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected.")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
