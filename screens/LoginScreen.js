import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
  Image,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/apiService';
import { useUser } from '../context/UserContext';
// ✅ FONT CONFIGURATION - SỬ DỤNG FONTS ĐÃ LOAD TRONG APP.JS
const FONT_CONFIG = {
  black: 'SFPro-Black',
  bold: 'SFPro-Bold',
  regular: 'SFPro-Regular',
  medium: 'SFPro-Medium',
  light: 'SFPro-Light',
};

export default function LoginScreen({ navigation }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { saveUser } = useUser();

  // ✅ Memoized form handler
  const handleChange = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  }, [errors]);

  // ✅ Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.email.trim() || !emailRegex.test(form.email)) {
      newErrors.email = 'Email không hợp lệ.';
    }

    if (!form.password || form.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }

    return newErrors;
  }, [form]);

// Thay đổi phần handleLogin trong LoginScreen
const handleLogin = useCallback(async () => {
  const validationErrors = validateForm();
  setErrors(validationErrors);

  if (Object.keys(validationErrors).length > 0) {
    setErrorMessage(Object.values(validationErrors)[0]);
    setShowErrorModal(true);
    return;
  }

  setLoading(true);
  console.log('✅ Starting login for:', form.email);
  
  try {
    // Call API to login user
    const response = await api.post('/users/login', {
      email: form.email,
      password: form.password
    });

    console.log('✅ Login API response:', response.data);

    if (response.data.user) {
      // Save user data to AsyncStorage
      const userData = {
        id: response.data.user._id,
        name: response.data.user.name,
        email: response.data.user.email,
        avatar: response.data.user.avatar || 'https://cdn-icons-png.flaticon.com/512/9131/9131529.png',
        memberSince: new Date(response.data.user.createdAt).getFullYear().toString(),
        isVerified: false,
        savedArticles: 0,
        favoriteTopics: 0,
      };

      await saveUser(userData);
      console.log('✅ User saved via context:', userData);

      setLoading(false);
      
      // ✅ THAY ĐỔI: Navigate về MainTabs và focus vào Profile tab
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'MainTabs',
            state: {
              routes: [
                { name: 'Home' },
                { name: 'Categories' },
                { name: 'Bookmarks' },
                { name: 'Notifications' },
                { name: 'Profile' }
              ],
              index: 4, // Focus vào Profile tab (index 4)
            },
          },
        ],
      });
      
      // Show success message after navigation
      setTimeout(() => {
        Alert.alert(
          'Đăng nhập thành công!',
          `Chào mừng ${response.data.user.name}!`,
          [{ text: 'OK' }]
        );
      }, 500);
    }

  } catch (error) {
    setLoading(false);
    console.error('❌ Login error:', error);
    
    let errorMsg = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    
    if (error.response?.data?.message) {
      errorMsg = error.response.data.message === 'Invalid email or password' 
        ? 'Email hoặc mật khẩu không đúng.'
        : error.response.data.message;
    } else if (error.code === 'NETWORK_ERROR') {
      errorMsg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
    }
    
    setErrorMessage(errorMsg);
    setShowErrorModal(true);
  }
}, [validateForm, form, navigation]);

  // ✅ Memoized scroll content style
  const scrollContentStyle = useMemo(() => ({
    paddingHorizontal: 16,
    paddingBottom: 40,
  }), []);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: 20 }
      ]}
    >
      <ScrollView contentContainerStyle={scrollContentStyle}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft size={20} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { fontFamily: FONT_CONFIG.bold }]}>
              Đăng nhập
            </Text>
          </View>
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { fontFamily: FONT_CONFIG.medium }]}>
            Email
          </Text>
          <TextInput
            placeholder="Nhập email"
            placeholderTextColor="#a1a1aa"
            value={form.email}
            onChangeText={(text) => handleChange('email', text)}
            style={[
              styles.textInput,
              { fontFamily: FONT_CONFIG.regular },
              errors.email && styles.inputError
            ]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View style={styles.passwordContainer}>
          <Text style={[styles.inputLabel, { fontFamily: FONT_CONFIG.medium }]}>
            Mật khẩu
          </Text>
          <View style={styles.passwordInputWrapper}>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#a1a1aa"
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(text) => handleChange('password', text)}
              style={[
                styles.textInput,
                styles.passwordInput,
                { fontFamily: FONT_CONFIG.regular },
                errors.password && styles.inputError
              ]}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
            >
              {showPassword ? (
                <Eye size={18} color="#888" />
              ) : (
                <EyeOff size={18} color="#888" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={styles.loginButton}
        >
          <LinearGradient
            colors={['#004b8d', '#00c6ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.loginGradient}
          >
            <Text style={[styles.loginButtonText, { fontFamily: FONT_CONFIG.medium }]}>
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={[styles.dividerText, { fontFamily: FONT_CONFIG.medium }]}>
            Hoặc
          </Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social login */}
        {/* <View style={styles.socialContainer}>
          <TouchableOpacity 
            onPress={handleGoogleLogin}
            style={styles.socialButton}
          >
            <Image
              source={require('../assets/account/google.png')}
              style={styles.socialIcon}
            />
            <Text style={[styles.socialButtonText, { fontFamily: FONT_CONFIG.medium }]}>
              Đăng nhập với Google
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleFacebookLogin}
            style={styles.socialButton}
          >
            <Image
              source={require('../assets/account/facebook.png')}
              style={styles.socialIcon}
            />
            <Text style={[styles.socialButtonText, { fontFamily: FONT_CONFIG.medium }]}>
              Đăng nhập với Facebook
            </Text>
          </TouchableOpacity>
        </View> */}

        {/* Register prompt */}
        <View style={styles.registerPrompt}>
          <Text style={[styles.registerPromptText, { fontFamily: FONT_CONFIG.regular }]}>
            Chưa có tài khoản?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.registerLink, { fontFamily: FONT_CONFIG.medium }]}>
              Đăng ký
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { fontFamily: FONT_CONFIG.bold }]}>
              Lỗi đăng nhập
            </Text>
            <Text style={[styles.modalMessage, { fontFamily: FONT_CONFIG.regular }]}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setShowErrorModal(false)}
              style={styles.modalButton}
            >
              <Text style={[styles.modalButtonText, { fontFamily: FONT_CONFIG.medium }]}>
                Đã hiểu
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    color: '#000000',
  },
  inputContainer: {
    marginBottom: 16,
  },
  passwordContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 3,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000000',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 40,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 10,
    padding: 2,
  },
  loginButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loginGradient: {
    paddingVertical: 12,
    borderRadius: 10,
  },
  loginButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 15,
  },
  dividerContainer: {
    marginVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9ca3af',
    fontSize: 13,
  },
  socialContainer: {
    gap: 12,
    flexDirection: 'column',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
    borderRadius: 10,
  },
  socialButtonText: {
    fontSize: 14,
    color: '#000000',
  },
  registerPrompt: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerPromptText: {
    color: '#6b7280',
    fontSize: 14,
  },
  registerLink: {
    color: '#004b8d',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: '#004b8d',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 13,
  },
});