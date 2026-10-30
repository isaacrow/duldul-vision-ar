import os
import zipfile
import struct

# Output directory for bundled iOS resources
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ios-app', 'DuldulVisionAR', 'Resources', 'Models'))
os.makedirs(OUTPUT_DIR, exist_ok=True)

def create_usda_cube(name, color_rgb, size_xyz=(1.0, 1.0, 1.0)):
    sx, sy, sz = [s / 2.0 for s in size_xyz]
    r, g, b = color_rgb
    return f"""#usda 1.0
(
    defaultPrim = "{name}"
    metersPerUnit = 1.0
    upAxis = "Y"
)

def Xform "{name}" (
    assetInfo = {{
        string name = "{name}"
        string version = "1.0"
    }}
)
{{
    def Mesh "Geometry"
    {{
        float3[] extent = [({-sx}, 0, {-sz}), ({sx}, {size_xyz[1]}, {sz})]
        int[] faceVertexCounts = [4, 4, 4, 4, 4, 4]
        int[] faceVertexIndices = [
            0, 1, 2, 3,
            4, 5, 6, 7,
            0, 4, 7, 3,
            1, 5, 6, 2,
            3, 2, 6, 7,
            0, 1, 5, 4
        ]
        point3f[] points = [
            ({-sx}, 0, {sz}), ({sx}, 0, {sz}), ({sx}, {size_xyz[1]}, {sz}), ({-sx}, {size_xyz[1]}, {sz}),
            ({-sx}, 0, {-sz}), ({sx}, 0, {-sz}), ({sx}, {size_xyz[1]}, {-sz}), ({-sx}, {size_xyz[1]}, {-sz})
        ]
        color3f[] primvars:displayColor = [({r:.3f}, {g:.3f}, {b:.3f})]
    }}
}}
"""

def package_usdz(filename, usda_content):
    usdz_path = os.path.join(OUTPUT_DIR, filename)
    # A USDZ file is an uncompressed zip archive containing USD files aligned to 64-byte boundaries
    with zipfile.ZipFile(usdz_path, 'w', compression=zipfile.ZIP_STORED) as zf:
        zf.writestr('model.usda', usda_content.encode('utf-8'))
    print(f"Created USDZ package: {usdz_path} ({os.path.getsize(usdz_path)} bytes)")

models = [
    ('lion_of_babylon.usdz', 'LionOfBabylon', (0.18, 0.20, 0.22), (1.95, 1.55, 1.0)),
    ('ishtar_gate.usdz', 'IshtarGate', (0.06, 0.24, 0.65), (4.5, 3.8, 1.5)),
    ('ziggurat_of_ur.usdz', 'ZigguratOfUr', (0.72, 0.58, 0.42), (5.0, 3.2, 4.0)),
    ('al_shaheed_monument.usdz', 'AlShaheedMonument', (0.10, 0.62, 0.66), (3.6, 4.0, 3.6)),
    ('astrolabe.usdz', 'AbbasidAstrolabe', (0.88, 0.70, 0.30), (0.6, 0.6, 0.15))
]

for fname, prim_name, color, size in models:
    usda = create_usda_cube(prim_name, color, size)
    package_usdz(fname, usda)
