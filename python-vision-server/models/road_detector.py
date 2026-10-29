import logging
from typing import List, Dict, Any
import numpy as np

logger = logging.getLogger("RoadDetector")

class RealRoadDetector:
    """
    On-device / local server deep learning object detector for autonomous road perception.
    Powered by Ultralytics YOLOv8 (MobileNet/Nano backend).
    ZERO fake simulations. Real tensor inferences.
    """
    def __init__(self, model_name: str = "yolov8n.pt"):
        self.model_name = model_name
        self.model = None
        self.is_loaded = False
        self._load_model()

    def _load_model(self):
        try:
            from ultralytics import YOLO
            logger.info(f"Loading YOLOv8 weights: {self.model_name}...")
            self.model = YOLO(self.model_name)
            self.is_loaded = True
            logger.info("YOLOv8 Road Detector loaded successfully.")
        except Exception as e:
            logger.warning(f"Ultralytics YOLOv8 not available, falling back to TorchVision or Lightweight Detector: {e}")
            self._load_fallback()

    def _load_fallback(self):
        try:
            import torchvision
            from torchvision.models.detection import fasterrcnn_mobilenet_v3_large_320_fpn, FasterRCNN_MobileNet_V3_Large_320_FPN_Weights
            weights = FasterRCNN_MobileNet_V3_Large_320_FPN_Weights.DEFAULT
            self.model = fasterrcnn_mobilenet_v3_large_320_fpn(weights=weights)
            self.model.eval()
            self.is_loaded = True
            logger.info("TorchVision MobileNet V3 Detector loaded.")
        except Exception as err:
            logger.error(f"Fallback detector initialization error: {err}")
            self.model = None

    def detect(self, image_np: np.ndarray, conf_threshold: float = 0.35) -> List[Dict[str, Any]]:
        """
        Runs object detection inference on raw BGR or RGB numpy image.
        Returns list of detected road objects with bounding boxes and classes.
        """
        if not self.is_loaded or self.model is None:
            return []

        detections = []
        h, w = image_np.shape[:2]

        try:
            # Check if Ultralytics YOLO model
            if hasattr(self.model, "predict"):
                results = self.model.predict(source=image_np, conf=conf_threshold, verbose=False)
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        cls_id = int(box.cls[0])
                        class_name = self.model.names[cls_id]
                        conf = float(box.conf[0])
                        xyxy = box.xyxy[0].cpu().numpy()
                        x1, y1, x2, y2 = int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])
                        
                        bw = max(1, x2 - x1)
                        bh = max(1, y2 - y1)

                        is_vehicle = class_name in ['car', 'truck', 'bus', 'motorcycle']
                        is_pedestrian = class_name in ['person', 'bicycle']
                        is_sign = class_name in ['traffic light', 'stop sign']

                        detections.append({
                            "class": class_name,
                            "label_ar": self._translate(class_name),
                            "confidence": round(conf, 2),
                            "bbox": (x1, y1, bw, bh),
                            "is_vehicle": is_vehicle,
                            "is_pedestrian": is_pedestrian,
                            "is_sign": is_sign,
                            "real_height_meters": self._estimate_height(class_name)
                        })

        except Exception as e:
            logger.error(f"Inference error: {e}")

        return detections

    def _estimate_height(self, class_name: str) -> float:
        heights = {
            'car': 1.5,
            'truck': 2.9,
            'bus': 3.2,
            'motorcycle': 1.2,
            'person': 1.7,
            'bicycle': 1.1,
            'traffic light': 0.85,
            'stop sign': 0.75
        }
        return heights.get(class_name, 1.5)

    def _translate(self, c: str) -> str:
        translations = {
            'car': 'سيارة',
            'truck': 'شاحنة',
            'bus': 'حافلة / باص',
            'motorcycle': 'دراجة نارية',
            'person': 'مشاة / شخص',
            'bicycle': 'دراجة هوائية',
            'traffic light': 'إشارة ضوئية',
            'stop sign': 'شاخصة توقف'
        }
        return translations.get(c, c)
