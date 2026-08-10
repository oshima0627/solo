import type { CapacitorConfig } from '@capacitor/core'

const config: CapacitorConfig = {
  appId: 'io.github.oshima0627.solo',
  appName: 'ソロ',
  webDir: 'apps/web/out',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#f2eee5',
    },
  },
}

export default config
