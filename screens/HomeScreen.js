import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Search, AudioLines, Clock, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TextReader from '../components/TextReader';
import { sectionsAPI, CategoriesAPI, articlesAPI } from '../services/apiService';

// Memoized components (giữ nguyên)
const MemoizedNewsItem = React.memo(({ article, showDivider = true, onPress }) => (
  <TouchableOpacity 
    className="mb-3"
    onPress={() => onPress(article)}
  >
    <View className="flex-row">
      <View className="flex-1 pr-3">
        <Text
          ellipsizeMode="tail"
          style={styles.newsText}
          className="font-sf-medium text-gray-800"
        >
          {article.title}
        </Text>
      </View>
      <Image
        source={article.image ? { uri: article.image } : require('../assets/logo_ai.jpg')}
        style={styles.newsImage}
        defaultSource={require('../assets/logo_ai.jpg')}
      />
    </View>
    {showDivider && <View style={styles.divider} />}
  </TouchableOpacity>
));

const MemoizedArticleCard = React.memo(({ item, onPress }) => (
  <TouchableOpacity
    className="rounded-lg w-[48%] flex flex-col gap-0 justify-between"
    onPress={() => onPress(item)}
  >
    <View>
      <Image
        source={item.image ? { uri: item.image } : require('../assets/news.jpg')}
        style={styles.articleImage}
        resizeMode="cover"
        defaultSource={require('../assets/logo_ai.jpg')}
      />
      <Text style={styles.articleTitle} className="font-sf-bold text-gray-900" numberOfLines={3}>
        {item.title}
      </Text>
    </View>
    <View className="flex-row items-center gap-1">
      <Text style={styles.sourceText} className="font-sf-medium text-gray-400">{item.author}</Text>
      <Text style={styles.timeText} className="font-sf-medium text-gray-400">• {item.time}</Text>
    </View>
  </TouchableOpacity>
));

const MemoizedCategoryItem = React.memo(({ item, isSelected, onPress }) => (
  <TouchableOpacity
    className={`mr-2 px-4 py-2 rounded-lg items-center justify-center ${
      isSelected ? 'bg-black' : 'bg-gray-200'
    }`}
    onPress={() => onPress(item)}
  >
    <Text
      style={styles.categoryText}
      className={`font-sf-medium ${isSelected ? 'text-white' : 'text-black'}`}
    >
      {item}
    </Text>
  </TouchableOpacity>
));

