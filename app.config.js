export default {
  expo: {
    name: "CoupleJournal",
    slug: "CoupleJournal",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF",
      },
      package: "com.yourname.couplejournal",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission:
            "The app accesses your photos to let you share them with your partner.",
          cameraPermission:
            "The app accesses your camera to let you take photos for your journal.",
        },
      ],
      [
        "expo-media-library",
        {
          photosPermission:
            "The app accesses your media library to let you save shared content.",
          savePhotosPermission: "The app saves photos to your media library.",
          isAccessMediaLocationEnabled: true,
        },
      ],
    ],
  },
};
