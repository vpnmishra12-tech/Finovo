
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.finovo.app',
  appName: 'Finovo',
  webDir: 'out',
  bundledWebRuntime: false,
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-9915809769396833~2579253457',
    },
  },
};

export default config;
