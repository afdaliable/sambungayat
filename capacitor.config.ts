import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sambungayat.app",
  appName: "Sambung Ayat",
  webDir: "dist",
  server: { androidScheme: "https" },
  // iOS keeps the default capacitor://localhost scheme (WKWebView cannot serve https itself).
  // The band colour shows behind the page while it loads, matching the launch screen.
  ios: { backgroundColor: "#0d5750", contentInset: "never" },
};

export default config;
