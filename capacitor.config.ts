import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.infabel.arrowescape',
  appName: 'Arrow Escape',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      releaseType: 'AAB'
    }
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-3940256099942544~3347511713'
    }
  }
};

export default config;
