import SwiftUI
import AppKit

@main
struct SimoneApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some SwiftUI.Scene {
        Settings {
            EmptyView()
        }
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var statusItem: NSStatusItem!
    private var window: NSWindow!

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Show in dock
        NSApp.setActivationPolicy(.regular)

        // Create status bar item
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = statusItem.button {
            button.image = NSImage(systemSymbolName: "music.note", accessibilityDescription: "Simone")
            button.action = #selector(toggleWindow)
            button.target = self
        }

        // Create window with title bar (close/minimize/zoom)
        let contentView = ContentView()
        let hostingView = NSHostingView(rootView: contentView)

        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 300, height: 520),
            styleMask: [.borderless, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.contentView = hostingView
        window.title = "Simone"
        window.isMovableByWindowBackground = true
        window.backgroundColor = .clear
        window.isOpaque = false
        window.hasShadow = true
        window.isReleasedWhenClosed = false
        window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        window.level = .floating
        window.center()

        // Observe content size changes
        hostingView.setFrameSize(hostingView.fittingSize)
        NotificationCenter.default.addObserver(
            forName: NSView.frameDidChangeNotification,
            object: hostingView,
            queue: .main
        ) { [weak self] _ in
            self?.updateWindowSize()
        }
        hostingView.postsFrameChangedNotifications = true

        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    @objc private func toggleWindow() {
        if window.isVisible {
            window.orderOut(nil)
        } else {
            window.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
        }
    }

    private func updateWindowSize() {
        guard let hostingView = window.contentView as? NSHostingView<ContentView> else { return }
        let fitting = hostingView.fittingSize
        let frame = window.frame
        let newY = frame.origin.y + frame.height - fitting.height
        window.setFrame(
            NSRect(x: frame.origin.x, y: newY, width: fitting.width, height: fitting.height),
            display: true,
            animate: true
        )
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if !flag {
            window.makeKeyAndOrderFront(nil)
        }
        return true
    }
}
