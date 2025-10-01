// services/apiService.js (Updated with Search)
// services/apiService.js (Updated)
import axios from 'axios';
import Constants from 'expo-constants';

// Lấy config từ Constants thay vì @env
const config = {
  API_BASE_URL: Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:3000',
  API_TIMEOUT: parseInt(Constants.expoConfig?.extra?.API_TIMEOUT) || 10000,
  APP_ENV: Constants.expoConfig?.extra?.APP_ENV || 'development',
};

console.log('🔧 VKS News API Config:', config);

const api = axios.create({
  baseURL: config.API_BASE_URL + '/api',
  timeout: config.API_TIMEOUT,
});

// Thêm interceptor để debug
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      params: config.params
    });
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data?.success ? 'Success' : 'Failed'
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export const articlesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/articles', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/articles/${id}`);
    console.log('✅ Article detail response:', response.data);
    return response.data;
  },

  // ✅ NEW: Search articles with multiple filters
  search: async (params = {}) => {
    try {
      console.log('📤 Searching articles with params:', params);
      
      // Build search parameters
      const searchParams = {
        page: params.page || 1,
        limit: params.limit || 20,
        sort: params.sort || '-createdAt',
        ...params
      };

      // Remove empty values
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] === '' || searchParams[key] === null || searchParams[key] === undefined) {
          delete searchParams[key];
        }
      });

      console.log('📤 Final search params:', searchParams);

      const response = await api.get('/articles/search', { params: searchParams });
      console.log('✅ Search results:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ articlesAPI.search Error:', error);
      console.error('❌ Error response:', error.response?.data);
      return {
        success: false,
        data: [],
        pagination: {
          page: 1,
          totalPages: 0,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false
        },
        message: error.response?.data?.message || 'Lỗi khi tìm kiếm'
      };
    }
  },

  // ✅ NEW: Get suggestions for search
  getSuggestions: async (query) => {
    try {
      console.log('📤 Getting search suggestions for:', query);
      const response = await api.get('/articles/suggestions', { 
        params: { q: query, limit: 5 } 
      });
      console.log('✅ Search suggestions:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ articlesAPI.getSuggestions Error:', error);
      return {
        success: false,
        data: [],
        message: 'Không thể lấy gợi ý tìm kiếm'
      };
    }
  },

  getRelated: async (articleId, limit = 4) => {
    try {
      console.log('📤 Fetching related articles for:', articleId);
      
      const response = await api.get('/articles', { 
        params: { 
          limit: limit + 5,
          sort: '-createdAt'
        } 
      });
      
      if (response.data.success) {
        const filteredData = response.data.data?.filter(
          article => article._id !== articleId
        ).slice(0, limit) || [];
        
        console.log('✅ Related articles filtered:', filteredData.length);
        
        return {
          success: true,
          data: filteredData,
          message: 'Related articles loaded'
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ articlesAPI.getRelated Error:', error);
      
      return {
        success: true,
        data: [],
        message: 'No related articles available'
      };
    }
  }
};

// ✅ SAVED ARTICLES API - HOÀN CHỈNH
export const savedArticlesAPI = {
  save: async (userId, articleId) => {
    try {
      console.log('📤 Saving article:', { userId, articleId });
      const response = await api.post('/savedArticle', { userId, articleId });
      console.log('✅ Article saved:', response.data);
      return {
        success: true,
        data: response.data,
        message: 'Đã lưu bài viết thành công'
      };
    } catch (error) {
      console.error('❌ savedArticlesAPI.save Error:', error);
      
      if (error.response?.status === 400 && 
          error.response?.data?.message?.includes('already saved')) {
        return {
          success: false,
          message: 'Bài viết đã được lưu trước đó',
          code: 'ALREADY_SAVED'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể lưu bài viết',
        error: error.message
      };
    }
  },

  checkSaved: async (userId, articleId) => {
    try {
      console.log('📤 Checking saved status:', { userId, articleId });
      const response = await api.get(`/savedArticle/check/${userId}/${articleId}`);
      console.log('✅ Saved status checked:', response.data);
      return {
        success: true,
        isSaved: response.data.isSaved || false,
        savedArticle: response.data.savedArticle || null
      };
    } catch (error) {
      console.error('❌ savedArticlesAPI.checkSaved Error:', error);
      return {
        success: false,
        isSaved: false,
        message: error.response?.data?.message || 'Không thể kiểm tra trạng thái lưu'
      };
    }
  },

  remove: async (userId, articleId) => {
    try {
      console.log('📤 Removing saved article:', { userId, articleId });
      const response = await api.delete(`/savedArticle/user/${userId}/article/${articleId}`);
      console.log('✅ Saved article removed:', response.data);
      return {
        success: true,
        message: 'Đã bỏ lưu bài viết thành công'
      };
    } catch (error) {
      console.error('❌ savedArticlesAPI.remove Error:', error);
      
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Bài viết chưa được lưu',
          code: 'NOT_FOUND'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể bỏ lưu bài viết'
      };
    }
  },

  getUserSavedArticles: async (userId) => {
    try {
      console.log('📤 Fetching user saved articles:', userId);
      const response = await api.get(`/savedArticle/user/${userId}`);
      console.log('✅ User saved articles loaded:', response.data?.length || 0);
      return {
        success: true,
        data: response.data || [],
        count: response.data?.length || 0
      };
    } catch (error) {
      console.error('❌ savedArticlesAPI.getUserSavedArticles Error:', error);
      return {
        success: false,
        data: [],
        count: 0,
        message: error.response?.data?.message || 'Không thể tải danh sách bài viết đã lưu'
      };
    }
  },

  getUserSavedCount: async (userId) => {
    try {
      console.log('📤 Fetching saved articles count:', userId);
      const response = await api.get(`/savedArticle/user/${userId}/count`);
      console.log('✅ Saved articles count:', response.data);
      return {
        success: true,
        count: response.data.count || 0
      };
    } catch (error) {
      console.error('❌ savedArticlesAPI.getUserSavedCount Error:', error);
      return {
        success: false,
        count: 0,
        message: error.response?.data?.message || 'Không thể đếm số bài viết đã lưu'
      };
    }
  },

  getAll: async () => {
    try {
      console.log('📤 Fetching all saved articles...');
      const response = await api.get('/savedArticle');
      console.log('✅ All saved articles loaded:', response.data?.length || 0);
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('❌ savedArticlesAPI.getAll Error:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Không thể tải tất cả bài viết đã lưu'
      };
    }
  }
};

export const sectionsAPI = {
  getAll: async (params = {}) => {
    try {
      console.log('📤 Fetching sections with params:', params);
      const response = await api.get('/sections', { params });
      console.log('✅ Sections response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ sectionsAPI.getAll Error:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  },

  getById: async (id) => {
    try {
      console.log('📤 Fetching section by ID:', id);
      const response = await api.get(`/sections/${id}`);
      console.log('✅ Section detail response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ sectionsAPI.getById Error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  },

  getBySlug: async (slug) => {
    try {
      console.log('📤 Fetching section by slug:', slug);
      const response = await api.get(`/sections/slug/${slug}`);
      console.log('✅ Section by slug response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ sectionsAPI.getBySlug Error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  },

  getLatest: async () => {
    try {
      console.log('📤 Fetching latest section...');
      const response = await api.get('/sections', { 
        params: { 
          page: 1, 
          limit: 1 
        } 
      });
      
      if (response.data.success && response.data.data.length > 0) {
        console.log('✅ Latest section loaded');
        return {
          success: true,
          data: response.data.data[0],
          pagination: response.data.pagination
        };
      }
      
      return {
        success: false,
        data: null,
        message: 'No sections found'
      };
    } catch (error) {
      console.error('❌ sectionsAPI.getLatest Error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  },

  getPage: async (page = 1, limit = 1) => {
    try {
      console.log(`📤 Fetching sections page ${page}...`);
      const response = await api.get('/sections', { 
        params: { 
          page, 
          limit 
        } 
      });
      console.log(`✅ Sections page ${page} loaded:`, response.data.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('❌ sectionsAPI.getPage Error:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  },

  generate: async (limit = 15) => {
    try {
      console.log('📤 Generating new section from articles...');
      const response = await api.post('/sections/generate', { limit });
      console.log('✅ Section generated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ sectionsAPI.generate Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export const CategoriesAPI = {
  getAll: async (params = {}) => {
    try {
      console.log('📤 Fetching categories...');
      const response = await api.get('/categories', { params });
      console.log('✅ Categories loaded:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ CategoriesAPI.getAll Error:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  },

  // ✅ NEW: Search by category
  searchByCategory: async (categoryName, params = {}) => {
    try {
      console.log('📤 Searching articles by category:', categoryName);
      const searchParams = {
        category: categoryName,
        page: params.page || 1,
        limit: params.limit || 20,
        sort: params.sort || '-createdAt',
        ...params
      };

      // Use articles search API with category filter
      return await articlesAPI.search(searchParams);
    } catch (error) {
      console.error('❌ CategoriesAPI.searchByCategory Error:', error);
      return {
        success: false,
        data: [],
        message: 'Không thể tìm kiếm theo danh mục'
      };
    }
  }
};

export default api;