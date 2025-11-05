import 'dotenv/config';

export default {
  expo: {
    name: "VKS News",
    slug: "vien-kiem-sat-ai",
    version: "1.0.6", // ⚡ tăng khi build bản mới
    orientation: "portrait",
    icon: "./assets/icon_vks.jpg",
    userInterfaceStyle: "light",
    newArchEnabled: true,

    runtimeVersion: {
      policy: "appVersion",
    },

    updates: {
      url: "https://u.expo.dev/1690739a-3e5c-46aa-bf91-32b40856c25b",
      enabled: true,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 3000,
    },

    splash: {
      // image: "./assets/splash-icon_vks.png",
      // resizeMode: "cover",
      backgroundColor: "#006cda",
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.vksnews.app",
      buildNumber: "5", // ⚡ tăng khi build iOS
    },

    android: {
      package: "com.vksnews.app",
      versionCode: 5, // ⚡ tăng khi build Android
      usesCleartextTraffic: true,
      adaptiveIcon: {
        // foregroundImage: "./assets/splash-icon_vks.png",
        backgroundColor: "#006cda",
      },
    },

    web: {
      favicon: "./assets/favicon.png",
    },

    plugins: [
      "expo-font",
      "expo-updates"
    ],

    extra: {
      eas: {
        projectId: "1690739a-3e5c-46aa-bf91-32b40856c25b",
      },
      API_BASE_URL: process.env.API_BASE_URL || "https://saigon247.au",
      API_TIMEOUT: process.env.API_TIMEOUT || "15000",
      APP_ENV: process.env.APP_ENV || "production",
      UPDATE_CHANNEL: process.env.UPDATE_CHANNEL || "production",
      API_GOOGLE_SPEED: process.env.API_GOOGLE_SPEED,
      CHECK_UPDATE_ON_START: true,
    },
  },
};
