# Duldul Autonomous Road AI & OCR Server

Standalone high-performance Python FastAPI service for real-time computer vision, road object detection, and optical character recognition.

## Features
- **YOLOv8 Deep Learning Detector**: Detects cars, trucks, buses, motorcycles, pedestrians, and traffic signs in real time.
- **EasyOCR (Arabic & English)**: Performs genuine character recognition directly from road signs, speed limit markers, and storefronts.
- **Pinhole Metric Geometry**: Computes 3D camera metric distance $(X, Y, Z)$ using standard camera focal equations.
- **GPS Spatial Fusion**: Transforms $(X, Y, Z)$ into world $(latitude, longitude)$ based on vehicle GPS and compass heading.
- **SQLite Spatial Catalog Database**: Deduplicates and permanently archives all genuine recognized signs.
- **WebSocket Streaming**: `/ws/stream` for continuous live video feeds.

## Installation & Running
```bash
cd python-vision-server
pip install -r requirements.txt
python run_server.py
```
Default port is `8000`. Test via:
```bash
python test_client.py
```
