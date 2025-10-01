import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/apiService';

// ✅ FONT CONFIGURATION - SỬ DỤNG FONTS ĐÃ LOAD TRONG APP.JS
const FONT_CONFIG = {
  black: 'SFPro-Black',
  bold: 'SFPro-Bold',
  regular: 'SFPro-Regular',
  medium: 'SFPro-Medium',
  light: 'SFPro-Light',
};

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    rePassword: '',
  });

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

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Họ và tên không được để trống.';
    }
    if (!form.email.trim() || !emailRegex.test(form.email)) {
      newErrors.email = 'Email không hợp lệ.';
    }
    if (!form.password || form.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }
    if (form.password !== form.rePassword) {
      newErrors.rePassword = 'Mật khẩu không trùng khớp.';
    }

    return newErrors;
  }, [form]);

  // ✅ Handle register with API
  const handleRegister = useCallback(async () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setErrorMessage(Object.values(validationErrors)[0]);
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    console.log('✅ Starting registration for:', form.email);
    
    try {
      // Call API to register user
      const response = await api.post('/users/register', {
        name: form.fullName,
        email: form.email,
        password: form.password,
        role: 'user'
      });

      console.log('✅ Registration API response:', response.data);

      // Save user data to AsyncStorage
      const userData = {
        id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        avatar: response.data.avatar || 'https://cdn-icons-png.flaticon.com/512/9131/9131529.png',
        memberSince: new Date(response.data.createdAt).getFullYear().toString(),
        isVerified: false,
        savedArticles: 0,
        favoriteTopics: 0,
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      console.log('✅ User data saved to AsyncStorage');

      setLoading(false);
      
      Alert.alert(
        'Đăng ký thành công!',
        'Tài khoản của bạn đã được tạo thành công.',
        [
          {
            text: 'Đăng nhập ngay',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );

    } catch (error) {
      setLoading(false);
      console.error('❌ Registration error:', error);
      
      let errorMsg = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message === 'Email already exists' 
          ? 'Email này đã được đăng ký. Vui lòng sử dụng email khác.'
          : error.response.data.message;
      } else if (error.code === 'NETWORK_ERROR') {
        errorMsg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
      }
      
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    }
  }, [validateForm, form, navigation]);

  // ✅ Social login handlers
  const handleGoogleSignup = useCallback(() => {
    console.log('✅ Google signup initiated');
    // Implement Google signup
  }, []);

  const handleFacebookSignup = useCallback(() => {
    console.log('✅ Facebook signup initiated');
    // Implement Facebook signup
  }, []);

  // ✅ Memoized scroll content style
  const scrollContentStyle = useMemo(() => ({
    paddingHorizontal: 16,
    paddingBottom: insets.bottom + 100,
    paddingTop: 12,
    flexGrow: 1,
  }), [insets.bottom]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={scrollContentStyle}
        >
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
                Đăng ký
              </Text>
            </View>
          </View>

          {/* Họ và tên */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { fontFamily: FONT_CONFIG.medium }]}>
              Họ và tên
            </Text>
            <TextInput
              placeholder="Nhập họ và tên"
              placeholderTextColor="#a1a1aa"
              value={form.fullName}
              onChangeText={(text) => handleChange('fullName', text)}
              style={[
                styles.textInput,
                { fontFamily: FONT_CONFIG.regular },
                errors.fullName && styles.inputError
              ]}
            />
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

          {/* Mật khẩu */}
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

          {/* Nhập lại mật khẩu */}
          <View style={styles.passwordContainer}>
            <Text style={[styles.inputLabel, { fontFamily: FONT_CONFIG.medium }]}>
              Nhập lại mật khẩu
            </Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#a1a1aa"
                secureTextEntry={!showRePassword}
                value={form.rePassword}
                onChangeText={(text) => handleChange('rePassword', text)}
                style={[
                  styles.textInput,
                  styles.passwordInput,
                  { fontFamily: FONT_CONFIG.regular },
                  errors.rePassword && styles.inputError
                ]}
              />
              <TouchableOpacity
                onPress={() => setShowRePassword(!showRePassword)}
                style={styles.passwordToggle}
              >
                {showRePassword ? (
                  <Eye size={18} color="#888" />
                ) : (
                  <EyeOff size={18} color="#888" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Button đăng ký */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            style={styles.registerButton}
          >
            <LinearGradient
              colors={['#004b8d', '#00c6ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerGradient}
            >
              <Text style={[styles.registerButtonText, { fontFamily: FONT_CONFIG.medium }]}>
                {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
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

          {/* Google & Facebook đăng ký */}
          {/* <View style={styles.socialContainer}>
            <TouchableOpacity 
              onPress={handleGoogleSignup}
              style={styles.socialButton}
            >
              <Image
                source={require('../assets/account/google.png')}
                style={styles.socialIcon}
              />
              <Text style={[styles.socialButtonText, { fontFamily: FONT_CONFIG.medium }]}>
                Đăng ký với Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleFacebookSignup}
              style={styles.socialButton}
            >
              <Image
                source={require('../assets/account/facebook.png')}
                style={styles.socialIcon}
              />
              <Text style={[styles.socialButtonText, { fontFamily: FONT_CONFIG.medium }]}>
                Đăng ký với Facebook
              </Text>
            </TouchableOpacity>
          </View> */}

          {/* Đã có tài khoản */}
          <View style={styles.loginPrompt}>
            <Text style={[styles.loginPromptText, { fontFamily: FONT_CONFIG.regular }]}>
              Đã có tài khoản?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { fontFamily: FONT_CONFIG.medium }]}>
                Đăng nhập
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal lỗi */}
        <Modal
          visible={showErrorModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowErrorModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, { fontFamily: FONT_CONFIG.bold }]}>
                Lỗi đăng ký
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
    </>
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
    marginBottom: 16,
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
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 10,
    padding: 2,
  },
  registerButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
    marginTop: 16,
  },
  registerGradient: {
    paddingVertical: 12,
    borderRadius: 10,
  },
  registerButtonText: {
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
  loginPrompt: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginPromptText: {
    color: '#6b7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#004b8d',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    alignSelf: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 13,
  },
});