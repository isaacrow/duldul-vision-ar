import uvicorn
import os
import sys

# Ensure UTF-8 stdout on Windows
if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Ensure current directory is on python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if __name__ == "__main__":
    port = int(os.environ.get("VISION_PORT", 8000))
    print(f"Starting Duldul Autonomous Vision & OCR Server on port {port}...")
    uvicorn.run("api.main:app", host="0.0.0.0", port=port, reload=False, log_level="info")
