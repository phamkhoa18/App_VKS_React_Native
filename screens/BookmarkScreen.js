// screens/BookmarkScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonLoader from '../components/SkeletonLoader';
import { useUser } from '../context/UserContext';
import { savedArticlesAPI } from '../services/apiService';

export default function BookmarkScreen() {
  const navigation = useNavigation();
  const { userId, updateSavedArticlesCount } = useUser();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  

    // Handle article press - Pass whole article object
    const handleArticlePress = useCallback((article) => {
      console.log('📖 Navigate to article:', article._id);
      
      // Navigate đến ArticleDetail với toàn bộ article object
      navigation.navigate('ArticleDetail', { 
        article: article // Pass whole article object
      });
    }, [navigation]);

  const loadBookmarks = async () => {
    if (!userId) {
      setArticles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await savedArticlesAPI.getUserSavedArticles(userId);
      
      if (response.success) {
        // Map response data to match the existing format
        const formattedArticles = response.data.map(item => ({
          _id: item.articleId?._id || item.articleId,
          title: item.articleId?.title || 'No title',
          source: item.articleId?.author || 'Unknown source',
          time: item.articleId?.publishDate,
          image: item.articleId?.image 
            ? { uri: item.articleId.image } 
            : require('../assets/logo_ai.jpg')
        }));
        
        setArticles(formattedArticles);
        await updateSavedArticlesCount(response.count || 0);
      } else {
        console.warn('⚠️ Failed to load bookmarks:', response.message);
        setArticles([]);
      }
    } catch (error) {
      console.error('❌ Error loading bookmarks:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    loadBookmarks();
  }, [userId]); // Thêm userId vào dependencies để reload khi user thay đổi

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookmarks();
    setRefreshing(false);
  };


  const handleRemoveBookmark = async (articleId) => {
    if (!userId) return;

    try {
      const response = await savedArticlesAPI.remove(userId, articleId);
      if (response.success) {
        setArticles(prevArticles => 
          prevArticles.filter(article => article._id !== articleId)
        );
        await updateSavedArticlesCount(articles.length - 1);
      }
    } catch (error) {
      console.error('❌ Error removing bookmark:', error);
    }
  };


  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleArticlePress(item)}
      activeOpacity={0.8}
    >
      <View className="flex-row items-start justify-between py-4 border-b border-gray-100 px-4">
        <View className="flex-1 pr-3">
          <View className="flex-col">
            <Text
              className="text-black font-sf-bold text-lg mb-1"
              numberOfLines={3}
            >
              {item.title}
            </Text>
            <View className="flex-row items-center mt-1 justify-between">
              <View className="flex-row items-center">
                <Text className="text-gray-500 text-sm font-sf-medium">
                  {item.source}
                </Text>
                <Text className="mx-1 text-gray-400">•</Text>
                <Text className="text-gray-500 text-sm font-sf-regular">
                  {formatTime(item.time)}
                </Text>
              </View>

              <TouchableOpacity 
                onPress={() => handleRemoveBookmark(item._id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Bookmark size={18} color="#007AFF" fill="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Image
          source={item.image}
          className="w-28 h-28 rounded-md bg-gray-200"
          resizeMode="cover"
        />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Bookmark size={64} color="#D1D5DB" />
      <Text className="text-gray-500 text-lg font-sf-medium mt-4 mb-2">
        Chưa có bookmark nào
      </Text>
      <Text className="text-gray-400 text-sm font-sf-regular text-center px-8">
        Bookmark các bài viết yêu thích để đọc sau
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View className="py-4 px-4 bg-white">
        <Text
          className="text-2xl font-sf-bold text-black text-center"
          numberOfLines={1}
        >
          Đã lưu
        </Text>
        
        {/* Subtitle with count */}
        {!loading && (
          <Text className="text-sm font-sf-regular text-gray-500 text-center mt-1">
            {articles.length > 0 ? `${articles.length} bài viết` : 'Không có bài viết nào'}
          </Text>
        )}

        {/* Shadow */}
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
        <SkeletonLoader itemCount={6} />
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => item._id}
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
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{
            paddingBottom: 120,
            flexGrow: 1,
          }}
        />
      )}
    </SafeAreaView>
  );
}