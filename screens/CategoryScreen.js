// screens/CategoryScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Bookmark, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonLoader from '../components/SkeletonLoader';
import { articlesAPI } from '../services/apiService';
import { API_BASE_URL } from '@env';

export default function CategoryScreen() {
  const navigation = useNavigation();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // Debug component mount
  useEffect(() => {
    console.log('🔧 CategoryScreen mounted');
    console.log('🔗 API_BASE_URL:', API_BASE_URL);
    console.log('🔗 Expected API URL:', `${API_BASE_URL}/api/articles`);
  }, []);

  // Fetch articles
  const fetchArticles = useCallback(async (pageNumber = 1, isRefresh = false) => {
    try {
      // Set loading states
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      const response = await articlesAPI.getAll({
        sort: '-createdAt',
        limit: 20,
        page: pageNumber,
        language: 'vi'
      });
      
      console.log('📄 Page:', pageNumber, 'Total:', response.pagination?.totalCount);

      if (response.success) {
        const newArticles = response.data || [];
        
        if (pageNumber === 1 || isRefresh) {
          // Reset data for first page or refresh
          setArticles(newArticles);
          setPage(1);
        } else {
          // Append data for load more
          setArticles(prevArticles => [...prevArticles, ...newArticles]);
          setPage(pageNumber);
        }

        // Update pagination state
        if (response.pagination) {
          setHasMore(response.pagination.hasNextPage);
        } else {
          setHasMore(newArticles.length === 20); // Fallback
        }
      } else {
        throw new Error(response.message || 'Failed to fetch articles');
      }
    } catch (error) {
      console.error('❌ Fetch Error:', error);
      
      let errorMessage = 'Không thể tải danh sách bài viết';
      
      if (error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Không có kết nối internet';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Kết nối quá chậm, vui lòng thử lại';
      }

      setError(errorMessage);

      // Only show alert for first page load
      if (pageNumber === 1 && !isRefresh) {
        Alert.alert(
          'Lỗi kết nối',
          errorMessage,
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Thử lại', onPress: () => fetchArticles(1) }
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load - luôn load lại mỗi lần vào screen
  useEffect(() => {
    // Reset tất cả state về ban đầu
    setArticles([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    
    // Load fresh data
    fetchArticles(1);
  }, []); // Bỏ dependency để luôn chạy khi mount

  // Focus listener để load lại khi quay về screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 Screen focused - Reloading data...');
      // Reset state và load lại
      setArticles([]);
      setPage(1);
      setHasMore(true);
      setError(null);
      fetchArticles(1);
    });

    return unsubscribe;
  }, [navigation, fetchArticles]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setHasMore(true);
    setError(null);
    fetchArticles(1, true);
  }, [fetchArticles]);

  // Load more data when reaching end
  const onEndReached = useCallback(() => {
    if (hasMore && !loadingMore && !loading && !error && articles.length > 0) {
      console.log('🔄 Loading more... Current page:', page);
      fetchArticles(page + 1);
    }
  }, [hasMore, loadingMore, loading, error, articles.length, page, fetchArticles]);

  // Format time helper
  const formatTime = (dateString) => {
    if (!dateString) return 'Không rõ';
    
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Vừa xong';
      if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
      
      const days = Math.floor(diffInMinutes / 1440);
      if (days < 7) return `${days} ngày trước`;
      
      return date.toLocaleDateString('vi-VN');
    } catch {
      return 'Không rõ';
    }
  };

  // Handle bookmark
  const handleBookmark = useCallback((article) => {
    console.log('Bookmark:', article._id);
    // TODO: Implement bookmark logic
  }, []);

  // Handle article press - Pass whole article object
  const handleArticlePress = useCallback((article) => {
    console.log('📖 Navigate to article:', article._id);

    console.log(article);
    
    
    // Navigate đến ArticleDetail với toàn bộ article object
    navigation.navigate('ArticleDetail', { 
      article: article // Pass whole article object
    });
  }, [navigation]);

  // Render article item
  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => handleArticlePress(item)}
      activeOpacity={0.8}
    >
      <View className="flex-row items-start justify-between py-4 border-b border-gray-100 px-4">
        <View className="flex-1 pr-3">
          <View className='flex-col flex '>
            <Text
              className="text-black font-sf-bold text-lg mb-1"
              numberOfLines={3}
            >
              {item.title || 'Không có tiêu đề'}
            </Text>
            <View className="flex-row items-center mt-1 justify-between">
              <View className='flex-row items-center'>
                <Text className="text-gray-500 text-sm font-sf-medium">
                  {item.author || 'Không rõ nguồn'}
                </Text>
                <Text className="mx-1 text-gray-400">•</Text>
                <Text className="text-gray-500 text-sm font-sf-regular">
                  {formatTime(item.publishDate || item.createdAt)}
                </Text>
              </View>

              <TouchableOpacity 
                onPress={() => handleBookmark(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Bookmark size={18} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Article Image */}
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            className="w-28 h-28 rounded-md bg-gray-200"
            resizeMode="cover"
          />
        ) : (
          <Image
            source={ require('../assets/logo_ai.jpg') }
            className="w-28 h-28 rounded-md bg-gray-200"
            resizeMode="cover"
          />
        )}
      </View>
    </TouchableOpacity>
  ), [handleArticlePress, handleBookmark, formatTime]);

  // Render loading footer với SkeletonLoader
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;

    return (
      <View className="">
        <SkeletonLoader itemCount={4} />
      </View>
    );
  }, [loadingMore]);

  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (loading) return null;

    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-gray-500 text-lg">
          {error || 'Không có bài viết nào'}
        </Text>
        <TouchableOpacity
          onPress={() => fetchArticles(1)}
          className="mt-4 px-6 py-2 bg-blue-500 rounded-lg"
        >
          <Text className="text-white font-sf-medium">Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading, error, fetchArticles]);

  // Render end reached
  const renderEndReached = useCallback(() => {
    if (hasMore || loading || loadingMore || articles.length === 0) return null;

    return (
      <View className="py-8 items-center border-t border-gray-100 mx-4">
        <View className="w-12 h-1 bg-gray-300 rounded-full mb-3"></View>
        <Text className="text-gray-500 text-sm font-sf-medium">Đã hết bài viết</Text>
        <Text className="text-gray-400 text-xs font-sf-regular mt-1">Kéo xuống để làm mới</Text>
      </View>
    );
  }, [hasMore, loading, loadingMore, articles.length]);

  // Combine footer components
  const ListFooterComponent = useCallback(() => (
    <>
      {renderFooter()}
      {renderEndReached()}
    </>
  ), [renderFooter, renderEndReached]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View className="py-3 px-4 bg-white relative">
        {/* Nút Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute left-4 top-1/2 -translate-y-2 p-2 rounded-full bg-gray-100 z-10"
          style={{
            top: '80%',
            transform: [{ translateY: -20 }],
          }}
        >
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>

        {/* Tiêu đề ở giữa */}
        <Text
          className="text-2xl font-sf-bold text-black text-center"
          numberOfLines={1}
        >
          Tất cả tin
        </Text>

        {/* Bóng đổ */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: '#000',
            opacity: 0.1,
          }}
        />
      </View>

      {/* Content */}
      {loading ? (
        <SkeletonLoader itemCount={8} />
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item, index) => item._id || `article-${index}`}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.2}
          ListFooterComponent={ListFooterComponent}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{
            paddingBottom: 120,
            flexGrow: 1,
          }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
          getItemLayout={undefined}
        />
      )}
    </SafeAreaView>
  );
}