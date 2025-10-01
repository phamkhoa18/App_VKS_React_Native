// services/authAPI.js
import api from './apiService';

export const authAPI = {
  // Register new user
  register: async (userData) => {
    try {
      console.log('📤 Registering user:', userData.email);
      
      const response = await api.post('/users/register', {
        name: userData.fullName,
        email: userData.email,
        password: userData.password,
        role: 'user'
      });

      console.log('✅ Registration successful:', response.data);
      return {
        success: true,
        data: response.data,
        message: 'Registration successful'
      };

    } catch (error) {
      console.error('❌ Registration error:', error);
      
      let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      
      if (error.response?.data?.message) {
        switch (error.response.data.message) {
          case 'Email already exists':
            errorMessage = 'Email này đã được đăng ký. Vui lòng sử dụng email khác.';
            break;
          default:
            errorMessage = error.response.data.message;
        }
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
      }

      return {
        success: false,
        error: errorMessage,
        data: null
      };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      console.log('📤 Logging in user:', credentials.email);
      
      const response = await api.post('/users/login', {
        email: credentials.email,
        password: credentials.password
      });

      console.log('✅ Login successful:', response.data);
      return {
        success: true,
        data: response.data,
        message: 'Login successful'
      };

    } catch (error) {
      console.error('❌ Login error:', error);
      
      let errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      
      if (error.response?.data?.message) {
        switch (error.response.data.message) {
          case 'Invalid email or password':
            errorMessage = 'Email hoặc mật khẩu không đúng.';
            break;
          default:
            errorMessage = error.response.data.message;
        }
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
      }

      return {
        success: false,
        error: errorMessage,
        data: null
      };
    }
  },

  // Get user profile
  getProfile: async (userId) => {
    try {
      console.log('📤 Fetching user profile:', userId);
      
      const response = await api.get(`/users/${userId}`);

      console.log('✅ Profile fetched:', response.data);
      return {
        success: true,
        data: response.data,
        message: 'Profile fetched successfully'
      };

    } catch (error) {
      console.error('❌ Get profile error:', error);
      
      return {
        success: false,
        error: 'Không thể tải thông tin người dùng.',
        data: null
      };
    }
  },

  // Update user profile
  updateProfile: async (userId, updateData) => {
    try {
      console.log('📤 Updating user profile:', userId);
      
      const response = await api.put(`/users/${userId}`, updateData);

      console.log('✅ Profile updated:', response.data);
      return {
        success: true,
        data: response.data,
        message: 'Profile updated successfully'
      };

    } catch (error) {
      console.error('❌ Update profile error:', error);
      
      return {
        success: false,
        error: 'Không thể cập nhật thông tin người dùng.',
        data: null
      };
    }
  },

  // Format user data for AsyncStorage
  formatUserData: (apiUser) => {
    return {
      id: apiUser._id,
      name: apiUser.name,
      email: apiUser.email,
      avatar: apiUser.avatar || 'https://cdn-icons-png.flaticon.com/512/9131/9131529.png',
      memberSince: new Date(apiUser.createdAt).getFullYear().toString(),
      isVerified: false, // Can be updated based on API response
      savedArticles: 0,   // Will be updated with actual user stats
      favoriteTopics: 0,  // Will be updated with actual user stats
      role: apiUser.role || 'user',
      createdAt: apiUser.createdAt,
      updatedAt: apiUser.updatedAt
    };
  }
};