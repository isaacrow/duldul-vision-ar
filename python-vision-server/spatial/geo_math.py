import math
from typing import Tuple, Dict

def compute_metric_coordinates(
    bbox: Tuple[int, int, int, int],
    frame_width: int,
    frame_height: int,
    real_height_meters: float = 0.6,
    fov_degrees: float = 55.0
) -> Dict[str, float]:
    """
    Computes 3D camera metric coordinates (X, Y, Z in meters) from 2D pixel bounding box
    using standard pinhole camera optical geometry.
    
    Coordinate convention (Right-Handed AR Frame):
    +X = Right of camera axis
    +Y = Up
    -Z = Forward into scene
    """
    x, y, w, h = bbox
    center_x = x + (w / 2.0)
    center_y = y + (h / 2.0)
    
    # Focal length in pixels
    f = (frame_height / 2.0) / math.tan(math.radians(fov_degrees / 2.0))
    
    # Distance forward (Z in meters)
    clamped_h = max(10, h)
    depth_z = (f * real_height_meters) / clamped_h
    depth_z = max(1.0, min(80.0, depth_z))
    
    # Lateral (X) and Vertical (Y) offsets in meters
    lateral_x = ((center_x - (frame_width / 2.0)) * depth_z) / f
    vertical_y = -((center_y - (frame_height / 2.0)) * depth_z) / f
    
    return {
        "x": round(lateral_x, 2),
        "y": round(vertical_y, 2),
        "z": -round(depth_z, 2), # Negative Z is forward
        "distance_meters": round(math.sqrt(lateral_x**2 + vertical_y**2 + depth_z**2), 2)
    }

def ar_to_geographic_coordinates(
    origin_lat: float,
    origin_lng: float,
    heading_degrees: float,
    ar_x: float,
    ar_y: float,
    ar_z: float
) -> Dict[str, float]:
    """
    Transforms a 3D metric camera coordinate (ar_x, ar_y, ar_z) into real-world
    geographic latitude and longitude (WGS84) based on origin GPS and heading.
    """
    heading_rad = math.radians(heading_degrees)
    
    # In AR space: forward is -ar_z, right is ar_x
    forward_meters = -ar_z
    lateral_meters = ar_x
    
    # Rotate local offsets by vehicle compass heading
    delta_north = forward_meters * math.cos(heading_rad) - lateral_meters * math.sin(heading_rad)
    delta_east  = forward_meters * math.sin(heading_rad) + lateral_meters * math.cos(heading_rad)
    
    # Earth radius approximations: 1 deg lat ~= 111,139 meters
    delta_lat = delta_north / 111139.0
    delta_lng = delta_east / (111139.0 * math.cos(math.radians(origin_lat)))
    
    return {
        "latitude": round(origin_lat + delta_lat, 7),
        "longitude": round(origin_lng + delta_lng, 7)
    }
