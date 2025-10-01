import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Dimensions,
  Alert,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Bell,
  Eye,
  Globe,
  Trash2,
  Volume2,
  RefreshCw,
  ChevronRight,
  Settings,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  secondary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  accent: {
    amber: '#F59E0B',
    rose: '#F43F5E',
    purple: '#8B5CF6',
    indigo: '#6366F1',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  surface: {
    primary: '#FFFFFF',
    secondary: '#FAFBFC',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
  },
};

const GRADIENTS = {
  primary: [COLORS.primary[400], COLORS.primary[600], COLORS.primary[700]],
  secondary: [COLORS.secondary[400], COLORS.secondary[600]],
  news: ['#667EEA', '#764BA2'],
  reading: [COLORS.accent.purple, '#7C3AED'],
  guest: [COLORS.neutral[400], COLORS.neutral[500]],
  update: ['#667EEA', '#764BA2'],
};

const FONT_CONFIG = {
  black: 'SFPro-Black',
  bold: 'SFPro-Bold',
  regular: 'SFPro-Regular',
  medium: 'SFPro-Medium',
  light: 'SFPro-Light',
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'Tiếng Việt',
  });
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      return () => setError(null); // Reset error on focus
    }, [])
  );

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('📤 Loading settings from AsyncStorage...');
      const savedSettings = await AsyncStorage.getItem('settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
        console.log('✅ Settings loaded successfully');
      }
    } catch (error) {
      console.log('❌ Error loading settings:', error);
      setError('Không thể tải cài đặt. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings) => {
    try {
      await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
      console.log('✅ Settings saved successfully');
    } catch (error) {
      console.log('❌ Error saving settings:', error);
      Alert.alert('Lỗi', 'Không thể lưu cài đặt. Vui lòng thử lại.');
      setError('Không thể lưu cài đặt.');
    }
  }, []);

  const toggleNotifications = useCallback(() => {
    const newSettings = { ...settings, notifications: !settings.notifications };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const toggleDarkMode = useCallback(() => {
    const newSettings = { ...settings, darkMode: !settings.darkMode };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const handleLanguageChange = useCallback(() => {
    Alert.alert('Thông báo', 'Chức năng chọn ngôn ngữ đang phát triển.');
  }, []);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Xóa bộ nhớ cache',
      'Bạn có chắc chắn muốn xóa bộ nhớ cache? Điều này sẽ xóa dữ liệu tạm thời.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Thành công', 'Đã xóa bộ nhớ cache.');
              console.log('✅ Cache cleared');
            } catch (error) {
              console.log('❌ Error clearing cache:', error);
              Alert.alert('Lỗi', 'Không thể xóa cache. Vui lòng thử lại.');
              setError('Không thể xóa cache.');
            }
          },
        },
      ]
    );
  }, []);

  const handleSoundSettings = useCallback(() => {
    Alert.alert('Thông báo', 'Chức năng cài đặt âm thanh đang phát triển.');
  }, []);

  const handleCheckUpdate = useCallback(() => {
    Alert.alert('Thông báo', 'Vui lòng kiểm tra bản cập nhật trên cửa hàng ứng dụng.');
  }, []);

  const settingsOptions = [
    {
      icon: <Bell size={20} color={COLORS.primary[600]} />,
      label: 'Thông báo',
      subtitle: 'Bật/tắt thông báo đẩy',
      rightComponent: (
        <Switch
          value={settings.notifications}
          onValueChange={toggleNotifications}
          trackColor={{ false: COLORS.neutral[200], true: COLORS.secondary[500] }}
          thumbColor={COLORS.surface.card}
        />
      ),
    },
    {
      icon: <Eye size={20} color={COLORS.primary[600]} />,
      label: 'Chế độ tối',
      subtitle: 'Chuyển đổi giao diện sáng/tối',
      rightComponent: (
        <Switch
          value={settings.darkMode}
          onValueChange={toggleDarkMode}
          trackColor={{ false: COLORS.neutral[200], true: COLORS.secondary[500] }}
          thumbColor={COLORS.surface.card}
        />
      ),
    },
    {
      icon: <Globe size={20} color={COLORS.primary[600]} />,
      label: 'Ngôn ngữ',
      subtitle: `Ngôn ngữ hiện tại: ${settings.language}`,
      onPress: handleLanguageChange,
    },
    {
      icon: <Volume2 size={20} color={COLORS.primary[600]} />,
      label: 'Âm thanh thông báo',
      subtitle: 'Tùy chỉnh âm thanh thông báo',
      onPress: handleSoundSettings,
    },
    {
      icon: <Trash2 size={20} color={COLORS.accent.rose} />,
      label: 'Xóa bộ nhớ cache',
      subtitle: 'Xóa dữ liệu tạm thời',
      onPress: handleClearCache,
      textColor: COLORS.accent.rose,
    },
    {
      icon: <RefreshCw size={20} color={COLORS.accent.indigo} />,
      label: 'Kiểm tra cập nhật',
      subtitle: 'Tìm kiếm bản cập nhật mới nhất',
      onPress: handleCheckUpdate,
      textColor: COLORS.accent.indigo,
    },
  ];

  const renderOptionItem = useCallback(
    (item, index) => {
      const isLast = index === settingsOptions.length - 1;
      return (
        <TouchableOpacity
          key={index}
          onPress={item.onPress}
          style={[
            styles.optionItem,
            !isLast && styles.optionBorder,
            item.disabled && styles.disabledOption,
          ]}
          activeOpacity={item.disabled ? 1 : 0.6}
          disabled={item.disabled}
        >
          <View style={styles.optionContent}>
            <View style={styles.optionIcon}>{item.icon}</View>
            <View style={styles.optionTextContainer}>
              <Text
                style={[
                  styles.optionTitle,
                  { fontFamily: FONT_CONFIG.medium },
                  item.textColor && { color: item.textColor },
                  item.disabled && styles.disabledText,
                ]}
              >
                {item.label}
              </Text>
              <Text
                style={[
                  styles.optionSubtitle,
                  { fontFamily: FONT_CONFIG.regular },
                  item.disabled && styles.disabledText,
                ]}
              >
                {item.subtitle}
              </Text>
            </View>
          </View>
          {item.rightComponent ? (
            item.rightComponent
          ) : (
            !item.disabled && <ChevronRight size={18} color={COLORS.neutral[400]} />
          )}
        </TouchableOpacity>
      );
    },
    [settingsOptions]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[600]} />
          <Text style={[styles.loadingText, { fontFamily: FONT_CONFIG.medium }]}>
            Đang tải cài đặt...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { fontFamily: FONT_CONFIG.medium }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              loadSettings();
            }}
          >
            <Text style={[styles.retryButtonText, { fontFamily: FONT_CONFIG.medium }]}>
              Thử lại
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface.secondary} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Settings size={18} color={COLORS.primary[600]} />
          </View>
          <Text style={[styles.headerText, { fontFamily: FONT_CONFIG.medium }]}>
            Cài đặt
          </Text>
        </View>
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerBadge}
        >
          <Text style={[styles.headerBadgeText, { fontFamily: FONT_CONFIG.medium }]}>
            Tùy chỉnh ứng dụng
          </Text>
        </LinearGradient>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 20 }]}
      >
        <View style={styles.introSection}>
          <LinearGradient
            colors={GRADIENTS.news}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.introCard}
          >
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <Text style={[styles.introTitle, { fontFamily: FONT_CONFIG.bold }]}>
              Tùy chỉnh trải nghiệm
            </Text>
            <Text style={[styles.introSubtitle, { fontFamily: FONT_CONFIG.regular }]}>
              Điều chỉnh cài đặt để phù hợp với nhu cầu đọc tin tức của bạn.
            </Text>
          </LinearGradient>
        </View>
        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { fontFamily: FONT_CONFIG.bold }]}>
            Cài đặt ứng dụng
          </Text>
          <View style={styles.optionsContainer}>
            {settingsOptions.map(renderOptionItem)}
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={[styles.versionText, { fontFamily: FONT_CONFIG.regular }]}>
            Tin tức Viện Kiểm sát v1.0.0
          </Text>
          <Text style={[styles.copyrightText, { fontFamily: FONT_CONFIG.light }]}>
            © 2024 Viện Kiểm sát Chất lượng • Bộ KH&CN
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface.secondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface.secondary,
  },
  loadingText: {
    color: COLORS.neutral[600],
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface.secondary,
    padding: 20,
  },
  errorText: {
    color: COLORS.accent.rose,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary[600],
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 16,
    color: COLORS.neutral[800],
  },
  headerBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerBadgeText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 8,
  },
  introSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  introCard: {
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -40,
    right: -40,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: -20,
  },
  introTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  optionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: COLORS.neutral[900],
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  optionsContainer: {
    backgroundColor: COLORS.surface.card,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  optionItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface.card,
  },
  optionBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.neutral[200],
  },
  disabledOption: {
    opacity: 0.7,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: COLORS.neutral[900],
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: COLORS.neutral[600],
    lineHeight: 18,
  },
  disabledText: {
    color: COLORS.neutral[400],
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 4,
  },
  versionText: {
    fontSize: 13,
    color: COLORS.neutral[500],
    textAlign: 'center',
  },
  copyrightText: {
    fontSize: 12,
    color: COLORS.neutral[400],
    textAlign: 'center',
  },
});