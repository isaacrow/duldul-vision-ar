// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "DuldulVisionAR",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "DuldulVisionAR",
            targets: ["DuldulVisionAR"]
        )
    ],
    targets: [
        .target(
            name: "DuldulVisionAR",
            path: "Sources"
        )
    ]
)
