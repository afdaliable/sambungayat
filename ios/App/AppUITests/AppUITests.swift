import XCTest

/// Drives the bundled site inside the app's WKWebView. Labels are the Indonesian (root language) UI texts
/// from `locales/id`.
final class AppUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
        XCTAssertTrue(startButton.waitForExistence(timeout: 60), "home page did not load from the bundle")
    }

    private var web: XCUIElement { app.webViews.firstMatch }
    private var startButton: XCUIElement { web.buttons["Mulai kuis"] }

    func testHomeLoadsOffline() {
        XCTAssertTrue(web.links["Kuis"].exists)
        XCTAssertTrue(web.staticTexts["Sambung Ayat"].exists)
    }

    func testQuickQuizStartsAndAcceptsAnAnswer() {
        startButton.tap()
        XCTAssertTrue(web.staticTexts["Pilih ayat berikutnya"].waitForExistence(timeout: 30), "quiz did not start")
        let progress = web.staticTexts.matching(NSPredicate(format: "label BEGINSWITH 'Soal 1 dari'")).firstMatch
        XCTAssertTrue(progress.exists)

        let options = web.otherElements["Pilihan jawaban"].buttons
        XCTAssertTrue(options.firstMatch.waitForExistence(timeout: 10))
        XCTAssertGreaterThanOrEqual(options.count, 2)
        options.element(boundBy: 0).tap()

        let next = web.buttons["Lanjut"]
        XCTAssertTrue(next.waitForExistence(timeout: 10), "answer was not accepted")
        next.tap()
        let second = web.staticTexts.matching(NSPredicate(format: "label BEGINSWITH 'Soal 2 dari'")).firstMatch
        XCTAssertTrue(second.waitForExistence(timeout: 10))
    }

    /// Internal links must open their bundled .html page: Capacitor falls back to index.html for extensionless
    /// paths, so the BaseLayout shims rewrite them inside the app.
    func testInternalLinksOpenBundledPages() {
        web.links["Surah"].tap()
        XCTAssertTrue(web.staticTexts["Daftar surah"].waitForExistence(timeout: 15), "surah list did not open")
        XCTAssertFalse(startButton.exists)

        web.links.matching(NSPredicate(format: "label CONTAINS 'Al-Fatihah'")).firstMatch.tap()
        let surahStart = web.staticTexts.matching(NSPredicate(format: "label CONTAINS 'Al-Fatihah'")).firstMatch
        XCTAssertTrue(surahStart.waitForExistence(timeout: 15))
        XCTAssertFalse(web.staticTexts["Daftar surah"].exists, "surah page did not open")

        // Left-edge swipe goes back to the surah list.
        let edge = app.coordinate(withNormalizedOffset: CGVector(dx: 0, dy: 0.5))
        edge.press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.7, dy: 0.5)))
        XCTAssertTrue(web.staticTexts["Daftar surah"].waitForExistence(timeout: 15), "edge swipe did not go back")
    }
}
