/**
 * Duldul Real On-Device AI Vision Model & Neural Object Detection Engine
 * Powered by TensorFlow.js (WebGL Backend) & COCO-SSD MobileNet.
 * 100% REAL Machine Learning running on the user's phone GPU.
 * ZERO fake simulations, ZERO hardcoded sine waves.
 */

(function(window) {
  'use strict';

  class RealOnDeviceVisionAI {
    constructor() {
      this.model = null;
      this.isLoading = false;
      this.isReady = false;
      this.video = null;
      this.canvas = null;
      this.ctx = null;
      this.animFrameId = null;
      this.inferenceInterval = null;

      // Detection State
      this.realDetections = [];
      this.lastInferenceTime = 0;
      this.fps = 0;

      // Optical Camera Calibration Constants (Pinhole Camera Model)
      // Standard mobile phone camera vertical FOV ~55 degrees
      this.typicalHeights = {
        'car': 1.5,
        'truck': 2.8,
        'bus': 3.2,
        'motorcycle': 1.2,
        'bicycle': 1.1,
        'person': 1.7,
        'traffic light': 0.8,
        'stop sign': 0.75
      };

      this.listeners = {
        detections: [],
        ready: []
      };
    }

    async init(videoElement) {
      this.video = videoElement;
      if (this.isReady) return;

      this.isLoading = true;
      console.log('🧠 [RealVisionAI] Loading TensorFlow.js and COCO-SSD MobileNet...');

      try {
        // Ensure WebGL backend is active for GPU acceleration
        if (window.tf) {
          await tf.setBackend('webgl');
          await tf.ready();
          console.log('⚡ [RealVisionAI] TensorFlow WebGL GPU Backend Active:', tf.getBackend());
        }

        if (window.cocoSsd) {
          this.model = await cocoSsd.load({ base: 'mobilenet_v2' });
          this.isReady = true;
          this.isLoading = false;
          console.log('✅ [RealVisionAI] REAL Neural Network Model loaded into Phone GPU memory!');
          this.emit('ready', { model: 'COCO-SSD MobileNet V2', backend: tf.getBackend() });
        } else {
          throw new Error('cocoSsd library not loaded');
        }
      } catch (err) {
        console.error('❌ [RealVisionAI] Neural model loading error:', err);
        this.isLoading = false;
      }
    }

    startInferenceLoop(targetFps = 10) {
      if (!this.isReady || !this.model || !this.video) {
        console.warn('⚠️ [RealVisionAI] Waiting for model and camera feed to start inference...');
        setTimeout(() => this.startInferenceLoop(targetFps), 400);
        return;
      }

      const intervalMs = Math.round(1000 / targetFps);
      let isBusy = false;

      this.inferenceInterval = setInterval(async () => {
        if (isBusy || this.video.readyState < 2) return;
        isBusy = true;
        const start = performance.now();

        try {
          // REAL Neural Network Inference on the actual camera frame
          const rawPredictions = await this.model.detect(this.video);
          const end = performance.now();
          this.fps = Math.round(1000 / (end - start));

          // Process real bounding boxes into 3D metric coordinates
          this.realDetections = this.transformPredictionsToMetric(rawPredictions);
          this.emit('detections', this.realDetections);
        } catch (e) {
          console.warn('[RealVisionAI] Detection frame error:', e.message);
        } finally {
          isBusy = false;
        }
      }, intervalMs);
    }

    stopInferenceLoop() {
      if (this.inferenceInterval) {
        clearInterval(this.inferenceInterval);
        this.inferenceInterval = null;
      }
      this.realDetections = [];
    }

    /**
     * Compute Real Physical Metric Coordinates from Real Bounding Boxes
     * Formula: Z = (f * H_real) / h_pixels
     */
    transformPredictionsToMetric(predictions) {
      if (!this.video) return [];
      const videoWidth = this.video.videoWidth || 640;
      const videoHeight = this.video.videoHeight || 480;

      // Estimated focal length in pixels for mobile camera
      const f = (videoHeight / 2) / Math.tan((55 / 2) * (Math.PI / 180));

      return predictions.map((pred, index) => {
        const [x, y, width, height] = pred.bbox;
        const className = pred.class.toLowerCase();
        const score = Math.round(pred.score * 100);

        // Real Physical Height in meters for this class
        const realHeightM = this.typicalHeights[className] || 1.5;

        // Metric depth (distance forward in meters)
        const depthMeters = Math.max(0.5, Math.min(80, (f * realHeightM) / Math.max(10, height)));

        // Lateral position (meters left or right of camera optical axis)
        const centerX = x + (width / 2);
        const lateralOffsetPx = centerX - (videoWidth / 2);
        const lateralMeters = (lateralOffsetPx * depthMeters) / f;

        return {
          id: `det-${index}-${className}`,
          class: className,
          labelArabic: this.translateClass(className),
          score: score,
          bbox: { x, y, width, height },
          depthMeters: Math.round(depthMeters * 10) / 10,
          lateralMeters: Math.round(lateralMeters * 10) / 10,
          isVehicle: ['car', 'truck', 'bus', 'motorcycle'].includes(className),
          isPedestrian: ['person', 'bicycle'].includes(className),
          isTrafficSign: ['traffic light', 'stop sign'].includes(className)
        };
      });
    }

    translateClass(c) {
      switch (c) {
        case 'car': return 'سيارة';
        case 'truck': return 'شاحنة';
        case 'bus': return 'حافلة / باص';
        case 'motorcycle': return 'دراجة نارية';
        case 'person': return 'مشاة / شخص';
        case 'bicycle': return 'دراجة هوائية';
        case 'traffic light': return 'إشارة ضوئية';
        case 'stop sign': return 'علامة توقف';
        case 'cell phone': return 'هاتف محمول';
        case 'bottle': return 'قنينة';
        case 'chair': return 'كرسي';
        default: return c;
      }
    }

    // --- Developer API Event System ---
    on(event, callback) {
      if (this.listeners[event]) this.listeners[event].push(callback);
    }

    off(event, callback) {
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      }
    }

    emit(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(cb => {
          try { cb(data); } catch (e) { console.error('Vision API callback error:', e); }
        });
      }
    }

    getDetections() {
      return this.realDetections;
    }
  }

  // Global Singleton
  window.DuldulLocalVisionAI = new RealOnDeviceVisionAI();

})(window);
