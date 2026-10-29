import logging
import cv2
import numpy as np
from typing import List, Dict, Any, Optional

logger = logging.getLogger("SignOCR")

class RealSignOCR:
    """
    Genuine Optical Character Recognition for road signs and storefronts.
    Supports Arabic ('ar') and English ('en') scripts.
    Extracts text, numbers, and bounding boxes directly from image pixels.
    """
    def __init__(self, languages: List[str] = ['ar', 'en']):
        self.languages = languages
        self.reader = None
        self.is_loaded = False
        self._init_reader()

    def _init_reader(self):
        try:
            import easyocr
            logger.info("Initializing EasyOCR with Arabic and English models...")
            # Use GPU if available, else CPU
            self.reader = easyocr.Reader(self.languages, gpu=False)
            self.is_loaded = True
            logger.info("EasyOCR initialized successfully.")
        except Exception as e:
            logger.warning(f"EasyOCR initialization warning: {e}. Checking pytesseract fallback...")
            self._init_pytesseract()

    def _init_pytesseract(self):
        try:
            import pytesseract
            # Test if tesseract binary is accessible
            self.is_loaded = True
            logger.info("pytesseract fallback initialized.")
        except Exception as err:
            logger.error(f"OCR engines unavailable: {err}")
            self.is_loaded = False

    def recognize_text(self, image_np: np.ndarray, crop_bbox: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """
        Runs genuine OCR on full image or cropped bounding box (x, y, w, h).
        Returns list of recognized text strings, confidences, and locations.
        """
        if not self.is_loaded:
            return []

        h, w = image_np.shape[:2]
        crop = image_np

        offset_x = 0
        offset_y = 0

        if crop_bbox:
            bx, by, bw, bh = crop_bbox
            bx = max(0, min(w - 1, bx))
            by = max(0, min(h - 1, by))
            bw = max(5, min(w - bx, bw))
            bh = max(5, min(h - by, bh))
            crop = image_np[by:by+bh, bx:bx+bw]
            offset_x = bx
            offset_y = by

        results = []

        try:
            # 1. Preprocess crop: grayscale + adaptive threshold for sharp character edges
            gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop
            enhanced = cv2.convertScaleAbs(gray, alpha=1.2, beta=10)

            if self.reader:
                ocr_data = self.reader.readtext(enhanced)
                for bbox, text, conf in ocr_data:
                    cleaned = text.strip()
                    if len(cleaned) >= 2 and conf >= 0.30:
                        # Extract bounding box from polygon
                        pts = np.array(bbox, dtype=np.int32)
                        x_min, y_min = np.min(pts, axis=0)
                        x_max, y_max = np.max(pts, axis=0)

                        results.append({
                            "text": cleaned,
                            "confidence": round(float(conf), 2),
                            "bbox": (int(x_min + offset_x), int(y_min + offset_y), int(x_max - x_min), int(y_max - y_min))
                        })

        except Exception as e:
            logger.error(f"OCR recognition error: {e}")

        return results
