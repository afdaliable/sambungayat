#!/bin/sh
# iOS builds for `npm run ios:sim` and `npm run ios:test` (macOS + Xcode). Run after `cap sync ios`.
#   sim   Release simulator app, zipped at ios/App/build/SambungAyat-simulator.zip
#   test  XCUITest UI tests on IOS_SIMULATOR (default: the first available iPhone simulator)
set -eu
cd "$(dirname "$0")/../ios/App"

case "${1:-}" in
  sim)
    xcodebuild build -project App.xcodeproj -scheme App -configuration Release \
      -destination "generic/platform=iOS Simulator" -derivedDataPath build/sim -quiet
    rm -f build/SambungAyat-simulator.zip
    ditto -c -k --keepParent build/sim/Build/Products/Release-iphonesimulator/App.app build/SambungAyat-simulator.zip
    echo "Simulator app: ios/App/build/SambungAyat-simulator.zip"
    ;;
  test)
    name="${IOS_SIMULATOR:-$(xcrun simctl list devices available | grep -m1 -o 'iPhone[^(]*' | sed 's/ *$//')}"
    [ -n "$name" ] || { echo "No iPhone simulator found; install one in Xcode > Settings > Components." >&2; exit 1; }
    rm -rf build/UITests.xcresult
    xcodebuild test -project App.xcodeproj -scheme App -destination "platform=iOS Simulator,name=$name" \
      -derivedDataPath build/test -resultBundlePath build/UITests.xcresult
    ;;
  *)
    echo "usage: sh scripts/ios.sh sim|test" >&2
    exit 2
    ;;
esac
