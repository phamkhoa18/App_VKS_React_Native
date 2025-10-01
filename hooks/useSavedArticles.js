// hooks/useSavedArticles.js
import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { savedArticlesAPI } from '../services/apiService';
import { useUser } from '../context/UserContext';

// ✅ HOOK QUẢN LÝ SAVED ARTICLES CHO MỘT ARTICLE CỤ THỂ
export const useSavedArticles = (articleId) => {
  const { userId, updateSavedArticlesCount } = useUser();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // ✅ CHECK SAVED STATUS
const checkSavedStatus = useCallback(async () => {
  if (!articleId || !userId) {
    console.log('❌ Missing params:', { articleId, userId });
    return;
  }
  
  setIsLoading(true);
  try {
    console.log('🔍 Checking saved status for:', { articleId, userId });
    const response = await savedArticlesAPI.checkSaved(userId, articleId);
    console.log('📥 Response:', response);
    
    if (response.success) {
      setIsSaved(response.isSaved || false);
      console.log('✅ Saved status:', response.isSaved);
    } else {
      console.warn('⚠️ Check saved failed:', response.message);
    }
  } catch (error) {
    console.error('❌ Error checking saved status:', error);
  } finally {
    setIsLoading(false);
  }
}, [articleId, userId])

  // ✅ TOGGLE SAVE STATUS
  const toggleSave = useCallback(async () => {
    if (!articleId || !userId || isToggling) return;
    
    setIsToggling(true);
    
    try {
      let response;
      const previousState = isSaved;
      
      // Optimistic update
      setIsSaved(!isSaved);
      
      if (isSaved) {
        // Remove from saved
        console.log('🗑️ Removing article from saved...');
        response = await savedArticlesAPI.remove(userId, articleId);
        
        if (response.success) {
          console.log('✅ Article removed from saved');
          
          // Update saved count in user context
          try {
            const countResponse = await savedArticlesAPI.getUserSavedCount(userId);
            if (countResponse.success) {
              await updateSavedArticlesCount(countResponse.count);
            }
          } catch (countError) {
            console.warn('⚠️ Could not update saved count:', countError);
          }
          
          return {
            success: true,
            action: 'removed',
            message: 'Đã bỏ lưu bài viết'
          };
        } else {
          throw new Error(response.message || 'Không thể bỏ lưu bài viết');
        }
      } else {
        // Save article
        console.log('💾 Saving article...');
        response = await savedArticlesAPI.save(userId, articleId);
        
        if (response.success) {
          console.log('✅ Article saved successfully');
          
          // Update saved count in user context
          try {
            const countResponse = await savedArticlesAPI.getUserSavedCount(userId);
            if (countResponse.success) {
              await updateSavedArticlesCount(countResponse.count);
            }
          } catch (countError) {
            console.warn('⚠️ Could not update saved count:', countError);
          }
          
          return {
            success: true,
            action: 'saved',
            message: 'Đã lưu bài viết'
          };
        } else {
          throw new Error(response.message || 'Không thể lưu bài viết');
        }
      }
    } catch (error) {
      console.error('❌ Error toggling save:', error);
      
      // Revert optimistic update
      setIsSaved(previousState);
      
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi thực hiện thao tác'
      };
    } finally {
      setIsToggling(false);
    }
  }, [articleId, userId, isSaved, isToggling, updateSavedArticlesCount]);

  // ✅ TOGGLE WITH ALERT
  const toggleSaveWithAlert = useCallback(async () => {
    if (!userId) {
      Alert.alert(
        'Cần đăng nhập',
        'Bạn cần đăng nhập để lưu bài viết',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await toggleSave();
    
    if (result?.success) {
      Alert.alert('Thành công', result.message);
    } else if (result?.error) {
      Alert.alert('Lỗi', result.error, [{ text: 'OK' }]);
    }
  }, [toggleSave, userId]);

  // ✅ TOGGLE WITHOUT ALERT (FOR UI FEEDBACK)
  const toggleSaveSilent = useCallback(async () => {
    if (!userId) return { success: false, error: 'Cần đăng nhập' };
    return await toggleSave();
  }, [toggleSave, userId]);

  // ✅ AUTO CHECK WHEN PARAMS CHANGE
  useEffect(() => {
    if (articleId && userId) {
      checkSavedStatus();
    }
  }, [checkSavedStatus]);

  return {
    isSaved,
    isLoading,
    isToggling,
    toggleSave,
    toggleSaveWithAlert,
    toggleSaveSilent,
    checkSavedStatus,
    
    // Helper states
    canToggle: !isToggling && userId && articleId,
    isAuthenticated: !!userId,
    
    // Icon properties
    saveIcon: {
      color: isSaved ? "#3B82F6" : "#374151",
      fill: isSaved ? "#3B82F6" : "none"
    }
  };
};

// ✅ HOOK LẤY DANH SÁCH SAVED ARTICLES CỦA USER
export const useUserSavedArticles = () => {
  const { userId, updateSavedArticlesCount } = useUser();
  const [savedArticles, setSavedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);

  // ✅ FETCH USER SAVED ARTICLES
  const fetchSavedArticles = useCallback(async () => {
    if (!userId) {
      setSavedArticles([]);
      setCount(0);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📤 Fetching user saved articles...');
      const response = await savedArticlesAPI.getUserSavedArticles(userId);
      
      if (response.success) {
        setSavedArticles(response.data || []);
        setCount(response.count || 0);
        
        // Update count in user context
        await updateSavedArticlesCount(response.count || 0);
        
        console.log('✅ Saved articles loaded:', response.count || 0);
      } else {
        throw new Error(response.message || 'Không thể tải danh sách bài viết đã lưu');
      }
    } catch (error) {
      console.error('❌ Error fetching saved articles:', error);
      setError(error.message);
      setSavedArticles([]);
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [userId, updateSavedArticlesCount]);

  // ✅ FETCH SAVED COUNT ONLY
  const fetchSavedCount = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('📤 Fetching saved articles count...');
      const response = await savedArticlesAPI.getUserSavedCount(userId);
      
      if (response.success) {
        setCount(response.count || 0);
        await updateSavedArticlesCount(response.count || 0);
        console.log('✅ Saved articles count:', response.count);
      }
    } catch (error) {
      console.error('❌ Error fetching saved count:', error);
    }
  }, [userId, updateSavedArticlesCount]);

  // ✅ REMOVE SAVED ARTICLE FROM LIST
  const removeSavedArticle = useCallback(async (articleId) => {
    if (!userId || !articleId) return;
    
    try {
      const response = await savedArticlesAPI.remove(userId, articleId);
      
      if (response.success) {
        // Remove from local state
        setSavedArticles(prev => prev.filter(item => 
          item.articleId?._id !== articleId && item.articleId !== articleId
        ));
        
        // Update count
        setCount(prev => Math.max(0, prev - 1));
        await updateSavedArticlesCount(Math.max(0, count - 1));
        
        return { success: true, message: 'Đã bỏ lưu bài viết' };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('❌ Error removing saved article:', error);
      return { success: false, error: error.message };
    }
  }, [userId, count, updateSavedArticlesCount]);

  // ✅ REFRESH DATA
  const refresh = useCallback(async () => {
    await fetchSavedArticles();
  }, [fetchSavedArticles]);

  // ✅ AUTO FETCH WHEN USER ID CHANGES
  useEffect(() => {
    if (userId) {
      refresh();
    } else {
      setSavedArticles([]);
      setCount(0);
      setError(null);
    }
  }, [userId, refresh]);

  return {
    savedArticles,
    count,
    isLoading,
    error,
    fetchSavedArticles,
    fetchSavedCount,
    removeSavedArticle,
    refresh,
    
    // Helper states
    hasArticles: savedArticles.length > 0,
    isEmpty: !isLoading && savedArticles.length === 0,
    isAuthenticated: !!userId
  };
};