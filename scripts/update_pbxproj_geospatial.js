const fs = require('fs');
const path = require('path');

const pbxPath = path.join(__dirname, '..', 'ios-app', 'DuldulVisionAR', 'DuldulVisionAR.xcodeproj', 'project.pbxproj');
let content = fs.readFileSync(pbxPath, 'utf8');

// Ensure we don't duplicate if run multiple times
if (content.includes('GeospatialPlacementModel.swift')) {
    console.log('Already updated project.pbxproj');
    process.exit(0);
}

const buildFiles = [
  '\t\tAA0100302C00010000000030 /* GeospatialPlacementModel.swift in Sources */ = {isa = PBXBuildFile; fileRef = AA0200302C00010000000030 /* GeospatialPlacementModel.swift */; };',
  '\t\tAA0100312C00010000000031 /* USDZModelCatalog.swift in Sources */ = {isa = PBXBuildFile; fileRef = AA0200312C00010000000031 /* USDZModelCatalog.swift */; };',
  '\t\tAA0100322C00010000000032 /* GeoMath.swift in Sources */ = {isa = PBXBuildFile; fileRef = AA0200322C00010000000032 /* GeoMath.swift */; };',
  '\t\tAA0100332C00010000000033 /* GeospatialEngine.swift in Sources */ = {isa = PBXBuildFile; fileRef = AA0200332C00010000000033 /* GeospatialEngine.swift */; };',
  '\t\tAA0100342C00010000000034 /* Reality3DSceneManager.swift in Sources */ = {isa = PBXBuildFile; fileRef = AA0200342C00010000000034 /* Reality3DSceneManager.swift */; };',
  '\t\tAA0100352C00010000000035 /* IraqLandmarksService.swift in Sources */ = {isa = PBXBuildFile; fileRef = AA0200352C00010000000035 /* IraqLandmarksService.swift */; };',
  '\t\tAA0100362C00010000000036 /* GeospatialPersistenceService.swift in Sources */ = {isa = PBXBuildFile; fileRef = AA0200362C00010000000036 /* GeospatialPersistenceService.swift */; };',
  '\t\tAA0100372C00010000000037 /* ARGeographicStudioView.swift in Sources */ = {isa = PBXBuildFile; fileRef = AA0200372C00010000000037 /* ARGeographicStudioView.swift */; };',
  '\t\tAA0100382C00010000000038 /* GeospatialARCameraView.swift in Sources */ = {isa = PBXBuildFile; fileRef = AA0200382C00010000000038 /* GeospatialARCameraView.swift */; };',
  '\t\tAA0100392C00010000000039 /* ModelCatalogView.swift in Sources */ = {isa = PBXBuildFile; fileRef = AA0200392C00010000000039 /* ModelCatalogView.swift */; };',
  '\t\tAA01003A2C0001000000003A /* ExploreLandmarksView.swift in Sources */ = {isa = PBXBuildFile; fileRef = AA02003A2C0001000000003A /* ExploreLandmarksView.swift */; };',
  '\t\tAA01003B2C0001000000003B /* UserProfileView.swift in Sources */ = {isa = PBXBuildFile; fileRef = AA02003B2C0001000000003B /* UserProfileView.swift */; };'
].join('\r\n');

const fileRefs = [
  '\t\tAA0200302C00010000000030 /* GeospatialPlacementModel.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = GeospatialPlacementModel.swift; sourceTree = "<group>"; };',
  '\t\tAA0200312C00010000000031 /* USDZModelCatalog.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = USDZModelCatalog.swift; sourceTree = "<group>"; };',
  '\t\tAA0200322C00010000000032 /* GeoMath.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = GeoMath.swift; sourceTree = "<group>"; };',
  '\t\tAA0200332C00010000000033 /* GeospatialEngine.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = GeospatialEngine.swift; sourceTree = "<group>"; };',
  '\t\tAA0200342C00010000000034 /* Reality3DSceneManager.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = Reality3DSceneManager.swift; sourceTree = "<group>"; };',
  '\t\tAA0200352C00010000000035 /* IraqLandmarksService.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = IraqLandmarksService.swift; sourceTree = "<group>"; };',
  '\t\tAA0200362C00010000000036 /* GeospatialPersistenceService.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = GeospatialPersistenceService.swift; sourceTree = "<group>"; };',
  '\t\tAA0200372C00010000000037 /* ARGeographicStudioView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ARGeographicStudioView.swift; sourceTree = "<group>"; };',
  '\t\tAA0200382C00010000000038 /* GeospatialARCameraView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = GeospatialARCameraView.swift; sourceTree = "<group>"; };',
  '\t\tAA0200392C00010000000039 /* ModelCatalogView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ModelCatalogView.swift; sourceTree = "<group>"; };',
  '\t\tAA02003A2C0001000000003A /* ExploreLandmarksView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ExploreLandmarksView.swift; sourceTree = "<group>"; };',
  '\t\tAA02003B2C0001000000003B /* UserProfileView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = UserProfileView.swift; sourceTree = "<group>"; };'
].join('\r\n');

