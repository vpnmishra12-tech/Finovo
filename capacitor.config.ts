import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.finovo.app',
  appName: 'Finovo',
  webDir: 'out',
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-9915809769396833~2579253457',
    },
  },
  server: {
    // Required for Next.js routing and Firebase to work on Android
    androidScheme: 'https',
    hostname: 'localhost',
    cleartext: true
  }
};

export default config;