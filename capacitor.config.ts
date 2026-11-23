import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thebitezone.partner',
  appName: 'The Bite Zone Partner',
  webDir: 'dist/tbzb-partner/browser',
  server: {
    androidScheme: 'https',
    url: 'https://tbzb-partner.vercel.app',
    cleartext: false
  }
};

export default config;