// Insert buildFiles
content = content.replace(
  /(\t\tAA0100242C00010000000025 \/\* TelemetrySpeedService\.swift in Sources \*\/ = [^\r\n]+;\r?\n)/,
  '$1' + buildFiles + '\r\n'
);

// Insert fileRefs
content = content.replace(
  /(\t\tAA0200252C00010000000025 \/\* TelemetrySpeedService\.swift \*\/ = [^\r\n]+;\r?\n)/,
  '$1' + fileRefs + '\r\n'
);

// Insert into Models group
content = content.replace(
  /(AA0200162C00010000000016 \/\* MonumentDiscoveryModel\.swift \*\/,\r?\n)/,
  '$1\t\t\t\tAA0200302C00010000000030 /* GeospatialPlacementModel.swift */,\r\n\t\t\t\tAA0200312C00010000000031 /* USDZModelCatalog.swift */,\r\n'
);

// Insert into Services group
content = content.replace(
  /(AA0200252C00010000000025 \/\* TelemetrySpeedService\.swift \*\/,\r?\n)/,
  '$1\t\t\t\tAA0200322C00010000000032 /* GeoMath.swift */,\r\n\t\t\t\tAA0200332C00010000000033 /* GeospatialEngine.swift */,\r\n\t\t\t\tAA0200342C00010000000034 /* Reality3DSceneManager.swift */,\r\n\t\t\t\tAA0200352C00010000000035 /* IraqLandmarksService.swift */,\r\n\t\t\t\tAA0200362C00010000000036 /* GeospatialPersistenceService.swift */,\r\n'
);

// Insert into Views group
content = content.replace(
  /(AA02000F2C0001000000000F \/\* LiquidGlassModifier\.swift \*\/,\r?\n)/,
  '$1\t\t\t\tAA0200372C00010000000037 /* ARGeographicStudioView.swift */,\r\n\t\t\t\tAA0200382C00010000000038 /* GeospatialARCameraView.swift */,\r\n\t\t\t\tAA0200392C00010000000039 /* ModelCatalogView.swift */,\r\n\t\t\t\tAA02003A2C0001000000003A /* ExploreLandmarksView.swift */,\r\n\t\t\t\tAA02003B2C0001000000003B /* UserProfileView.swift */,\r\n'
);

// Insert into PBXSourcesBuildPhase
const sourcePhaseFiles = [
  '\t\t\t\tAA0100302C00010000000030 /* GeospatialPlacementModel.swift in Sources */,',
  '\t\t\t\tAA0100312C00010000000031 /* USDZModelCatalog.swift in Sources */,',
  '\t\t\t\tAA0100322C00010000000032 /* GeoMath.swift in Sources */,',
  '\t\t\t\tAA0100332C00010000000033 /* GeospatialEngine.swift in Sources */,',
  '\t\t\t\tAA0100342C00010000000034 /* Reality3DSceneManager.swift in Sources */,',
  '\t\t\t\tAA0100352C00010000000035 /* IraqLandmarksService.swift in Sources */,',
  '\t\t\t\tAA0100362C00010000000036 /* GeospatialPersistenceService.swift in Sources */,',
  '\t\t\t\tAA0100372C00010000000037 /* ARGeographicStudioView.swift in Sources */,',
  '\t\t\t\tAA0100382C00010000000038 /* GeospatialARCameraView.swift in Sources */,',
  '\t\t\t\tAA0100392C00010000000039 /* ModelCatalogView.swift in Sources */,',
  '\t\t\t\tAA01003A2C0001000000003A /* ExploreLandmarksView.swift in Sources */,',
  '\t\t\t\tAA01003B2C0001000000003B /* UserProfileView.swift in Sources */,'
].join('\r\n');

content = content.replace(
  /(AA0100242C00010000000025 \/\* TelemetrySpeedService\.swift in Sources \*\/,\r?\n)/,
  '$1' + sourcePhaseFiles + '\r\n'
);

fs.writeFileSync(pbxPath, content, 'utf8');
console.log('Successfully updated project.pbxproj with all 12 Geospatial AR modules.');
