import requests
import json
import numpy as np
import cv2

def create_synthetic_test_frame():
    """Generates a test frame with road background and a sign for API testing."""
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    frame[:240] = [60, 40, 20]   # Sky
    frame[240:] = [40, 40, 40]   # Road
    
    # Draw sign board with text "BAGHDAD" and "STOP"
    cv2.rectangle(frame, (220, 140), (420, 240), (255, 255, 255), -1)
    cv2.rectangle(frame, (225, 145), (415, 235), (0, 0, 180), -1)
    cv2.putText(frame, "STOP", (260, 200), cv2.FONT_HERSHEY_SIMPLEX, 1.4, (255, 255, 255), 3)
    
    _, encoded = cv2.imencode(".jpg", frame)
    return encoded.tobytes()

def run_tests():
    url = "http://localhost:8000"
    print(f"Testing Vision Server at {url}...")
    
    try:
        # 1. Health check
        res = requests.get(f"{url}/")
        print("Root Status:", res.status_code, res.json())
        
        # 2. Post frame
        img_bytes = create_synthetic_test_frame()
        files = {"file": ("frame.jpg", img_bytes, "image/jpeg")}
        data = {
            "latitude": 33.3152,
            "longitude": 44.3661,
            "heading": 45.0
        }
        res = requests.post(f"{url}/api/vision/frame", files=files, data=data)
        print("Frame Inference Status:", res.status_code)
        print("Result:", json.dumps(res.json(), indent=2))
        
        # 3. Query Catalog
        cat_res = requests.get(f"{url}/api/spatial/catalog")
        print("Catalog Status:", cat_res.status_code, cat_res.json())
        
    except Exception as e:
        print("Test error (make sure server is running):", e)

if __name__ == "__main__":
    run_tests()
