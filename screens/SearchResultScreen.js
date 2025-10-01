// screens/SearchResultScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { 
  ChevronLeft, 
  Bookmark, 
  Filter,
  Search,
  SlidersHorizontal,
  Grid,
  List
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

import { articlesAPI, CategoriesAPI } from '../services/apiService';
import SkeletonLoader from '../components/SkeletonLoader';

export default function SearchResultScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get search parameters from route
  const { 
    query = '', 
    type = 'general', 
    category = '',
    filter = 'all' 
  } = route.params || {};

  // States
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [activeFilter, setActiveFilter] = useState(filter);
  const [selectedCategory, setSelectedCategory] = useState(category);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  
  // Refs
  const isInitialMount = useRef(true);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const result = await CategoriesAPI.getAll();
      if (result.success && Array.isArray(result.data)) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
    }
  }, []);

  // Fetch search results
  const fetchSearchResults = useCallback(async (pageNumber = 1, isRefresh = false) => {
    try {
      // Set loading states
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Build search parameters
      const searchParams = {
        page: pageNumber,
        limit: 20,
        sort: '-createdAt'
      };

      // Apply search query and filters
      if (query) {
        switch (activeFilter) {
          case 'title':
            searchParams.title = query;
            break;
          case 'author':
            searchParams.author = query;
            break;
          case 'category':
            searchParams.category = selectedCategory || query;
            break;
          default:
            searchParams.q = query;
        }
      }

      // Apply category filter if selected
      if (selectedCategory && activeFilter !== 'category') {
        searchParams.category = selectedCategory;
      }

      console.log('🔍 Search params:', searchParams);

      const response = await articlesAPI.search(searchParams);
      
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
          setTotalResults(response.pagination.totalCount || 0);
        } else {
          setHasMore(newArticles.length === 20); // Fallback
          setTotalResults(newArticles.length);
        }
      } else {
        throw new Error(response.message || 'Failed to fetch search results');
      }
    } catch (error) {
      console.error('❌ Search Error:', error);
      
      let errorMessage = 'Không thể tải kết quả tìm kiếm';
      
      if (error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Không có kết nối internet';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Kết nối quá chậm, vui lòng thử lại';
      }

      // Only show alert for first page load
      if (pageNumber === 1 && !isRefresh) {
        Alert.alert(
          'Lỗi tìm kiếm',
          errorMessage,
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Thử lại', onPress: () => fetchSearchResults(1) }
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [query, activeFilter, selectedCategory]);

  // Initialize screen
  useEffect(() => {
    loadCategories();
    
    if (query && isInitialMount.current) {
      isInitialMount.current = false;
      setTimeout(() => {
        fetchSearchResults(1);
      }, 300);
    }
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (!isInitialMount.current && query) {
      setArticles([]);
      setPage(1);
      setHasMore(true);
      fetchSearchResults(1);
    }
  }, [activeFilter, selectedCategory]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setHasMore(true);
    fetchSearchResults(1, true);
  }, [fetchSearchResults]);

  // Load more data when reaching end
  const onEndReached = useCallback(() => {
    if (hasMore && !loadingMore && !loading && articles.length > 0) {
      console.log('🔄 Loading more... Current page:', page);
      fetchSearchResults(page + 1);
    }
  }, [hasMore, loadingMore, loading, articles.length, page, fetchSearchResults]);

  // Format time helper
  const formatTime = useCallback((dateString) => {
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
  }, []);

  // Handle bookmark
  const handleBookmark = useCallback((article) => {
    console.log('Bookmark:', article._id);
    // TODO: Implement bookmark logic
  }, []);

  // Handle article press
  const handleArticlePress = useCallback((article) => {
    console.log('📖 Navigate to article:', article._id);
    navigation.navigate('ArticleDetail', { 
      article: article 
    });
  }, [navigation]);

  // Handle filter change
  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter);
  }, []);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryName) => {
    setSelectedCategory(categoryName === selectedCategory ? '' : categoryName);
  }, [selectedCategory]);

  // Render article item (List view)
  const renderListItem = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => handleArticlePress(item)}
      activeOpacity={0.8}
    >
      <View className="flex-row items-start justify-between py-4 border-b border-gray-100 px-4">
        <View className="flex-1 pr-3">
          <Text
            className="text-black font-sf-bold text-lg mb-1"
            numberOfLines={3}
          >
            {item.title || 'Không có tiêu đề'}
          </Text>
          <View className="flex-row items-center justify-between">
            <View className='flex-row items-center'>
              <Text className="text-gray-500 text-sm font-sf-medium">
                {item.author || 'Không rõ nguồn'}
              </Text>
              <Text className="mx-1 text-gray-400">•</Text>
              <Text className="text-gray-500 text-sm font-sf-regular">
                {formatTime(item.publishDate || item.createdAt)}
              </Text>
              {item.category && (
                <>
                  <Text className="mx-1 text-gray-400">•</Text>
                  <Text className="text-blue-600 text-sm font-sf-medium">
                    {item.category}
                  </Text>
                </>
              )}
            </View>

            <TouchableOpacity 
              onPress={() => handleBookmark(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Bookmark size={18} color="#666" />
            </TouchableOpacity>
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
            source={require('../assets/news.jpg')}
            className="w-28 h-28 rounded-md bg-gray-200"
            resizeMode="cover"
          />
        )}
      </View>
    </TouchableOpacity>
  ), [handleArticlePress, handleBookmark, formatTime]);

  // Render article item (Grid view)
  const renderGridItem = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => handleArticlePress(item)}
      activeOpacity={0.8}
      className="w-[48%] mb-4"
    >
      <View className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
        {/* Article Image */}
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            className="w-full h-32 bg-gray-200"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-32 bg-gray-200 items-center justify-center">
            <Text className="text-gray-400 text-xs text-center">
              Không có{'\n'}hình ảnh
            </Text>
          </View>
        )}
        
        <View className="p-3">
          <Text
            className="text-black font-sf-bold text-sm mb-2"
            numberOfLines={3}
          >
            {item.title || 'Không có tiêu đề'}
          </Text>
          
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-gray-500 text-xs font-sf-medium" numberOfLines={1}>
                {item.author || 'Không rõ nguồn'}
              </Text>
              <Text className="text-gray-400 text-xs font-sf-regular">
                {formatTime(item.publishDate || item.createdAt)}
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => handleBookmark(item)}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <Bookmark size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  ), [handleArticlePress, handleBookmark, formatTime]);

  // Render loading footer
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;

    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#007AFF" />
        <Text className="text-gray-500 font-sf-regular text-sm mt-1">
          Đang tải thêm...
        </Text>
      </View>
    );
  }, [loadingMore]);

  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (loading) return null;

    return (
      <View className="flex-1 items-center justify-center py-20 px-4">
        <Search size={48} color="#D1D5DB" />
        <Text className="text-gray-500 text-lg font-sf-bold mt-4 text-center">
          Không tìm thấy kết quả
        </Text>
        <Text className="text-gray-400 text-sm font-sf-regular mt-2 text-center">
          {query ? `Không có kết quả cho "${query}"` : 'Vui lòng thử lại với từ khóa khác'}
        </Text>
        <TouchableOpacity
          onPress={() => fetchSearchResults(1)}
          className="mt-4 px-6 py-2 bg-blue-500 rounded-lg"
        >
          <Text className="text-white font-sf-medium">Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading, query, fetchSearchResults]);

  // Render end reached
  const renderEndReached = useCallback(() => {
    if (hasMore || loading || loadingMore || articles.length === 0) return null;

    return (
      <View className="py-8 items-center border-t border-gray-100 mx-4">
        <View className="w-12 h-1 bg-gray-300 rounded-full mb-3"></View>
        <Text className="text-gray-500 text-sm font-sf-medium">Đã hết kết quả</Text>
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
      <View className="py-3 px-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 rounded-full bg-gray-100"
          >
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>

          {/* Title */}
          <View className="flex-1 mx-4">
            <Text
              className="text-xl font-sf-bold text-black text-center"
              numberOfLines={1}
            >
              {query ? `"${query}"` : 'Kết quả tìm kiếm'}
            </Text>
            {totalResults > 0 && (
              <Text className="text-gray-500 text-sm font-sf-regular text-center">
                {totalResults} kết quả
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-2">
            {/* View Mode Toggle */}
            <TouchableOpacity
              onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className="p-2 rounded-full bg-gray-100"
            >
              {viewMode === 'list' ? (
                <Grid size={20} color="#666" />
              ) : (
                <List size={20} color="#666" />
              )}
            </TouchableOpacity>

            {/* Filter Button */}
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full ${
                activeFilter !== 'all' || selectedCategory ? 'bg-blue-500' : 'bg-gray-100'
              }`}
            >
              <SlidersHorizontal 
                size={20} 
                color={activeFilter !== 'all' || selectedCategory ? '#FFF' : '#666'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <View className="mt-4 space-y-3">
            {/* Search Type Filters */}
            <View>
              <Text className="text-gray-600 font-sf-medium text-sm mb-2">Tìm kiếm theo:</Text>
              <View className="flex-row flex-wrap">
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'title', label: 'Tiêu đề' },
                  { key: 'author', label: 'Tác giả' },
                  { key: 'category', label: 'Danh mục' }
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    onPress={() => handleFilterChange(filter.key)}
                    className={`px-3 py-1.5 rounded-full mr-2 mb-2 ${
                      activeFilter === filter.key 
                        ? 'bg-blue-500' 
                        : 'bg-gray-200'
                    }`}
                  >
                    <Text className={`font-sf-medium text-sm ${
                      activeFilter === filter.key 
                        ? 'text-white' 
                        : 'text-gray-700'
                    }`}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Categories Filter */}
            {categories.length > 0 && (
              <View>
                <Text className="text-gray-600 font-sf-medium text-sm mb-2">Danh mục:</Text>
                <View className="flex-row flex-wrap">
                  {categories.map((category) => {
                    const categoryName = category.name || category.title || category;
                    return (
                      <TouchableOpacity
                        key={category._id || categoryName}
                        onPress={() => handleCategorySelect(categoryName)}
                        className={`px-3 py-1.5 rounded-full mr-2 mb-2 ${
                          selectedCategory === categoryName 
                            ? 'bg-green-500' 
                            : 'bg-gray-200'
                        }`}
                      >
                        <Text className={`font-sf-medium text-sm ${
                          selectedCategory === categoryName 
                            ? 'text-white' 
                            : 'text-gray-700'
                        }`}>
                          {categoryName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Active Filters Summary */}
            {(activeFilter !== 'all' || selectedCategory) && (
              <View className="pt-2 border-t border-gray-200">
                <Text className="text-gray-600 font-sf-medium text-sm mb-2">Bộ lọc đang áp dụng:</Text>
                <View className="flex-row flex-wrap">
                  {activeFilter !== 'all' && (
                    <View className="bg-blue-100 px-2 py-1 rounded mr-2 mb-1">
                      <Text className="text-blue-700 font-sf-medium text-xs">
                        {activeFilter === 'title' ? 'Tiêu đề' : 
                         activeFilter === 'author' ? 'Tác giả' : 
                         activeFilter === 'category' ? 'Danh mục' : 'Tất cả'}
                      </Text>
                    </View>
                  )}
                  {selectedCategory && (
                    <View className="bg-green-100 px-2 py-1 rounded mr-2 mb-1">
                      <Text className="text-green-700 font-sf-medium text-xs">
                        {selectedCategory}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <SkeletonLoader itemCount={8} />
      ) : articles.length > 0 ? (
        <FlatList
          data={articles}
          keyExtractor={(item, index) => item._id || `article-${index}`}
          renderItem={viewMode === 'list' ? renderListItem : renderGridItem}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when view mode changes
          columnWrapperStyle={viewMode === 'grid' ? { 
            justifyContent: 'space-between', 
            paddingHorizontal: 16 
          } : null}
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
          contentContainerStyle={{
            paddingBottom: 20,
            flexGrow: 1,
            paddingTop: viewMode === 'grid' ? 16 : 0,
          }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
        />
      ) : (
        renderEmptyState()
      )}
    </SafeAreaView>
  );
}













// // screens/SearchResultScreen.js
// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   Image,
//   StatusBar,
//   Alert,
//   RefreshControl,
//   ActivityIndicator,
//   StyleSheet,
//   ScrollView,
// } from 'react-native';
// import { 
//   ChevronLeft, 
//   Bookmark, 
//   Filter,
//   Search,
//   SlidersHorizontal,
//   Grid,
//   List
// } from 'lucide-react-native';
// import { useNavigation, useRoute } from '@react-navigation/native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

// import { articlesAPI, CategoriesAPI } from '../services/apiService';
// import SkeletonLoader from '../components/SkeletonLoader';

// export default function SearchResultScreen() {
//   const navigation = useNavigation();
//   const route = useRoute();
  
//   // Get search parameters from route
//   const { 
//     query = '', 
//     type = 'general', 
//     category = '',
//     filter = 'all' 
//   } = route.params || {};

//   // States
//   const [articles, setArticles] = useState([]);
//   const [categories, setCategories] = useState([]);
  
//   // Loading states
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [loadingMore, setLoadingMore] = useState(false);
  
//   // UI states
//   const [showFilters, setShowFilters] = useState(false);
//   const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
//   const [activeFilter, setActiveFilter] = useState(filter);
//   const [selectedCategory, setSelectedCategory] = useState(category);
  
//   // Pagination
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [totalResults, setTotalResults] = useState(0);
  
//   // Refs
//   const isInitialMount = useRef(true);

//   // Load categories
//   const loadCategories = useCallback(async () => {
//     try {
//       const result = await CategoriesAPI.getAll();
//       if (result.success && Array.isArray(result.data)) {
//         setCategories(result.data);
//       }
//     } catch (error) {
//       console.error('❌ Error loading categories:', error);
//     }
//   }, []);

//   // Fetch search results
//   const fetchSearchResults = useCallback(async (pageNumber = 1, isRefresh = false) => {
//     try {
//       // Set loading states
//       if (isRefresh) {
//         setRefreshing(true);
//       } else if (pageNumber === 1) {
//         setLoading(true);
//       } else {
//         setLoadingMore(true);
//       }

//       // Build search parameters
//       const searchParams = {
//         page: pageNumber,
//         limit: 20,
//         sort: '-createdAt'
//       };

//       // Apply search query and filters
//       if (query) {
//         switch (activeFilter) {
//           case 'title':
//             searchParams.title = query;
//             break;
//           case 'author':
//             searchParams.author = query;
//             break;
//           case 'category':
//             searchParams.category = selectedCategory || query;
//             break;
//           default:
//             searchParams.q = query;
//         }
//       }

//       // Apply category filter if selected
//       if (selectedCategory && activeFilter !== 'category') {
//         searchParams.category = selectedCategory;
//       }

//       console.log('🔍 Search params:', searchParams);

//       const response = await articlesAPI.search(searchParams);
      
//       console.log('📄 Page:', pageNumber, 'Total:', response.pagination?.totalCount);

//       if (response.success) {
//         const newArticles = response.data || [];
        
//         if (pageNumber === 1 || isRefresh) {
//           // Reset data for first page or refresh
//           setArticles(newArticles);
//           setPage(1);
//         } else {
//           // Append data for load more
//           setArticles(prevArticles => [...prevArticles, ...newArticles]);
//           setPage(pageNumber);
//         }

//         // Update pagination state
//         if (response.pagination) {
//           setHasMore(response.pagination.hasNextPage);
//           setTotalResults(response.pagination.totalCount || 0);
//         } else {
//           setHasMore(newArticles.length === 20); // Fallback
//           setTotalResults(newArticles.length);
//         }
//       } else {
//         throw new Error(response.message || 'Failed to fetch search results');
//       }
//     } catch (error) {
//       console.error('❌ Search Error:', error);
      
//       let errorMessage = 'Không thể tải kết quả tìm kiếm';
      
//       if (error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
//         errorMessage = 'Không có kết nối internet';
//       } else if (error.code === 'ECONNABORTED') {
//         errorMessage = 'Kết nối quá chậm, vui lòng thử lại';
//       }

//       // Only show alert for first page load
//       if (pageNumber === 1 && !isRefresh) {
//         Alert.alert(
//           'Lỗi tìm kiếm',
//           errorMessage,
//           [
//             { text: 'Hủy', style: 'cancel' },
//             { text: 'Thử lại', onPress: () => fetchSearchResults(1) }
//           ]
//         );
//       }
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//       setLoadingMore(false);
//     }
//   }, [query, activeFilter, selectedCategory]);

//   // Initialize screen
//   useEffect(() => {
//     loadCategories();
    
//     if (query && isInitialMount.current) {
//       isInitialMount.current = false;
//       setTimeout(() => {
//         fetchSearchResults(1);
//       }, 300);
//     }
//   }, []);

//   // Refetch when filters change
//   useEffect(() => {
//     if (!isInitialMount.current && query) {
//       setArticles([]);
//       setPage(1);
//       setHasMore(true);
//       fetchSearchResults(1);
//     }
//   }, [activeFilter, selectedCategory]);

//   // Pull to refresh
//   const onRefresh = useCallback(() => {
//     setHasMore(true);
//     fetchSearchResults(1, true);
//   }, [fetchSearchResults]);

//   // Load more data when reaching end
//   const onEndReached = useCallback(() => {
//     if (hasMore && !loadingMore && !loading && articles.length > 0) {
//       console.log('🔄 Loading more... Current page:', page);
//       fetchSearchResults(page + 1);
//     }
//   }, [hasMore, loadingMore, loading, articles.length, page, fetchSearchResults]);

//   // Format time helper
//   const formatTime = useCallback((dateString) => {
//     if (!dateString) return 'Không rõ';
    
//     try {
//       const now = new Date();
//       const date = new Date(dateString);
//       const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
//       if (diffInMinutes < 1) return 'Vừa xong';
//       if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
//       if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
      
//       const days = Math.floor(diffInMinutes / 1440);
//       if (days < 7) return `${days} ngày trước`;
      
//       return date.toLocaleDateString('vi-VN');
//     } catch {
//       return 'Không rõ';
//     }
//   }, []);

//   // Handle bookmark
//   const handleBookmark = useCallback((article) => {
//     console.log('Bookmark:', article._id);
//     // TODO: Implement bookmark logic
//   }, []);

//   // Handle article press
//   const handleArticlePress = useCallback((article) => {
//     console.log('📖 Navigate to article:', article._id);
//     navigation.navigate('ArticleDetail', { 
//       article: article 
//     });
//   }, [navigation]);

//   // Handle filter change
//   const handleFilterChange = useCallback((filter) => {
//     setActiveFilter(filter);
//   }, []);

//   // Handle category selection
//   const handleCategorySelect = useCallback((categoryName) => {
//     setSelectedCategory(categoryName === selectedCategory ? '' : categoryName);
//   }, [selectedCategory]);

//   // Render article item (List view)
//   const renderListItem = useCallback(({ item }) => (
//     <TouchableOpacity
//       onPress={() => handleArticlePress(item)}
//       activeOpacity={0.8}
//     >
//       <View style={styles.listItemContainer}>
//         <View style={styles.listItemContent}>
//           <Text
//             style={styles.listItemTitle}
//             className="text-black font-sf-bold mb-1"
//             numberOfLines={3}
//           >
//             {item.title || 'Không có tiêu đề'}
//           </Text>
//           <View className="flex-row items-center justify-between">
//             <View className='flex-row items-center'>
//               <Text style={styles.listItemAuthor} className="text-gray-500 font-sf-medium">
//                 {item.author || 'Không rõ nguồn'}
//               </Text>
//               <Text className="mx-1 text-gray-400">•</Text>
//               <Text style={styles.listItemTime} className="text-gray-500 font-sf-regular">
//                 {formatTime(item.publishDate || item.createdAt)}
//               </Text>
//               {item.category && (
//                 <>
//                   <Text className="mx-1 text-gray-400">•</Text>
//                   <Text style={styles.listItemCategory} className="text-blue-600 font-sf-medium">
//                     {item.category}
//                   </Text>
//                 </>
//               )}
//             </View>

//             <TouchableOpacity 
//               onPress={() => handleBookmark(item)}
//               hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//             >
//               <Bookmark size={moderateScale(18)} color="#666" />
//             </TouchableOpacity>
//           </View>
//         </View>
        
//         {/* Article Image */}
//         {item.image ? (
//           <Image
//             source={{ uri: item.image }}
//             style={styles.listItemImage}
//             resizeMode="cover"
//           />
//         ) : (
//           <View style={[styles.listItemImage, styles.placeholderImage]}>
//             <Text style={styles.placeholderText} className="text-gray-400 text-center">
//               Không có{'\n'}hình ảnh
//             </Text>
//           </View>
//         )}
//       </View>
//     </TouchableOpacity>
//   ), [handleArticlePress, handleBookmark, formatTime]);

//   // Render article item (Grid view)
//   const renderGridItem = useCallback(({ item }) => (
//     <TouchableOpacity
//       onPress={() => handleArticlePress(item)}
//       activeOpacity={0.8}
//       style={styles.gridItemContainer}
//     >
//       <View style={styles.gridItemCard}>
//         {/* Article Image */}
//         {item.image ? (
//           <Image
//             source={{ uri: item.image }}
//             style={styles.gridItemImage}
//             resizeMode="cover"
//           />
//         ) : (
//           <View style={[styles.gridItemImage, styles.placeholderImage]}>
//             <Text style={styles.placeholderTextSmall} className="text-gray-400 text-center">
//               Không có{'\n'}hình ảnh
//             </Text>
//           </View>
//         )}
        
//         <View style={styles.gridItemContent}>
//           <Text
//             style={styles.gridItemTitle}
//             className="text-black font-sf-bold mb-2"
//             numberOfLines={3}
//           >
//             {item.title || 'Không có tiêu đề'}
//           </Text>
          
//           <View className="flex-row items-center justify-between">
//             <View className="flex-1">
//               <Text style={styles.gridItemAuthor} className="text-gray-500 font-sf-medium" numberOfLines={1}>
//                 {item.author || 'Không rõ nguồn'}
//               </Text>
//               <Text style={styles.gridItemTime} className="text-gray-400 font-sf-regular">
//                 {formatTime(item.publishDate || item.createdAt)}
//               </Text>
//             </View>
            
//             <TouchableOpacity 
//               onPress={() => handleBookmark(item)}
//               hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
//             >
//               <Bookmark size={moderateScale(16)} color="#666" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </TouchableOpacity>
//   ), [handleArticlePress, handleBookmark, formatTime]);

//   // Render loading footer
//   const renderFooter = useCallback(() => {
//     if (!loadingMore) return null;

//     return (
//       <View style={styles.footerContainer}>
//         <ActivityIndicator size="small" color="#007AFF" />
//         <Text style={styles.footerText} className="text-gray-500 font-sf-regular mt-1">
//           Đang tải thêm...
//         </Text>
//       </View>
//     );
//   }, [loadingMore]);

//   // Render empty state
//   const renderEmptyState = useCallback(() => {
//     if (loading) return null;

//     return (
//       <View style={styles.emptyContainer}>
//         <Search size={moderateScale(48)} color="#D1D5DB" />
//         <Text style={styles.emptyTitle} className="text-gray-500 font-sf-bold mt-4 text-center">
//           Không tìm thấy kết quả
//         </Text>
//         <Text style={styles.emptySubtitle} className="text-gray-400 font-sf-regular mt-2 text-center">
//           {query ? `Không có kết quả cho "${query}"` : 'Vui lòng thử lại với từ khóa khác'}
//         </Text>
//         <TouchableOpacity
//           onPress={() => fetchSearchResults(1)}
//           style={styles.retryButton}
//         >
//           <Text className="text-white font-sf-medium">Thử lại</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }, [loading, query, fetchSearchResults]);

//   // Render end reached
//   const renderEndReached = useCallback(() => {
//     if (hasMore || loading || loadingMore || articles.length === 0) return null;

//     return (
//       <View style={styles.endContainer}>
//         <View style={styles.endLine}></View>
//         <Text style={styles.endText} className="text-gray-500 font-sf-medium">Đã hết kết quả</Text>
//         <Text style={styles.endSubtext} className="text-gray-400 font-sf-regular mt-1">Kéo xuống để làm mới</Text>
//       </View>
//     );
//   }, [hasMore, loading, loadingMore, articles.length]);

//   // Combine footer components
//   const ListFooterComponent = useCallback(() => (
//     <>
//       {renderFooter()}
//       {renderEndReached()}
//     </>
//   ), [renderFooter, renderEndReached]);

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="dark-content" backgroundColor="white" />
      
//       {/* Header */}
//       <View style={styles.header}>
//         <View className="flex-row items-center justify-between">
//           {/* Back Button */}
//           <TouchableOpacity
//             onPress={() => navigation.goBack()}
//             className="p-2 rounded-full bg-gray-100"
//           >
//             <ChevronLeft size={moderateScale(24)} color="#000" />
//           </TouchableOpacity>

//           {/* Title */}
//           <View style={styles.titleContainer}>
//             <Text
//               style={styles.headerTitle}
//               className="text-black font-sf-bold text-center"
//               numberOfLines={1}
//             >
//               {query ? `"${query}"` : 'Kết quả tìm kiếm'}
//             </Text>
//             {totalResults > 0 && (
//               <Text style={styles.headerSubtitle} className="text-gray-500 font-sf-regular text-center">
//                 {totalResults} kết quả
//               </Text>
//             )}
//           </View>

//           {/* Action Buttons */}
//           <View className="flex-row space-x-2">
//             {/* View Mode Toggle */}
//             <TouchableOpacity
//               onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
//               className="p-2 rounded-full bg-gray-100"
//             >
//               {viewMode === 'list' ? (
//                 <Grid size={moderateScale(20)} color="#666" />
//               ) : (
//                 <List size={moderateScale(20)} color="#666" />
//               )}
//             </TouchableOpacity>

//             {/* Filter Button */}
//             <TouchableOpacity
//               onPress={() => setShowFilters(!showFilters)}
//               className={`p-2 rounded-full ${
//                 activeFilter !== 'all' || selectedCategory ? 'bg-blue-500' : 'bg-gray-100'
//               }`}
//             >
//               <SlidersHorizontal 
//                 size={moderateScale(20)} 
//                 color={activeFilter !== 'all' || selectedCategory ? '#FFF' : '#666'} 
//               />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Filters Panel */}
//         {showFilters && (
//           <View style={styles.filtersPanel}>
//             {/* Search Type Filters */}
//             <View>
//               <Text style={styles.filterLabel} className="text-gray-600 font-sf-medium mb-2">Tìm kiếm theo:</Text>
//               <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//                 <View className="flex-row space-x-2">
//                   {[
//                     { key: 'all', label: 'Tất cả' },
//                     { key: 'title', label: 'Tiêu đề' },
//                     { key: 'author', label: 'Tác giả' },
//                     { key: 'category', label: 'Danh mục' }
//                   ].map((filter) => (
//                     <TouchableOpacity
//                       key={filter.key}
//                       onPress={() => handleFilterChange(filter.key)}
//                       className={`px-3 py-1.5 rounded-full ${
//                         activeFilter === filter.key 
//                           ? 'bg-blue-500' 
//                           : 'bg-gray-200'
//                       }`}
//                     >
//                       <Text className={`font-sf-medium text-sm ${
//                         activeFilter === filter.key 
//                           ? 'text-white' 
//                           : 'text-gray-700'
//                       }`}>
//                         {filter.label}
//                       </Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>
//               </ScrollView>
//             </View>

//             {/* Categories Filter */}
//             {categories.length > 0 && (
//               <View style={{ marginTop: verticalScale(12) }}>
//                 <Text style={styles.filterLabel} className="text-gray-600 font-sf-medium mb-2">Danh mục:</Text>
//                 <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//                   <View className="flex-row space-x-2">
//                     {categories.map((category) => {
//                       const categoryName = category.name || category.title || category;
//                       return (
//                         <TouchableOpacity
//                           key={category._id || categoryName}
//                           onPress={() => handleCategorySelect(categoryName)}
//                           className={`px-3 py-1.5 rounded-full ${
//                             selectedCategory === categoryName 
//                               ? 'bg-green-500' 
//                               : 'bg-gray-200'
//                           }`}
//                         >
//                           <Text className={`font-sf-medium text-sm ${
//                             selectedCategory === categoryName 
//                               ? 'text-white' 
//                               : 'text-gray-700'
//                           }`}>
//                             {categoryName}
//                           </Text>
//                         </TouchableOpacity>
//                       );
//                     })}
//                   </View>
//                 </ScrollView>
//               </View>
//             )}

//             {/* Active Filters Summary */}
//             {(activeFilter !== 'all' || selectedCategory) && (
//               <View style={styles.activeFilters}>
//                 <Text style={styles.filterLabel} className="text-gray-600 font-sf-medium mb-2">Bộ lọc đang áp dụng:</Text>
//                 <View className="flex-row flex-wrap">
//                   {activeFilter !== 'all' && (
//                     <View className="bg-blue-100 px-2 py-1 rounded mr-2 mb-1">
//                       <Text style={styles.activeFilterText} className="text-blue-700 font-sf-medium">
//                         {activeFilter === 'title' ? 'Tiêu đề' : 
//                          activeFilter === 'author' ? 'Tác giả' : 
//                          activeFilter === 'category' ? 'Danh mục' : 'Tất cả'}
//                       </Text>
//                     </View>
//                   )}
//                   {selectedCategory && (
//                     <View className="bg-green-100 px-2 py-1 rounded mr-2 mb-1">
//                       <Text style={styles.activeFilterText} className="text-green-700 font-sf-medium">
//                         {selectedCategory}
//                       </Text>
//                     </View>
//                   )}
//                 </View>
//               </View>
//             )}
//           </View>
//         )}
//       </View>

//       {/* Content */}
//       {loading ? (
//         <SkeletonLoader itemCount={8} />
//       ) : articles.length > 0 ? (
//         <FlatList
//           data={articles}
//           keyExtractor={(item, index) => item._id || `article-${index}`}
//           renderItem={viewMode === 'list' ? renderListItem : renderGridItem}
//           numColumns={viewMode === 'grid' ? 2 : 1}
//           key={viewMode} // Force re-render when view mode changes
//           columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : null}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               colors={['#007AFF']}
//               tintColor="#007AFF"
//             />
//           }
//           onEndReached={onEndReached}
//           onEndReachedThreshold={0.2}
//           ListFooterComponent={ListFooterComponent}
//           contentContainerStyle={styles.flatListContent}
//           removeClippedSubviews={true}
//           maxToRenderPerBatch={10}
//           updateCellsBatchingPeriod={50}
//           initialNumToRender={15}
//           windowSize={10}
//         />
//       ) : (
//         renderEmptyState()
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: 'white',
//   },
//   header: {
//     paddingVertical: verticalScale(12),
//     paddingHorizontal: scale(16),
//     backgroundColor: 'white',
//     borderBottomWidth: 1,
//     borderBottomColor: '#f3f4f6',
//   },
//   titleContainer: {
//     flex: 1,
//     marginHorizontal: scale(16),
//   },
//   headerTitle: {
//     fontSize: moderateScale(16),
//   },
//   headerSubtitle: {
//     fontSize: moderateScale(14),
//   },
//   filtersPanel: {
//     marginTop: verticalScale(16),
//   },
//   filterLabel: {
//     fontSize: moderateScale(14),
//   },
//   activeFilters: {
//     paddingTop: verticalScale(8),
//     borderTopWidth: 1,
//     borderTopColor: '#e5e7eb',
//     marginTop: verticalScale(12),
//   },
//   activeFilterText: {
//     fontSize: moderateScale(12),
//   },
//   listItemContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//     paddingVertical: verticalScale(16),
//     borderBottomWidth: 1,
//     borderBottomColor: '#f3f4f6',
//     paddingHorizontal: scale(16),
//   },
//   listItemContent: {
//     flex: 1,
//     paddingRight: scale(12),
//   },
//   listItemTitle: {
//     fontSize: moderateScale(18),
//     lineHeight: moderateScale(24),
//   },
//   listItemAuthor: {
//     fontSize: moderateScale(14),
//   },
//   listItemTime: {
//     fontSize: moderateScale(14),
//   },
//   listItemCategory: {
//     fontSize: moderateScale(14),
//   },
//   listItemImage: {
//     width: scale(112),
//     height: scale(112),
//     borderRadius: scale(8),
//     backgroundColor: '#f3f4f6',
//   },
//   gridItemContainer: {
//     width: '48%',
//     marginBottom: verticalScale(16),
//   },
//   gridItemCard: {
//     backgroundColor: 'white',
//     borderRadius: scale(12),
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 1,
//     borderWidth: 1,
//     borderColor: '#f3f4f6',
//   },
//   gridItemImage: {
//     width: '100%',
//     height: scale(128),
//     backgroundColor: '#f3f4f6',
//   },
//   gridItemContent: {
//     padding: scale(12),
//   },
//   gridItemTitle: {
//     fontSize: moderateScale(14),
//     lineHeight: moderateScale(18),
//   },
//   gridItemAuthor: {
//     fontSize: moderateScale(12),
//   },
//   gridItemTime: {
//     fontSize: moderateScale(12),
//   },
//   placeholderImage: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   placeholderText: {
//     fontSize: moderateScale(12),
//   },
//   placeholderTextSmall: {
//     fontSize: moderateScale(10),
//   },
//   footerContainer: {
//     paddingVertical: verticalScale(16),
//     alignItems: 'center',
//   },
//   footerText: {
//     fontSize: moderateScale(14),
//   },
//   emptyContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: verticalScale(80),
//     paddingHorizontal: scale(16),
//   },
//   emptyTitle: {
//     fontSize: moderateScale(18),
//   },
//   emptySubtitle: {
//     fontSize: moderateScale(14),
//   },
//   retryButton: {
//     marginTop: verticalScale(16),
//     paddingHorizontal: scale(24),
//     paddingVertical: verticalScale(8),
//     backgroundColor: '#3b82f6',
//     borderRadius: scale(8),
//   },
//   endContainer: {
//     paddingVertical: verticalScale(32),
//     alignItems: 'center',
//     borderTopWidth: 1,
//     borderTopColor: '#f3f4f6',
//     marginHorizontal: scale(16),
//   },
//   endLine: {
//     width: scale(48),
//     height: verticalScale(4),
//     backgroundColor: '#d1d5db',
//     borderRadius: scale(2),
//     marginBottom: verticalScale(12),
//   },
//   endText: {
//     fontSize: moderateScale(14),
//   },
//   endSubtext: {
//     fontSize: moderateScale(12),
//   },
//   gridRow: {
//     justifyContent: 'space-between',
//     paddingHorizontal: scale(16),
//   },
//   flatListContent: {
//     paddingBottom: verticalScale(20),
//     flexGrow: 1,
//   },
// });







