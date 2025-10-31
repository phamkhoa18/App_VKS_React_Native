
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Alert,
  StyleSheet,
  Dimensions,
  Linking
} from 'react-native';
import {
  ShieldUser,
  Clock,
  MapPin,
  BookOpen,
  Users,
  Bookmark,
  PhoneOutgoing,
  ChevronRight,
  LogIn,
  UserPlus,
  Settings,
  LogOut,
  Bell,
  Eye,
  TrendingUp,
  Star,
  CheckCircle2,
  Newspaper,
  Filter,
  RefreshCw,
  Download,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, GRADIENTS } from '../constants/colors';
// ✅ IMPORT MANUAL UPDATE CHECKER
import { useManualUpdateChecker } from '../components/UpdateManager';
import { FONT_CONFIG } from '../constants/fonts';
import { useUser } from '../context/UserContext';
const { width } = Dimensions.get('window');

// ✅ NEWS APP COLOR SYSTEM FOR INSPECTION INSTITUTE


export default function ProfileScreen() {
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  

  // ✅ MANUAL UPDATE CHECKER HOOK
const { handleManualCheck, isChecking } = useManualUpdateChecker();

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('🔄 ProfileScreen focused, reloading user data...');
      const timer = setTimeout(() => {
        loadUserData();
      }, 100);
      
      return () => clearTimeout(timer);
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
        console.log('✅ User data loaded successfully');
      } else {
        setUser(null);
        console.log('ℹ️ No user data found - showing guest UI');
      }
    } catch (error) {
      console.log('❌ Error loading user data:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = useCallback(async () => {
    navigation.navigate('Login');
  }, [navigation]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('user');
              setUser(null);
              setIsImageLoading(true);
              console.log('✅ User logged out');
            } catch (error) {
              console.log('❌ Error removing user data:', error);
            }
          }
        },
      ]
    );
  }, []);

  // ✅ CLEAN APPLE-STYLE OPTIONS FOR LOGGED IN USERS WITH UPDATE CHECKER
  const loggedInOptions = useMemo(() => [
    {
      icon: <ShieldUser size={20} color={COLORS.primary[600]} />,
      label: 'Thông tin cá nhân',
      subtitle: 'Quản lý hồ sơ và tài khoản',
      onPress: () => navigation.navigate('ProfileEdit')
    },
    {
      icon: <Bookmark size={20} color={COLORS.primary[600]} />,
      label: 'Tin đã lưu',
      subtitle: 'Danh sách bài viết đã bookmark',
      onPress: () => {
      navigation.navigate('Bookmark');
    }
    },
    {
      icon: <Clock size={20} color={COLORS.primary[600]} />,
      label: 'Lịch sử đọc',
      subtitle: 'Các bài viết đã xem gần đây',
      onPress: () => console.log('Lịch sử đọc'),
    },
    {
      icon: <Settings size={20} color={COLORS.neutral[500]} />,
      label: 'Cài đặt ứng dụng',
      subtitle: 'Tùy chỉnh giao diện & âm thanh',
      onPress: () => {navigation.navigate('Settings')}
    },
    // ✅ THÊM MANUAL UPDATE CHECKER
    {
      icon: isChecking ? (
        <ActivityIndicator size={20} color={COLORS.accent.indigo} />
      ) : (
        <RefreshCw size={20} color={COLORS.accent.indigo} />
      ),
      label: 'Kiểm tra cập nhật',
      subtitle: isChecking ? 'Đang kiểm tra phiên bản mới...' : 'Tìm kiếm bản cập nhật mới nhất',
      onPress: isChecking ? null : handleManualCheck,
      textColor: COLORS.accent.indigo,
      disabled: isChecking,
    },
    {
      icon: <BookOpen size={20} color={COLORS.neutral[500]} />,
      label: 'Về viện kiểm sát',
      subtitle: 'Thông tin tổ chức & liên hệ',
      onPress: () => navigation.navigate('Info')
    },
    // ✅ THÊM MỤC ĐIỀU KHOẢN VÀ DỊCH VỤ
    {
      icon: <BookOpen size={20} color={COLORS.neutral[500]} />,
      label: 'Điều khoản và Dịch vụ',
      subtitle: 'Chính sách bảo mật và điều khoản sử dụng',
      onPress: () => Linking.openURL('https://vksai.app/privacy.html'),
    },
    // ✅ THÊM MỤC HỖ TRỢ KỸ THUẬT CHO USER ĐÃ LOGIN
    {
      icon: <PhoneOutgoing size={20} color={COLORS.neutral[500]} />,
      label: 'Hỗ trợ kỹ thuật',
      subtitle: 'Liên hệ đội ngũ hỗ trợ 24/7',
      onPress: () => Linking.openURL('mailto:contact@vksai.app'),
    },
    {
      icon: <LogOut size={20} color={COLORS.accent.rose} />,
      label: 'Đăng xuất',
      subtitle: 'Thoát khỏi tài khoản hiện tại',
      onPress: handleLogout,
      textColor: COLORS.accent.rose,
    },
  ], [handleLogout, handleManualCheck, isChecking]);

  // ✅ CLEAN APPLE-STYLE OPTIONS FOR GUEST USERS WITH UPDATE CHECKER
  const guestOptions = useMemo(() => [
    {
      icon: <LogIn size={20} color={COLORS.primary[600]} />,
      label: 'Đăng nhập',
      subtitle: 'Đồng bộ dữ liệu và lưu tin yêu thích',
      onPress: handleLogin,
      textColor: COLORS.primary[700],
    },
    {
      icon: <UserPlus size={20} color={COLORS.secondary[600]} />,
      label: 'Đăng ký tài khoản',
      subtitle: 'Tạo tài khoản để trải nghiệm đầy đủ',
      onPress: () => navigation.navigate('Register'),
      textColor: COLORS.secondary[700],
    },
    // ✅ THÊM MANUAL UPDATE CHECKER CHO GUEST
    {
      icon: isChecking ? (
        <ActivityIndicator size={20} color={COLORS.accent.indigo} />
      ) : (
        <Download size={20} color={COLORS.accent.indigo} />
      ),
      label: 'Kiểm tra cập nhật',
      subtitle: isChecking ? 'Đang tìm kiếm bản mới...' : 'Cập nhật ứng dụng mới nhất',
      onPress: isChecking ? null : handleManualCheck,
      textColor: COLORS.accent.indigo,
      disabled: isChecking,
    },
    {
      icon: <BookOpen size={20} color={COLORS.neutral[500]} />,
      label: 'Về viện kiểm sát',
      subtitle: 'Thông tin tổ chức & sứ mệnh',
      onPress: () => navigation.navigate('Info')
    },
    // ✅ THÊM MỤC ĐIỀU KHOẢN VÀ DỊCH VỤ
    {
      icon: <BookOpen size={20} color={COLORS.neutral[500]} />,
      label: 'Điều khoản và Dịch vụ',
      subtitle: 'Chính sách bảo mật và điều khoản sử dụng',
      onPress: () => Linking.openURL('https://vksai.app/privacy.html'),
    },
    // ✅ CẬP NHẬT MỤC HỖ TRỢ KỸ THUẬT VỚI EMAIL
    {
      icon: <PhoneOutgoing size={20} color={COLORS.neutral[500]} />,
      label: 'Hỗ trợ kỹ thuật',
      subtitle: 'Liên hệ đội ngũ hỗ trợ 24/7',
      onPress: () => Linking.openURL('mailto:contact@vksai.app'),
    },
  ], [handleLogin, navigation, handleManualCheck, isChecking]);

  const currentOptions = user ? loggedInOptions : guestOptions;

  // ✅ NEWS READER PROFILE FOR LOGGED IN USERS
  const renderLoggedInProfile = useCallback(() => (
    <View style={styles.profileSection}>
      {/* News Reader Profile Card */}
      <View style={styles.profileCardContainer}>
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          
          <View style={styles.profileHeader}>
            <View style={styles.avatarSection}>
              {isImageLoading && (
                <ActivityIndicator 
                  size="small" 
                  color="#FFFFFF" 
                  style={styles.avatarLoader}
                />
              )}
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.avatar}
                  resizeMode="cover"
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                />
                <View style={styles.avatarBorder} />
              </View>
              <View style={styles.statusIndicator}>
                <CheckCircle2 size={16} color="#FFFFFF" />
              </View>
            </View>
            
            <View style={styles.userDetailsSection}>
              <Text style={[styles.userName, { fontFamily: FONT_CONFIG.bold }]}>
                {user.name}
              </Text>
              <Text style={[styles.userRole, { fontFamily: FONT_CONFIG.medium }]}>
                Độc giả tin tức viện kiểm sát
              </Text>
              
              <View style={styles.badgeContainer}>
                <View style={styles.verificationBadge}>
                  <Newspaper size={12} color="#FFFFFF" />
                  <Text style={[styles.badgeText, { fontFamily: FONT_CONFIG.medium }]}>
                    Thành viên từ {user.memberSince}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Reading Stats Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity style={styles.statCard} onPress={() => {
            navigation.navigate('Bookmark');
          }} >
          <LinearGradient
            colors={GRADIENTS.secondary}
            style={styles.statIconContainer}
          >
            <Bookmark size={22} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { fontFamily: FONT_CONFIG.bold }]}>
              {user.savedArticles}
            </Text>
            <Text style={[styles.statLabel, { fontFamily: FONT_CONFIG.medium }]}>
              Tin đã lưu
            </Text>
            <View style={styles.statTrend}>
              <TrendingUp size={12} color={COLORS.secondary[600]} />
              <Text style={[styles.trendText, { fontFamily: FONT_CONFIG.medium }]}>
                +5 tuần này
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statCard}>
          <LinearGradient
            colors={GRADIENTS.reading}
            style={styles.statIconContainer}
          >
            <Eye size={22} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { fontFamily: FONT_CONFIG.bold }]}>
              {user.favoriteTopics}
            </Text>
            <Text style={[styles.statLabel, { fontFamily: FONT_CONFIG.medium }]}>
              Bài đã đọc
            </Text>
            <View style={styles.statTrend}>
              <Star size={12} color={COLORS.accent.amber} />
              <Text style={[styles.trendText, { fontFamily: FONT_CONFIG.medium }]}>
                Độc giả tích cực
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  ), [user, isImageLoading]);

  // ✅ GUEST NEWS READER PROFILE
  const renderGuestProfile = useCallback(() => (
    <View style={styles.profileSection}>
      <View style={styles.profileCardContainer}>
        <LinearGradient
          colors={GRADIENTS.guest}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          
          <View style={styles.profileHeader}>
            <View style={styles.avatarSection}>
              <View style={styles.guestAvatarContainer}>
                <Newspaper size={32} color="#FFFFFF" />
              </View>
            </View>
            
            <View style={styles.userDetailsSection}>
              <Text style={[styles.userName, { fontFamily: FONT_CONFIG.bold }]}>
                Độc giả khách
              </Text>
              <Text style={[styles.userRole, { fontFamily: FONT_CONFIG.medium }]}>
                Đọc tin tức không giới hạn
              </Text>
              
              <TouchableOpacity onPress={handleLogin} style={styles.guestLoginButton}>
                <LogIn size={16} color={COLORS.primary[700]} />
                <Text style={[styles.guestLoginText, { fontFamily: FONT_CONFIG.medium }]}>
                  Đăng nhập để lưu tin
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Guest Reading Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.disabledStatCard]}>
          <View style={styles.disabledStatIcon}>
            <Bookmark size={22} color={COLORS.neutral[400]} />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, styles.disabledText, { fontFamily: FONT_CONFIG.bold }]}>
              --
            </Text>
            <Text style={[styles.statLabel, styles.disabledText, { fontFamily: FONT_CONFIG.medium }]}>
              Tin đã lưu
            </Text>
            <Text style={[styles.disabledNote, { fontFamily: FONT_CONFIG.regular }]}>
              Cần đăng nhập
            </Text>
          </View>
        </View>
        
        <View style={[styles.statCard, styles.disabledStatCard]}>
          <View style={styles.disabledStatIcon}>
            <Eye size={22} color={COLORS.neutral[400]} />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, styles.disabledText, { fontFamily: FONT_CONFIG.bold }]}>
              --
            </Text>
            <Text style={[styles.statLabel, styles.disabledText, { fontFamily: FONT_CONFIG.medium }]}>
              Lịch sử đọc
            </Text>
            <Text style={[styles.disabledNote, { fontFamily: FONT_CONFIG.regular }]}>
              Cần đăng nhập
            </Text>
          </View>
        </View>
      </View>
    </View>
  ), [handleLogin]);

  const renderOptionItem = useCallback((item, index) => {
    const isLast = index === currentOptions.length - 1;

    return (
      <TouchableOpacity
        key={index}
        onPress={item.disabled ? null : item.onPress}
        style={[
          styles.optionItem, 
          !isLast && styles.optionBorder,
          item.disabled && styles.disabledOption
        ]}
        activeOpacity={item.disabled ? 1 : 0.6}
      >
        <View style={styles.optionContent}>
          <View style={styles.optionIcon}>
            {item.icon}
          </View>
          <View style={styles.optionTextContainer}>
            <Text
              style={[
                styles.optionTitle,
                { fontFamily: FONT_CONFIG.medium },
                item.textColor && { color: item.textColor },
                item.disabled && styles.disabledText
              ]}
            >
              {item.label}
            </Text>
            {item.subtitle && (
              <Text style={[
                styles.optionSubtitle, 
                { fontFamily: FONT_CONFIG.regular },
                item.disabled && styles.disabledText
              ]}>
                {item.subtitle}
              </Text>
            )}
          </View>
        </View>
        {!item.disabled && (
          <ChevronRight size={18} color={COLORS.neutral[400]} />
        )}
      </TouchableOpacity>
    );
  }, [currentOptions.length]);

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

    {/* News App Header */}
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.headerLeft}
        onPress={() => Linking.openURL('mailto:contact@vksai.app')}
        activeOpacity={0.7}
      >
        <View style={styles.supportIcon}>
          <PhoneOutgoing size={18} color={COLORS.primary[600]} />
        </View>
        <Text style={[styles.headerText, { fontFamily: FONT_CONFIG.medium }]}>
          Hỗ trợ 24/7
        </Text>
      </TouchableOpacity>
      
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
          { paddingBottom: tabBarHeight + 20 }
        ]}
      >
        {user ? renderLoggedInProfile() : renderGuestProfile()}

        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { fontFamily: FONT_CONFIG.bold }]}>
            Tùy chọn
          </Text>
          <View style={styles.optionsContainer}>
            {currentOptions.map(renderOptionItem)}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { fontFamily: FONT_CONFIG.regular }]}>
            Tin tức Viện Kiểm sát
          </Text>
          <Text style={[styles.copyrightText, { fontFamily: FONT_CONFIG.light }]}>
            © 2025 Viện Kiểm sát Chất lượng • Bộ KH&CN
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

  profileSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  profileCardContainer: {
    marginBottom: 20,
  },
  profileCard: {
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },

  avatarSection: {
    position: 'relative',
  },
  avatarLoader: {
    position: 'absolute',
    zIndex: 2,
    alignSelf: 'center',
    top: 25,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarBorder: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.secondary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  guestAvatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  userDetailsSection: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  guestLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: 6,
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  guestLoginText: {
    color: COLORS.primary[700],
    fontSize: 14,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface.card,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  disabledStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.neutral[200],
    marginBottom: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    color: COLORS.neutral[900],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.neutral[600],
    marginBottom: 6,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    color: COLORS.secondary[600],
  },
  disabledStatCard: {
    backgroundColor: COLORS.neutral[50],
    opacity: 0.7,
  },
  disabledText: {
    color: COLORS.neutral[400],
  },
  disabledNote: {
    fontSize: 11,
    color: COLORS.neutral[500],
    fontStyle: 'italic',
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