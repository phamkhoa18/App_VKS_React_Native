import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Search, AudioLines, Clock, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TextReader from '../components/TextReader';
import { sectionsAPI, CategoriesAPI, articlesAPI } from '../services/apiService';
import { useWindowDimensions } from 'react-native';

export const FONT_CONFIG = {
  black: 'SFPro-Black',
  bold: 'SFPro-Bold',
  regular: 'SFPro-Regular',
  medium: 'SFPro-Medium',
  light: 'SFPro-Light',
};

// Memoized components
const MemoizedNewsItem = React.memo(({ article, showDivider = true, onPress, numColumns }) => (
  <TouchableOpacity 
    style={{ marginBottom: 12 }}
    onPress={() => onPress(article)}
  >
    <View style={{ flexDirection: 'row' }}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={[{
            fontSize: numColumns === 3 ? 18 : 15,
            lineHeight: 20,
            color: '#1F2937'
          }, { fontFamily: FONT_CONFIG.medium }]}
        >
          {article.title}
        </Text>
        {numColumns === 3 && (
          <Text
            numberOfLines={4}
            ellipsizeMode="tail"
            style={[{
              fontSize: 14,
              color: '#6B7280',
              marginTop: 4
            }, { fontFamily: FONT_CONFIG.regular }]}
          >
            {article.description}
          </Text>
        )}
      </View>
      <Image
        source={article.image ? { uri: article.image } : require('../assets/logo_ai.jpg')}
        style={{
          width: numColumns === 3 ? 120 : 80,
          height: numColumns === 3 ? 120 : 80,
          borderRadius: 8
        }}
        defaultSource={require('../assets/logo_ai.jpg')}
      />
    </View>
    {showDivider && (
      <View style={{
        marginTop: 12,
        height: 1,
        backgroundColor: '#E5E7EB',
        width: '100%'
      }} />
    )}
  </TouchableOpacity>
));

const MemoizedArticleCard = React.memo(({ item, onPress }) => (
  <TouchableOpacity
    style={{
      width: numColumns === 3 ? '31%' : '48%',
      borderRadius: 8,
      flexDirection: 'column',
      justifyContent: 'space-between',
      marginBottom: numColumns === 3 ? 16 : 8
    }}
    onPress={() => onPress(item)}
  >
    <View>
      <Image
        source={item.image ? { uri: item.image } : require('../assets/news.jpg')}
        style={{
          width: '100%',
          height: numColumns === 3 ? 150 : 90,
          borderRadius: 8,
          marginBottom: 8,
          backgroundColor: '#FFFFFF'
        }}
        resizeMode="cover"
        defaultSource={require('../assets/logo_ai.jpg')}
      />
      <Text
        numberOfLines={3}
        style={[{
          fontSize: numColumns === 3 ? 15 : 14,
          lineHeight: numColumns === 3 ? 20 : 18,
          color: '#111827',
          marginBottom: numColumns === 3 ? 6 : 4
        }, { fontFamily: FONT_CONFIG.bold }]}
      >
        {item.title}
      </Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text style={[{
        fontSize: numColumns === 3 ? 14 : 10,
        color: '#9CA3AF'
      }, { fontFamily: FONT_CONFIG.medium }]}>
        {item.author}
      </Text>
      <Text style={[{
        fontSize: numColumns === 3 ? 14 : 10,
        color: '#9CA3AF'
      }, { fontFamily: FONT_CONFIG.medium }]}>
        • {item.time}
      </Text>
    </View>
  </TouchableOpacity>
));

const MemoizedCategoryItem = React.memo(({ item, isSelected, onPress }) => (
  <TouchableOpacity
    style={{
      marginRight: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: isSelected ? '#000000' : '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center'
    }}
    onPress={() => onPress(item)}
  >
    <Text
      style={[{
        fontSize: numColumns === 3 ? 16 : 12,
        fontWeight: '500',
        color: isSelected ? '#FFFFFF' : '#000000'
      }, { fontFamily: FONT_CONFIG.medium }]}
    >
      {item}
    </Text>
  </TouchableOpacity>
));

