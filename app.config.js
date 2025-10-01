import 'dotenv/config';

export default {
  expo: {
    name: "Viện Kiểm Sát AI",
    slug: "vien-kiem-sat-ai",
    version: "1.0.1", // ✅ tăng version app
    orientation: "portrait",
    icon: "./assets/logo.jpg",
    userInterfaceStyle: "light",
    newArchEnabled: true,

    // ✅ Runtime version cho EAS Update
    runtimeVersion: {
      policy: "appVersion"
    },
    
    // ✅ Config EAS Update
    updates: {
      url: "https://u.expo.dev/1690739a-3e5c-46aa-bf91-32b40856c25b",
      enabled: true,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 3000,
    },
    
    splash: {
      image: "./assets/splash-icon_logo.png",
      resizeMode: "contain",
      backgroundColor: "#006cda"
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.vksnews.app",
      buildNumber: "2" // ✅ tăng khi build iOS
    },

    android: {
      package: "com.vksnews.app",
      versionCode: 2, // ✅ tăng khi build Android
      usesCleartextTraffic: true,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon_logo.png",
        backgroundColor: "#006cda"
      },
      edgeToEdgeEnabled: false,
      statusBar: {
        translucent: false,
        backgroundColor: "#006cda",
        barStyle: "dark-content"
      },
      navigationBar: {
        visible: "sticky-immersive",
        barStyle: "light-content",
        backgroundColor: "#006cda"
      }
    },

    web: {
      favicon: "./assets/favicon.png"
    },
    
    // ✅ Plugins
    plugins: [
      "expo-font",
      "expo-updates"
    ],
    
    extra: {
      eas: {
        projectId: "1690739a-3e5c-46aa-bf91-32b40856c25b"
      },
      API_BASE_URL: process.env.API_BASE_URL || 'https://saigon247.au',
      API_TIMEOUT: process.env.API_TIMEOUT || '15000',
      APP_ENV: process.env.APP_ENV || 'production',
      UPDATE_CHANNEL: process.env.UPDATE_CHANNEL || 'production',
      API_GOOGLE_SPEED: process.env.API_GOOGLE_SPEED, // Google TTS API Key
      CHECK_UPDATE_ON_START: true,
    }
  }
};
