import UIKit
import Capacitor

/// Capacitor's view controller with a left-edge swipe that goes back, the app's only way back
/// (iOS has no Back button; the pages are separate HTML files, so the web view's history is the previous page).
/// WKWebView's own allowsBackForwardNavigationGestures did not respond inside the Capacitor view.
class BridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        let edge = UIScreenEdgePanGestureRecognizer(target: self, action: #selector(edgeSwipe(_:)))
        edge.edges = .left
        view.addGestureRecognizer(edge)
    }

    @objc private func edgeSwipe(_ gesture: UIScreenEdgePanGestureRecognizer) {
        guard gesture.state == .ended, gesture.translation(in: view).x > 60,
              let webView, webView.canGoBack else { return }
        webView.goBack()
    }
}