let numColumns;

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
  const { width } = useWindowDimensions();

  // Breakpoint 768px for tablet
  numColumns = width >= 768 ? 3 : 2;
  const articlesPerGroup = width >= 768 ? 6 : 4; // 6 items for tablet, 4 for mobile

  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
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
      const params = { page, limit: articlesPerGroup * 2, sort: '-createdAt' };
      const result = await articlesAPI.getAll(params);
      if (result.success && result.data && Array.isArray(result.data)) {
        const articlesData = result.data.map(article => ({
          id: article._id,
          _id: article._id,
          title: article.title,
          summary: article.summary,
          description: article.description || article.summary,
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
  }, [formatTimeAgo, articlesPerGroup]);

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
    
    if (category === 'All') {
      setSelectedCategory(category);
      return;
    }
    
    console.log('🔍 Navigate directly to search results for category:', category);
    navigation.navigate('SearchResult', {
      query: category,
      type: 'category',
      category: category,
      filter: 'category'
    });
  }, [selectedCategory, navigation]);

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
  }, [loadCategories, loadArticles, loadSections]);

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
  }, [loadInitialData]);

  const memoizedArticleGroups = useMemo(() => {
    return Array.from({ length: Math.ceil(articles.length / articlesPerGroup) }).map((_, groupIndex) => {
      const startIndex = groupIndex * articlesPerGroup;
      const endIndex = Math.min(startIndex + articlesPerGroup, articles.length);
      const groupArticles = articles.slice(startIndex, endIndex);
      const correspondingSection = allSections[groupIndex];
      return { groupIndex, groupArticles, correspondingSection };
    });
  }, [articles, allSections, articlesPerGroup]);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" translucent={true} />
      
      <SafeAreaView style={{ backgroundColor: '#F9FAFB', zIndex: 10, paddingTop: insets.top }} edges={['top']}>
        <View style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../assets/icon_vks.png')}
                style={{
                  width: numColumns === 3 ? 56 : 48,
                  height: numColumns === 3 ? 56 : 48,
                  borderRadius: 9999
                }}
              />
              <View style={{ marginLeft: 16 }}>
                <Text style={[{
                  fontSize: numColumns === 3 ? 20 : 16,
                  fontWeight: 'bold',
                  color: '#111827'
                }, { fontFamily: FONT_CONFIG.bold }]}>
                  VKS News
                </Text>
                <Text style={[{
                  fontSize: numColumns === 3 ? 16 : 12,
                  fontWeight: '500',
                  color: '#111827'
                }, { fontFamily: FONT_CONFIG.medium }]}>
                  {formattedDate}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={{
                padding: 12,
                borderRadius: 9999,
                backgroundColor: '#E5E7EB'
              }}
              onPress={handleSearchPress}
            >
              <Search size={numColumns === 3 ? 20 : 16} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ paddingHorizontal: 12 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000"
            colors={['#000000']}
            progressBackgroundColor="#F3F4F6"
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
        {categories.length > 1 && (
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginVertical: 16 }}
            contentContainerStyle={{ paddingRight: 16 }}
            renderItem={renderCategoryItem}
            keyExtractor={(item, index) => `category-${index}-${item}`}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            windowSize={5}
          />
        )}

        {initialLoading ? (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={[{
              fontSize: numColumns === 3 ? 14 : 12,
              color: '#4B5563',
              marginTop: 8,
              fontWeight: '500'
            }, { fontFamily: FONT_CONFIG.medium }]}>
              Đang tải dữ liệu...
            </Text>
          </View>
        ) : (
          <>
            {articles.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: numColumns === 3 ? 24 : 16 }}>
                  <Text style={[{
                    fontSize: numColumns === 3 ? 28 : 20,
                    fontWeight: 'bold',
                    color: '#111827'
                  }, { fontFamily: FONT_CONFIG.bold }]}>
                    Mới nhất
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Categories', { screen: 'CategoryMain' })}>
                    <Text style={[{
                      fontSize: numColumns === 3 ? 16 : 12,
                      fontWeight: '500',
                      color: '#111827',
                      paddingLeft: 8
                    }, { fontFamily: FONT_CONFIG.medium }]}>
                      Xem tất cả
                    </Text>
                  </TouchableOpacity>
                </View>

                {memoizedArticleGroups.map(({ groupIndex, groupArticles, correspondingSection }) => (
                  <View key={`group-${groupIndex}`}>
                    <FlatList
                      data={groupArticles}
                      keyExtractor={(item) => item._id || item.id}
                      numColumns={numColumns}
                      scrollEnabled={false}
                      columnWrapperStyle={{ justifyContent: 'space-between', flexWrap: 'wrap' }}
                      contentContainerStyle={{ gap: 8, marginBottom: 16 }}
                      renderItem={renderArticleItem}
                      removeClippedSubviews
                      maxToRenderPerBatch={articlesPerGroup}
                    />
                    {correspondingSection && (
                      <View style={{ backgroundColor: '#E5E7EB', padding: 16, borderRadius: 16, marginBottom: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                          <View style={{ borderRadius: 9999, overflow: 'hidden', marginRight: 6 }}>
                            <LinearGradient
                              colors={['#004B8D', '#00C6FF']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={{ paddingHorizontal: 8, paddingVertical: 6 }}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <Clock size={numColumns === 3 ? 18 : 16} color="#FFFFFF" />
                                <Text style={[{
                                  fontSize: numColumns === 3 ? 14 : 12,
                                  color: '#FFFFFF',
                                  fontWeight: '500'
                                }, { fontFamily: FONT_CONFIG.medium }]}>
                                  {formatTimeAgo(correspondingSection.createdAt)}
                                </Text>
                              </View>
                            </LinearGradient>
                          </View>
                          <Text style={[{
                            fontSize: numColumns === 3 ? 24 : 20,
                            fontWeight: 'bold',
                            color: '#000000',
                            marginLeft: 8
                          }, { fontFamily: FONT_CONFIG.bold }]}>
                            Tóm tắt
                          </Text>
                        </View>
                        {correspondingSection.topics && correspondingSection.topics.length > 0 ? (
                          correspondingSection.topics.map((topic, topicIndex) => (
                            <View key={topic._id || topicIndex}>
                              <View style={{ flexDirection: 'row', alignItems: 'stretch', marginBottom: 20 }}>
                                <View style={{ width: 5, borderRadius: 2, overflow: 'hidden', marginRight: 10, marginVertical: 0 }}>
                                  <LinearGradient
                                    colors={['#3B82F6', '#9333EA', '#F43F5E']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={{ flex: 1 }}
                                  />
                                </View>
                                <Text style={[{
                                  fontSize: numColumns === 3 ? 28 : 20,
                                  fontWeight: 'bold',
                                  color: '#000000',
                                  flex: 1
                                }, { fontFamily: FONT_CONFIG.bold }]}>
                                  {topic.title}
                                </Text>
                              </View>
                              {topic.articles && topic.articles.length > 0 && topic.articles.map((article, articleIndex) => (
                                <MemoizedNewsItem
                                  key={article._id || articleIndex}
                                  article={article}
                                  showDivider={articleIndex < topic.articles.length - 1}
                                  onPress={handleArticlePress}
                                  numColumns={numColumns}
                                />
                              ))}
                              {topicIndex < correspondingSection.topics.length - 1 && (
                                <View style={{ height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF', width: '100%', marginVertical: 20 }} />
                              )}
                            </View>
                          ))
                        ) : (
                          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                            <Text style={[{
                              fontSize: numColumns === 3 ? 14 : 12,
                              color: '#4B5563',
                              fontWeight: '500'
                            }, { fontFamily: FONT_CONFIG.medium }]}>
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
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#000000" />
                <Text style={[{
                  fontSize: numColumns === 3 ? 14 : 12,
                  color: '#4B5563',
                  marginTop: 8,
                  fontWeight: '500'
                }, { fontFamily: FONT_CONFIG.medium }]}>
                  Đang tải thêm nội dung...
                </Text>
              </View>
            )}
            {!hasMoreArticles && !hasMoreSections && articles.length > 0 && (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <Text style={[{
                  fontSize: numColumns === 3 ? 14 : 12,
                  color: '#4B5563',
                  fontWeight: '500'
                }, { fontFamily: FONT_CONFIG.medium }]}>
                  Đã hiển thị tất cả nội dung
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {showReader && (
        <View
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50, paddingBottom: insets.bottom }}
          pointerEvents="box-none"
        >
          <TextReader
            content={currentText}
            onClose={() => setShowReader(false)}
          />
        </View>
      )}

      <View
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', zIndex: 100, paddingBottom: insets.bottom }}
      >
        <Text style={[{
          fontSize: numColumns === 3 ? 16 : 12,
          color: '#000000'
        }, { fontFamily: FONT_CONFIG.regular }]}>
          Bottom Navigation Placeholder
        </Text>
      </View>
    </SafeAreaView>
  );
}