export default function HomeScreen() {
  const [articles, setArticles] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showReader, setShowReader] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const currentArticlePage = useRef(1);
  const currentSectionPage = useRef(1);
  const [hasMoreArticles, setHasMoreArticles] = useState(true);
  const [hasMoreSections, setHasMoreSections] = useState(true);

  const today = new Date();

  // format ngày theo tiếng Việt
  const formattedDate = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long", // Thứ Hai, Thứ Ba...
    day: "numeric",  // số ngày
    month: "long",   // tháng 8
  }).format(today);

  const loadingFlags = useRef({
    categories: false,
    articles: false,
    sections: false,
    initial: false,
  });

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const formatTimeAgo = useCallback((dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} tiếng trước`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    }
  }, []);

  const loadCategories = useCallback(async () => {
    if (loadingFlags.current.categories) return;
    loadingFlags.current.categories = true;
    try {
      const result = await CategoriesAPI.getAll();
      let categoriesData = [];
      if (result && Array.isArray(result)) {
        categoriesData = result;
      } else if (result?.success && Array.isArray(result.data)) {
        categoriesData = result.data;
      } else if (Array.isArray(result?.data)) {
        categoriesData = result.data;
      } else if (Array.isArray(result?.categories)) {
        categoriesData = result.categories;
      }
      if (categoriesData.length > 0) {
        const categoryNames = ['All', ...categoriesData.map(cat => 
          cat.name || cat.title || cat.label || cat._id || 'Unknown'
        )];
        setCategories(categoryNames);
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      setCategories(['All']);
    } finally {
      loadingFlags.current.categories = false;
    }
  }, []);

  const loadArticles = useCallback(async (page = 1, isLoadMore = false) => {
    if (loadingFlags.current.articles && !isLoadMore) return;
    if (!isLoadMore) loadingFlags.current.articles = true;
    try {
      const params = { page, limit: 8, sort: '-createdAt' };
      const result = await articlesAPI.getAll(params);
      if (result.success && result.data && Array.isArray(result.data)) {
        const articlesData = result.data.map(article => ({
          id: article._id,
          _id: article._id,
          title: article.title,
          summary: article.summary,
          content: article.content,
          author: article.author,
          image: article.image,
          source: article.source || 'AI',
          time: formatTimeAgo(article.createdAt),
          createdAt: article.createdAt,
          category: article.category,
          url: article.url,
        }));
        if (isLoadMore) {
          setArticles(prev => [...prev, ...articlesData]);
        } else {
          setArticles(articlesData);
        }
        setHasMoreArticles(result.pagination?.hasNextPage || false);
        currentArticlePage.current = page;
      } else {
        if (!isLoadMore) setArticles([]);
        setHasMoreArticles(false);
      }
    } catch (error) {
      console.error('❌ Error loading articles:', error);
      if (!isLoadMore) setArticles([]);
      setHasMoreArticles(false);
    } finally {
      if (!isLoadMore) loadingFlags.current.articles = false;
    }
  }, [formatTimeAgo]);

  const loadSections = useCallback(async (page = 1, isLoadMore = false) => {
    if (loadingFlags.current.sections && !isLoadMore) return;
    if (!isLoadMore) loadingFlags.current.sections = true;
    try {
      const result = await sectionsAPI.getPage(page, 1);
      if (result.success && result.data && result.data.length > 0) {
        const sectionData = result.data;
        if (isLoadMore) {
          setAllSections(prev => [...prev, ...sectionData]);
        } else {
          setAllSections(sectionData);
        }
        currentSectionPage.current = page;
        setHasMoreSections(result.pagination?.hasNextPage || false);
      } else {
        setHasMoreSections(false);
      }
    } catch (error) {
      console.error('❌ Error loading sections:', error);
      setHasMoreSections(false);
    } finally {
      if (!isLoadMore) loadingFlags.current.sections = false;
    }
  }, []);

  const handleArticlePress = useCallback((article) => {
    navigation.navigate('ArticleDetail', { article });
  }, [navigation]);

  const handleCategorySelect = useCallback((category) => {
  if (category === selectedCategory) return;
  
  // Nếu là "All", chỉ cập nhật state local
  if (category === 'All') {
    setSelectedCategory(category);
    return;
  }
  
  // Với các category cụ thể, chuyển THẲNG đến SearchResultScreen
  console.log('🔍 Navigate directly to search results for category:', category);
  navigation.navigate('SearchResult', {
    query: category,
    type: 'category',
    category: category,
    filter: 'category'
  });
  
  // Cập nhật state để UI hiển thị đúng
}, [selectedCategory, navigation]);

// Cũng cập nhật handleSearchPress để vẫn đi qua SearchScreen để người dùng có thể gõ
const handleSearchPress = useCallback(() => {
  navigation.navigate('Search');
}, [navigation]);

  const scrollTimeout = useRef(null);
  const handleScroll = useCallback((event) => {
    event.persist();
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      if (!event.nativeEvent || !event.nativeEvent.layoutMeasurement) return;
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      if (!layoutMeasurement || !contentOffset || !contentSize) return;
      const paddingToBottom = 300;
      if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
        if (!loadingMore && (hasMoreArticles || hasMoreSections)) {
          setLoadingMore(true);
          const promises = [];
          if (hasMoreArticles) promises.push(loadArticles(currentArticlePage.current + 1, true));
          if (hasMoreSections) promises.push(loadSections(currentSectionPage.current + 1, true));
          Promise.all(promises).finally(() => setLoadingMore(false));
        }
      }
    }, 200);
  }, [loadingMore, hasMoreArticles, hasMoreSections, loadArticles, loadSections]);

  const generateFullText = useCallback(() => {
    if (!allSections || allSections.length === 0) {
      return 'Chưa có dữ liệu tóm tắt tin tức. Vui lòng thử lại sau.';
    }
    const textParts = ['Bản tin tóm tắt tin tức hôm nay. '];
    allSections.forEach((section, sectionIndex) => {
      if (section.title) textParts.push(`Phần ${sectionIndex + 1}: ${section.title}. `);
      if (section.topics && Array.isArray(section.topics)) {
        section.topics.forEach((topic, topicIndex) => {
          if (topic.title && topic.title.trim()) textParts.push(`Chủ đề ${topic.title}. `);
          if (topic.articles && Array.isArray(topic.articles)) {
            topic.articles.forEach((article) => {
              if (article.summary && article.summary.trim().length > 0) {
                textParts.push(`${article.summary.trim()}. `);
              } else if (article.title && article.title.trim().length > 0) {
                textParts.push(`${article.title.trim()}. `);
              }
            });
          }
          if (topicIndex < section.topics.length - 1) textParts.push('Chuyển sang chủ đề tiếp theo. ');
        });
      }
      if (sectionIndex < allSections.length - 1) textParts.push('Chuyển sang phần tiếp theo. ');
    });
    textParts.push('Đó là toàn bộ nội dung tóm tắt tin tức hôm nay. Cảm ơn bạn đã theo dõi.');
    return textParts.join('');
  }, [allSections]);

  const handleAudioPress = useCallback(() => {
    try {
      const summaryText = generateFullText();
      if (summaryText && summaryText.trim().length > 0) {
        setCurrentText(summaryText);
        setShowReader(true);
      }
    } catch (error) {
      console.error('❌ Error in handleAudioPress:', error);
    }
  }, [generateFullText]);

  const loadInitialData = useCallback(async () => {
    if (loadingFlags.current.initial) return;
    loadingFlags.current.initial = true;
    setInitialLoading(true);
    currentArticlePage.current = 1;
    currentSectionPage.current = 1;
    setHasMoreArticles(true);
    setHasMoreSections(true);
    setAllSections([]);
    setArticles([]);
    try {
      await Promise.allSettled([
        loadCategories(),
        loadArticles(1, false),
        loadSections(1, false),
      ]);
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
    } finally {
      setInitialLoading(false);
      loadingFlags.current.initial = false;
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadingFlags.current = {
      categories: false,
      articles: false,
      sections: false,
      initial: false,
    };
    try {
      await loadInitialData();
    } finally {
      setRefreshing(false);
    }
  }, [loadInitialData]);

  useEffect(() => {
    loadInitialData();
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  const memoizedArticleGroups = useMemo(() => {
    return Array.from({ length: Math.ceil(articles.length / 4) }).map((_, groupIndex) => {
      const startIndex = groupIndex * 4;
      const endIndex = Math.min(startIndex + 4, articles.length);
      const groupArticles = articles.slice(startIndex, endIndex);
      const correspondingSection = allSections[groupIndex];
      return { groupIndex, groupArticles, correspondingSection };
    });
  }, [articles, allSections]);

  const renderArticleItem = useCallback(({ item }) => (
    <MemoizedArticleCard item={item} onPress={handleArticlePress} />
  ), [handleArticlePress]);

  const renderCategoryItem = useCallback(({ item }) => (
    <MemoizedCategoryItem 
      item={item} 
      isSelected={selectedCategory === item}
      onPress={handleCategorySelect}
    />
  ), [selectedCategory, handleCategorySelect]);

  const handleMomentumScrollEnd = useCallback((event) => {
    if (!event.nativeEvent || !event.nativeEvent.layoutMeasurement) return;
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 200;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      if (!loadingMore && (hasMoreArticles || hasMoreSections)) {
        setLoadingMore(true);
        const promises = [];
        if (hasMoreArticles) promises.push(loadArticles(currentArticlePage.current + 1, true));
        if (hasMoreSections) promises.push(loadSections(currentSectionPage.current + 1, true));
        Promise.all(promises).finally(() => setLoadingMore(false));
      }
    }
  }, [loadingMore, hasMoreArticles, hasMoreSections, loadArticles, loadSections]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" translucent={true} />
      
      {/* Header wrapped in its own SafeAreaView */}
      <SafeAreaView style={[styles.headerContainer, { paddingTop: insets.top }]} edges={['top']}>
        <View style={styles.header}>
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Image
                source={require('../assets/logo.jpg')}
                style={styles.headerImage}
              />
              <View style={{ marginLeft: scale(6) }} className="flex flex-col h-fit leading-none">
                <Text style={styles.headerTitle} className="font-sf-bold text-gray-900">Viện Kiểm Sát AI</Text>
                <Text style={styles.headerSubtitle} className="font-sf-medium text-gray-900">{formattedDate}</Text>
              </View>
            </View>
            <TouchableOpacity
              className="p-3 rounded-full bg-gray-200"
              onPress={handleSearchPress}
            >
              <Search size={moderateScale(19)} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Scroll content */}
      <ScrollView
        className="px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + verticalScale(20),
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000"
            colors={['#000']}
            progressBackgroundColor="#f3f3f3"
          />
        }
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
      >
        {/* Categories */}
        {categories.length > 1 && (
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            className="my-4"
            contentContainerStyle={{ paddingRight: scale(16) }}
            renderItem={renderCategoryItem}
            keyExtractor={(item, index) => `category-${index}-${item}`}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            windowSize={5}
          />
        )}

        {/* Initial loading */}
        {initialLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.summaryTime} className="font-sf-medium text-gray-600 mt-2">
              Đang tải dữ liệu...
            </Text>
          </View>
        ) : (
          <>
            {/* Articles Section */}
            {articles.length > 0 && (
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text style={styles.sectionTitle} className="font-sf-bold text-gray-900">
                    Mới nhất
                  </Text>
                  <TouchableOpacity>
                    <Text style={styles.viewAllText} className="font-sf-medium text-gray-900 pl-2">Xem tất cả</Text>
                  </TouchableOpacity>
                </View>

                {/* Render memoized article groups */}
                {memoizedArticleGroups.map(({ groupIndex, groupArticles, correspondingSection }) => (
                  <View key={`group-${groupIndex}`}>
                    <FlatList
                      data={groupArticles}
                      keyExtractor={(item) => item._id || item.id}
                      numColumns={2}
                      scrollEnabled={false}
                      columnWrapperStyle={{ justifyContent: 'space-between' }}
                      contentContainerStyle={{ gap: verticalScale(8), marginBottom: verticalScale(16) }}
                      renderItem={renderArticleItem}
                      removeClippedSubviews={true}
                      maxToRenderPerBatch={4}
                    />
                    {correspondingSection && (
                      <View className="bg-gray-200 p-4 rounded-2xl mb-5">
                        <View className="flex-row items-center mb-4">
                          <View className="rounded-full overflow-hidden mr-1.5">
                            <LinearGradient
                              colors={['#004b8d', '#00c6ff']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              className="px-2.5 py-0.5"
                            >
                              <View className="flex-row items-center justify-center gap-1.5">
                                <Clock size={moderateScale(16)} color="#fff" strokeWidth={2} />
                                <Text style={styles.summaryTime} className="font-sf-medium text-white">
                                  {formatTimeAgo(correspondingSection.createdAt)}
                                </Text>
                              </View>
                            </LinearGradient>
                          </View>
                          <Text style={styles.summaryTitle} className="font-sf-bold text-black ml-2">
                            Tóm tắt
                          </Text>
                            {/* <View className="ml-auto">
                              <TouchableOpacity
                                onPress={handleAudioPress}
                                className="bg-black rounded-full p-2"
                                disabled={allSections.length === 0}
                              >
                                <AudioLines size={moderateScale(20)} color="#ffffff" strokeWidth={2} />
                              </TouchableOpacity>
                            </View> */}
                        </View>
                        {correspondingSection.topics && correspondingSection.topics.length > 0 ? (
                          correspondingSection.topics.map((topic, topicIndex) => (
                            <View key={topic._id || topicIndex}>
                              <View className="flex-row items-stretch mb-5">
                                <View style={styles.gradientLine}>
                                  <LinearGradient
                                    colors={['#3b82f6', '#9333ea', '#f43f5e']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={{ flex: 1 }}
                                  />
                                </View>
                                <Text style={styles.sectionSubtitle} className="font-sf-bold text-black flex-1">
                                  {topic.title}
                                </Text>
                              </View>
                              {topic.articles && topic.articles.length > 0 && topic.articles.map((article, articleIndex) => (
                                <MemoizedNewsItem
                                  key={article._id || articleIndex}
                                  article={article}
                                  showDivider={articleIndex < topic.articles.length - 1}
                                  onPress={handleArticlePress}
                                />
                              ))}
                              {topicIndex < correspondingSection.topics.length - 1 && (
                                <View style={styles.sectionDivider} />
                              )}
                            </View>
                          ))
                        ) : (
                          <View className="py-4 items-center">
                            <Text style={styles.summaryTime} className="font-sf-medium text-gray-600">
                              Chưa có dữ liệu tóm tắt
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
            {loadingMore && (
              <View className="py-4 items-center">
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.summaryTime} className="font-sf-medium text-gray-600 mt-2">
                  Đang tải thêm nội dung...
                </Text>
              </View>
            )}
            {!hasMoreArticles && !hasMoreSections && articles.length > 0 && (
              <View className="py-4 items-center">
                <Text style={styles.summaryTime} className="font-sf-medium text-gray-600">
                  Đã hiển thị tất cả nội dung
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Text Reader */}
      {showReader && (
        <View
          className="absolute left-0 right-0 bottom-0 z-50"
          style={{ paddingBottom: insets.bottom }}
          pointerEvents="box-none"
        >
          <TextReader
            content={currentText}
            onClose={() => setShowReader(false)}
          />
        </View>
      )}

      {/* Bottom Navigation (Placeholder) */}
      <View
        style={[styles.bottomNav, { paddingBottom: insets.bottom }]}
      >
        <Text style={styles.bottomNavText}>Bottom Navigation Placeholder</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerContainer: {
    backgroundColor: '#f9fafb',
    zIndex: 10,
  },
  header: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
  },
  headerImage: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
  },
  headerTitle: {
    fontSize: moderateScale(14),
    lineHeight: scale(22),
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    lineHeight: scale(16),
  },
  categoryText: {
    fontSize: moderateScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(23),
  },
  viewAllText: {
    fontSize: moderateScale(12),
    paddingLeft: scale(8),
  },
  articleImage: {
    width: '100%',
    height: verticalScale(90),
    borderRadius: scale(8),
    marginBottom: verticalScale(4),
    shadowColor: 'rgba(27, 31, 35, 0.15)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 1,
    backgroundColor: '#fff',
    marginBottom: scale(8),
  },
  articleTitle: {
    fontSize: moderateScale(14),
    lineHeight: scale(16),
    marginBottom: scale(5),
  },
  sourceText: {
    fontSize: moderateScale(10),
  },
  timeText: {
    fontSize: moderateScale(10),
  },
  summaryTime: {
    fontSize: moderateScale(11),
  },
  summaryTitle: {
    fontSize: moderateScale(19),
  },
  gradientLine: {
    width: scale(5),
    borderRadius: scale(2),
    overflow: 'hidden',
    marginRight: scale(10),
    marginTop: verticalScale(0),
    marginBottom: verticalScale(0),
  },
  sectionSubtitle: {
    fontSize: moderateScale(19),
    flex: 1,
  },
  newsText: {
    fontSize: moderateScale(15),
  },
  summaryPreview: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
  },
  moreText: {
    fontSize: moderateScale(11),
    fontStyle: 'italic',
  },
  newsImage: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(8),
  },
  divider: {
    marginTop: verticalScale(12),
    height: verticalScale(1),
    backgroundColor: '#fff',
    width: '100%',
  },
  sectionDivider: {
    height: verticalScale(3),
    borderRadius: scale(1.5),
    backgroundColor: '#fff',
    width: '100%',
    marginVertical: verticalScale(20),
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingVertical: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  bottomNavText: {
    fontSize: moderateScale(14),
    color: '#000',
  },
});