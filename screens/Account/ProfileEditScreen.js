import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
} from 'react-native';
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Save,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions } from 'react-native';
import api from '../../services/apiService';

// Hệ thống màu sắc, gradient và font tương tự ProfileScreen
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
  success: [COLORS.secondary[400], COLORS.secondary[600]],
  news: ['#667EEA', '#764BA2'],
};

const FONT_CONFIG = {
  black: 'SFPro-Black',
  bold: 'SFPro-Bold',
  regular: 'SFPro-Regular',
  medium: 'SFPro-Medium',
  light: 'SFPro-Light',
};

export default function ProfileEditScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    userId: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUserData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const userData = await AsyncStorage.getItem('user');
      console.log(userData);

      if (userData) {
        const user = JSON.parse(userData);
        setFormData({
          name: user.name || '',
          email: user.email || '',
          avatar: user.avatar || '',
          userId: user.id || '',
        });
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!formData.name.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
        setIsSaving(false);
        return;
      }

      const updateData = { name: formData.name, avatar: formData.avatar };

      if (passwordData.newPassword) {
        if (!passwordData.currentPassword) {
          Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu hiện tại');
          setIsSaving(false);
          return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
          setIsSaving(false);
          return;
        }
        if (passwordData.newPassword.length < 6) {
          Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
          setIsSaving(false);
          return;
        }
        updateData.password = passwordData.newPassword;
        updateData.currentPassword = passwordData.currentPassword;
      }

      console.log('📤 Updating profile:', formData.userId);
      const response = await api.put(`/users/${formData.userId}`, updateData);

      const currentUser = await AsyncStorage.getItem('user');
      const updatedUser = { ...JSON.parse(currentUser), ...response.data };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      console.log('✅ Profile updated successfully');
      Alert.alert('Thành công', 'Thông tin cá nhân đã được cập nhật', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('❌ Error saving:', error);
      const errorMessage = error.response?.data?.message || 'Không thể lưu thông tin';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const updatePasswordField = (field, value) =>
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  const scrollToInput = (yOffset) =>
    setTimeout(() => scrollViewRef.current?.scrollTo({ y: yOffset, animated: true }), 100);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[600]} />
          <Text style={[styles.loadingText, { fontFamily: FONT_CONFIG.medium }]}>
            Đang tải...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface.secondary} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={COLORS.neutral[900]} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { fontFamily: FONT_CONFIG.bold }]}>
          Thông tin cá nhân
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <LinearGradient
                colors={GRADIENTS.primary}
                style={styles.avatarContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.decorativeCircle1} />
                <View style={styles.decorativeCircle2} />
                {isImageLoading && (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                    style={styles.avatarLoader}
                  />
                )}
                <Image
                  source={{ uri: formData.avatar }}
                  style={styles.avatar}
                  resizeMode="cover"
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                />
                <View style={styles.avatarBorder} />
              </LinearGradient>
              <TouchableOpacity style={styles.cameraButton} activeOpacity={0.8}>
                <Camera size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Profile Form */}
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { fontFamily: FONT_CONFIG.bold }]}>
                Thông tin tài khoản
              </Text>
              <View style={styles.formContainer}>
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { fontFamily: FONT_CONFIG.medium }]}>
                    Họ và tên
                  </Text>
                  <View style={styles.inputContainer}>
                    <User size={18} color={COLORS.neutral[500]} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { fontFamily: FONT_CONFIG.regular }]}
                      value={formData.name}
                      onChangeText={(text) => updateField('name', text)}
                      placeholder="Nhập họ tên"
                      placeholderTextColor={COLORS.neutral[400]}
                      returnKeyType="next"
                      numberOfLines={1}
                      onFocus={() => scrollToInput(100)}
                    />
                  </View>
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { fontFamily: FONT_CONFIG.medium }]}>
                    Email
                  </Text>
                  <View style={[styles.inputContainer, styles.disabledInput]}>
                    <Mail size={18} color={COLORS.neutral[400]} style={styles.inputIcon} />
                    <Text style={[styles.disabledInputText, { fontFamily: FONT_CONFIG.regular }]}>
                      {formData.email}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Password Form */}
            <View style={styles.formSection}>
              <Text style={[styles.sectionTitle, { fontFamily: FONT_CONFIG.bold }]}>
                Đổi mật khẩu
              </Text>
              <View style={styles.formContainer}>
                {[
                  {
                    label: 'Mật khẩu hiện tại',
                    field: 'currentPassword',
                    show: showCurrentPassword,
                    setShow: setShowCurrentPassword,
                    offset: 400,
                  },
                  {
                    label: 'Mật khẩu mới',
                    field: 'newPassword',
                    show: showNewPassword,
                    setShow: setShowNewPassword,
                    offset: 500,
                  },
                  {
                    label: 'Xác nhận mật khẩu',
                    field: 'confirmPassword',
                    show: showConfirmPassword,
                    setShow: setShowConfirmPassword,
                    offset: 600,
                    last: true,
                  },
                ].map((item, i) => (
                  <View key={i} style={[styles.inputWrapper, item.last && styles.lastInput]}>
                    <Text style={[styles.inputLabel, { fontFamily: FONT_CONFIG.medium }]}>
                      {item.label}
                    </Text>
                    <View style={styles.inputContainer}>
                      <Lock size={18} color={COLORS.neutral[500]} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { fontFamily: FONT_CONFIG.regular }]}
                        value={passwordData[item.field]}
                        onChangeText={(text) => updatePasswordField(item.field, text)}
                        placeholder={`Nhập ${item.label.toLowerCase()}`}
                        placeholderTextColor={COLORS.neutral[400]}
                        secureTextEntry={!item.show}
                        returnKeyType={item.last ? 'done' : 'next'}
                        onFocus={() => scrollToInput(item.offset)}
                        onSubmitEditing={item.last ? handleSave : undefined}
                        numberOfLines={1}
                      />
                      <TouchableOpacity
                        onPress={() => item.setShow(!item.show)}
                        activeOpacity={0.7}
                      >
                        {item.show ? (
                          <EyeOff size={18} color={COLORS.neutral[500]} />
                        ) : (
                          <Eye size={18} color={COLORS.neutral[500]} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.buttonSection}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
                style={styles.saveButton}
              >
                <LinearGradient
                  colors={GRADIENTS.success}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButtonGradient}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Save size={18} color="#FFFFFF" />
                      <Text
                        style={[styles.saveButtonText, { fontFamily: FONT_CONFIG.bold }]}
                      >
                        Lưu thay đổi
                      </Text>
                    </>
                  )}
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
        </Animated.View>
      </KeyboardAvoidingView>
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
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 18,
    color: COLORS.neutral[900],
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 200,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: COLORS.surface.card,
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
    elevation: 8,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  avatarLoader: {
    position: 'absolute',
    zIndex: 2,
    alignSelf: 'center',
    top: 35,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarBorder: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -20,
    right: -20,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -10,
    left: -10,
  },
  cameraButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'absolute',
    bottom: 8,
    right: width * 0.45, // Scale dựa trên chiều rộng màn hình
  },
  formSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.surface.card,
    marginBottom: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    color: COLORS.neutral[900],
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  formContainer: {
    backgroundColor: COLORS.surface.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputWrapper: {
    marginBottom: 14,
  },
  lastInput: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 13,
    color: COLORS.neutral[600],
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.neutral[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
    paddingHorizontal: 12,
    height: 44,
  },
  disabledInput: {
    backgroundColor: COLORS.neutral[100],
    opacity: 0.7,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.neutral[900],
    paddingVertical: 0,
  },
  disabledInputText: {
    fontSize: 15,
    color: COLORS.neutral[500],
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
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