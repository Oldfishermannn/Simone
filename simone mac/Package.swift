// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Simone",
    platforms: [
        .macOS(.v14),
        .iOS(.v17)
    ],
    targets: [
        .executableTarget(
            name: "Simone",
            path: "Simone"
        ),
        .testTarget(
            name: "SimoneTests",
            dependencies: ["Simone"],
            path: "SimoneTests"
        )
    ]
)
