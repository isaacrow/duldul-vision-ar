# Masar Iraq (دلدل) - Native Android Autonomous Vision App

High-performance native Android automotive navigation app featuring:
- **Real On-Device Neural Vision (Google ML Kit)**: Hardware camera OCR and road sign detection (`RoadSignVisionAnalyzer.kt`).
- **Physical Depth & GPS Fusion**: Pinhole camera trigonometric depth estimation + spherical coordinate transformation to real-world WGS84 GPS latitude & longitude.
- **Tesla FSD-Style Vector AR HUD**: `TeslaVisionAROverlayView.kt` with cyber brackets and liquid glass badges.
- **100% Free MapLibre Native SDK**: Zero Google Maps API keys or subscriptions required.

## Building & Running
1. Open the `mobile-app` directory in **Android Studio** (Hedgehog, Iguana, or Koala).
2. Connect an Android phone with USB debugging enabled.
3. Click **Run** (`Shift + F10`).
