import UIKit
import Capacitor

/// Capacitor's view controller with the iOS edge-swipe back gesture, the app's only way back
/// (iOS has no Back button; the pages are separate HTML files, so history.back() is the previous page).
class BridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        webView?.allowsBackForwardNavigationGestures = true
    }
}
