import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckCircle2, ChevronRight, Newspaper } from 'lucide-react-native';

// Sử dụng cùng hệ thống màu sắc, gradient và font từ ProfileScreen
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
};

const FONT_CONFIG = {
  black: 'SFPro-Black',
  bold: 'SFPro-Bold',
  regular: 'SFPro-Regular',
  medium: 'SFPro-Medium',
  light: 'SFPro-Light',
};

export default function TopicScreen() {
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [user, setUser] = useState(null);

  // Danh sách các chủ đề có thể chọn
  const topics = [
    { id: 'politics', name: 'Chính trị', icon: <Newspaper size={20} color={COLORS.primary[600]} /> },
    { id: 'law', name: 'Pháp luật', icon: <Newspaper size={20} color={COLORS.primary[600]} /> },
    { id: 'economy', name: 'Kinh tế', icon: <Newspaper size={20} color={COLORS.primary[600]} /> },
    { id: 'society', name: 'Xã hội', icon: <Newspaper size={20} color={COLORS.primary[600]} /> },
    { id: 'culture', name: 'Văn hóa', icon: <Newspaper size={20} color={COLORS.primary[600]} /> },
    { id: 'education', name: 'Giáo dục', icon: <Newspaper size={20} color={COLORS.primary[600]} /> },
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('🔄 TopicScreen focused, reloading user data...');
      loadUserData();
    }, [])
  );

  const loadUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('📤 Loading user data from AsyncStorage...');
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Giả lập danh sách chủ đề đã chọn từ dữ liệu người dùng
        const savedTopics = parsedUser.topics || [];
        setSelectedTopics(savedTopics);
        console.log('✅ User data loaded successfully');
      } else {
        setUser(null);
        setSelectedTopics([]);
        console.log('ℹ️ No user data found - showing guest UI');
      }
    } catch (error) {
      console.log('❌ Error loading user data:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTopicToggle = useCallback((topicId) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  }, []);

  const handleSaveTopics = useCallback(async () => {
    try {
      if (user) {
        const updatedUser = { ...user, topics: selectedTopics };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        Alert.alert('Thành công', 'Chủ đề quan tâm đã được lưu!');
        console.log('✅ Topics saved successfully');
      } else {
        Alert.alert('Thông báo', 'Vui lòng đăng nhập để lưu chủ đề quan tâm!');
      }
    } catch (error) {
      console.log('❌ Error saving topics:', error);
      Alert.alert('Lỗi', 'Không thể lưu chủ đề. Vui lòng thử lại.');
    }
  }, [user, selectedTopics]);

  const renderTopicItem = useCallback(
    (topic, index) => {
      const isSelected = selectedTopics.includes(topic.id);
      const isLast = index === topics.length - 1;

      return (
        <TouchableOpacity
          key={topic.id}
          onPress={() => handleTopicToggle(topic.id)}
          style={[
            styles.optionItem,
            !isLast && styles.optionBorder,
            isSelected && styles.selectedOption,
          ]}
          activeOpacity={0.6}
        >
          <View style={styles.optionContent}>
            <View style={styles.optionIcon}>
              {topic.icon}
            </View>
            <View style={styles.optionTextContainer}>
              <Text
                style={[
                  styles.optionTitle,
                  { fontFamily: FONT_CONFIG.medium },
                  isSelected && { color: COLORS.primary[600] },
                ]}
              >
                {topic.name}
              </Text>
              <Text style={[styles.optionSubtitle, { fontFamily: FONT_CONFIG.regular }]}>
                Tin tức về {topic.name.toLowerCase()}
              </Text>
            </View>
          </View>
          {isSelected && (
            <CheckCircle2 size={18} color={COLORS.secondary[500]} />
          )}
        </TouchableOpacity>
      );
    },
    [selectedTopics, handleTopicToggle]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[600]} />
          <Text style={[styles.loadingText, { fontFamily: FONT_CONFIG.medium }]}>
            Đang tải thông tin...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface.secondary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.supportIcon}>
            <Newspaper size={18} color={COLORS.primary[600]} />
          </View>
          <Text style={[styles.headerText, { fontFamily: FONT_CONFIG.medium }]}>
            Chủ đề quan tâm
          </Text>
        </View>
        <LinearGradient
          colors={user ? GRADIENTS.primary : GRADIENTS.guest}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerBadge}
        >
          <Text style={[styles.headerBadgeText, { fontFamily: FONT_CONFIG.medium }]}>
            {user ? 'Độc giả thành viên' : 'Độc giả khách'}
          </Text>
        </LinearGradient>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + 20 },
        ]}
      >
        {/* Intro Section */}
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
              Tùy chỉnh tin tức của bạn
            </Text>
            <Text style={[styles.introSubtitle, { fontFamily: FONT_CONFIG.regular }]}>
              Chọn các chủ đề bạn muốn theo dõi để nhận tin tức phù hợp nhất.
            </Text>
          </LinearGradient>
        </View>

        {/* Topics Section */}
        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { fontFamily: FONT_CONFIG.bold }]}>
            Chọn chủ đề
          </Text>
          <View style={styles.optionsContainer}>
            {topics.map(renderTopicItem)}
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity onPress={handleSaveTopics} style={styles.saveButton}>
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <Text style={[styles.saveButtonText, { fontFamily: FONT_CONFIG.medium }]}>
                Lưu chủ đề
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
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
  supportIcon: {
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
  selectedOption: {
    backgroundColor: COLORS.primary[50],
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
  buttonSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  saveButton: {
    borderRadius: 20,
    overflow: 'hidden',
    width: width * 0.6, // Scale dựa trên chiều rộng màn hình
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
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