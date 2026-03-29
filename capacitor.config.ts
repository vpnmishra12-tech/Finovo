
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.finovo.app',
  appName: 'Finovo',
  webDir: 'out',
  plugins: {
    AdMob: {
      // Valid AdMob App ID provided by user
      appId: 'ca-app-pub-9915809769396833~2579253457',
    },
  },
  server: {
    // Critical for Next.js routing and Firebase Auth on Android
    androidScheme: 'https',
    hostname: 'localhost',
    cleartext: true
  }
};

export default config;
