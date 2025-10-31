// 📄 components/UpdateManager.js
import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, Alert, Platform } from "react-native";
import * as Updates from "expo-updates";

// ✅ Hook kiểm tra thủ công (cho nút “Kiểm tra cập nhật”)
// ✅ Hook kiểm tra thủ công
export const useManualUpdateChecker = () => {
  const [isChecking, setIsChecking] = useState(false);

  const handleManualCheck = async () => {
    try {
      setIsChecking(true);
      console.log("🔍 Manually checking for updates...");

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        Alert.alert(
          "Cập nhật mới",
          "Có bản cập nhật mới, bạn có muốn tải ngay không?",
          [
            { text: "Hủy", style: "cancel" },
            {
              text: "Cập nhật",
              onPress: async () => {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              },
            },
          ]
        );
      } else {
        Alert.alert("Đã là phiên bản mới nhất ✅");
      }
    } catch (error) {
      console.error("❌ Manual update check failed:", error);
      Alert.alert("Lỗi", "Không thể kiểm tra bản cập nhật.");
    } finally {
      setIsChecking(false);
    }
  };

  return { handleManualCheck, isChecking };
}

// ✅ Component tự động kiểm tra khi mở app
const UpdateManager = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        if (__DEV__) {
          console.log("⏭️ Dev mode, skip update check");
          setChecking(false);
          return;
        }

        console.log("🔍 Checking for updates...");
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          console.log("🆕 Update available! Downloading...");
          setUpdating(true);
          const result = await Updates.fetchUpdateAsync();
          if (result.isNew) {
            console.log("✅ Update downloaded, restarting app...");
            await Updates.reloadAsync();
          }
        } else {
          console.log("✅ App is up to date");
        }
      } catch (error) {
        console.error("❌ Update check failed:", error);
        // iOS sẽ tự handle tốt, Android có thể show thông báo
        if (Platform.OS === "android") {
          Alert.alert("Lỗi cập nhật", "Không thể kiểm tra bản cập nhật mới.");
        }
      } finally {
        setChecking(false);
        setUpdating(false);
      }
    };

    checkForUpdates();
  }, []);

  if (checking || updating) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#006cd9",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: "#fff", marginTop: 10, fontWeight: "600" }}>
          {updating ? "Đang cập nhật..." : "Đang kiểm tra cập nhật..."}
        </Text>
      </View>
    );
  }

  return children;
};

export default UpdateManager;
