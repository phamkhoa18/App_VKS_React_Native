import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  SafeAreaView,
  Animated,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Easing,
  Platform,
  Linking
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import {
  ChevronLeft,
  Heart,
  Bookmark,
  EllipsisVertical,
  Share,
  Clock,
  AudioLines,
  Newspaper,
  Tag,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Dot,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useHideTabBar } from '../hooks/useHideTabBar';
import { LinearGradient } from 'expo-linear-gradient';
import { scaleSize, scaleFont, spacing } from '../utils/responsive';
import { articlesAPI } from '../services/apiService';
import TextReader from '../components/TextReader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSavedArticles } from '../hooks/useSavedArticles';
import { useUser } from "../context/UserContext";
// ✅ FONT CONFIGURATION - SỬ DỤNG FONTS ĐÃ LOAD TRONG APP.JS
const FONT_CONFIG = {
  black: 'SFPro-Black',
  bold: 'SFPro-Bold',
  regular: 'SFPro-Regular',
  medium: 'SFPro-Medium',
  light: 'SFPro-Light',
};

// ✅ SMOOTH CONTENT TRANSITION COMPONENT
const SmoothTransition = ({ children, isVisible, delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
    }
  }, [isVisible, delay]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
};

// ✅ SHIMMER SKELETON COMPONENT
const ShimmerSkeleton = ({ width = '100%', height = 20, borderRadius = 4, style = {} }) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };
    animate();
  }, [shimmerAnimation]);

  const translateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.7)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

// ✅ LOADING SKELETON
const LoadingSkeleton = () => (
  <View className="h-full w-full relative bg-gray-50">
    <View style={[styles.topNav, { zIndex: 1000, elevation: 1000 }]}>
      <View className="flex-row justify-between items-center">
        <ShimmerSkeleton width={40} height={40} borderRadius={20} />
        <ShimmerSkeleton width={40} height={40} borderRadius={20} />
      </View>
    </View>

    <ScrollView showsVerticalScrollIndicator={false}>
      <ShimmerSkeleton width="100%" height={spacing(230)} borderRadius={0} />
      
      <View style={styles.articleBody}>
        <View style={{ marginBottom: 16 }}>
          <ShimmerSkeleton width="95%" height={22} borderRadius={6} style={{ marginBottom: 8 }} />
          <ShimmerSkeleton width="80%" height={22} borderRadius={6} />
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-3">
            <ShimmerSkeleton width="60%" height={14} borderRadius={4} />
            <ShimmerSkeleton width="50%" height={14} borderRadius={4} />
          </View>
          <ShimmerSkeleton width="20%" height={14} borderRadius={4} />
        </View>

        <View style={styles.summaryGradient}>
          <View style={{ backgroundColor: '#f3f4f6', borderRadius: scaleSize(12), padding: 16 }}>
            <ShimmerSkeleton width={120} height={18} borderRadius={6} style={{ marginBottom: 12 }} />
            <ShimmerSkeleton width="100%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
            <ShimmerSkeleton width="90%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
            <ShimmerSkeleton width="70%" height={16} borderRadius={4} />
          </View>
        </View>

        <View style={{ marginBottom: spacing(24) }}>
          {[...Array(6)].map((_, i) => (
            <ShimmerSkeleton
              key={i}
              width={`${85 + Math.random() * 15}%`}
              height={16}
              borderRadius={4}
              style={{ marginBottom: 10 }}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  </View>
);

// ✅ MEMOIZED IMAGE COMPONENT - FIX CHO VIỆC RELOAD HÌNH ẢNH
const MemoizedHtmlImage = React.memo(({ src, alt, title, contentWidth }) => {
  const [imageSize, setImageSize] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // ✅ SỬ DỤNG useCallback ĐỂ TRÁNH RE-RENDER
  const handleImageSize = useCallback((width, height) => {
    const aspectRatio = height / width;
    const calculatedHeight = contentWidth * aspectRatio;
    
    setImageSize({
      width: contentWidth,
      height: calculatedHeight,
    });
    setIsLoading(false);
  }, [contentWidth]);

  const handleImageError = useCallback((error) => {
    console.warn('Failed to get image size:', error);
    setImageSize({
      width: contentWidth,
      height: 200,
    });
    setIsLoading(false);
    setHasError(true);
  }, [contentWidth]);

  // ✅ CHỈ LOAD IMAGE SIZE 1 LẦN DUY NHẤT
  useEffect(() => {
    if (src && !imageSize && !hasError) {
      Image.getSize(src, handleImageSize, handleImageError);
    }
  }, [src, imageSize, hasError, handleImageSize, handleImageError]);

  if (isLoading || !imageSize) {
    return (
      <View style={{
        marginVertical: 8,
        alignItems: 'center',
        width: '100%',
      }}>
        <View style={{
          width: contentWidth,
          height: 200,
          backgroundColor: '#F3F4F6',
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <ActivityIndicator size="small" color="#9CA3AF" />
        </View>
      </View>
    );
  }

  return (
    <View style={{
      marginVertical: 8,
      alignItems: 'center',
      width: '100%',
    }}>
      <Image
        source={{ uri: src }}
        style={{
          width: imageSize.width,
          height: imageSize.height,
          borderRadius: 8,
        }}
        resizeMode="cover"
        onError={(error) => {
          console.warn('Image load error:', error);
        }}
      />
      {(alt || title) && (
        <Text style={{
          fontSize: 14,
          fontStyle: 'italic',
          color: '#6B7280',
          marginTop: 4,
          textAlign: 'center',
          fontFamily: FONT_CONFIG.regular,
          paddingHorizontal: 8,
        }}>
          {alt || title}
        </Text>
      )}
    </View>
  );
});

// ✅ HTML CONTENT RENDERER COMPONENT - ĐƯỢC MEMOIZED ĐỂ TRÁNH RE-RENDER
const HtmlContentRenderer = React.memo(({ htmlContent }) => {
  const { width } = useWindowDimensions();
  const contentWidth = width - 80;

  // ✅ MEMOIZE CUSTOM RENDERERS ĐỂ TRÁNH TẠO LẠI OBJECT
  const renderers = useMemo(() => ({
    img: ({ tnode }) => {
      const { src, alt, title } = tnode.attributes || {};
      
      if (!src) return null;

      return (
        <MemoizedHtmlImage
          src={src}
          alt={alt}
          title={title}
          contentWidth={contentWidth}
        />
      );
    },

    figure: ({ TDefaultRenderer, ...props }) => (
      <View style={{
        marginVertical: 12,
        alignItems: 'center',
        width: '100%',
      }}>
        <TDefaultRenderer {...props} />
      </View>
    ),

    figcaption: ({ TDefaultRenderer, ...props }) => (
      <Text style={{
        fontSize: 14,
        fontStyle: 'italic',
        color: '#6B7280',
        marginTop: 4,
        textAlign: 'center',
        fontFamily: FONT_CONFIG.regular,
        paddingHorizontal: spacing(8),
      }}>
        <TDefaultRenderer {...props} />
      </Text>
    ),
  }), [contentWidth]);

  // ✅ MEMOIZE HTML STYLES VỚI SF PRO FONTS ĐÃ LOAD
  const htmlStyles = useMemo(() => ({
    body: {
      fontFamily: FONT_CONFIG.regular,
      fontSize: 16,
      lineHeight: 26,
      color: '#1F2937',
      padding: 0,
      margin: 0,
      textAlign: 'justify',
    },
    p: {
      fontFamily: FONT_CONFIG.regular,
      fontSize: 16,
      lineHeight: 26,
      color: '#1F2937',
      marginVertical: 6,
      textAlign: 'justify',
    },
    h1: {
      fontFamily: FONT_CONFIG.bold,
      fontSize: 26,
      color: '#111827',
      marginVertical: 12,
      lineHeight: 32,
    },
    h2: {
      fontFamily: FONT_CONFIG.bold,
      fontSize: 22,
      color: '#111827',
      marginVertical: 10,
      lineHeight: 28,
    },
    h3: {
      fontFamily: FONT_CONFIG.bold,
      fontSize: 20,
      color: '#111827',
      marginVertical: 8,
      lineHeight: 26,
    },
    h4: {
      fontFamily: FONT_CONFIG.medium,
      fontSize: 18,
      color: '#111827',
      marginVertical: 6,
      lineHeight: 24,
    },
    h5: {
      fontFamily: FONT_CONFIG.medium,
      fontSize: 16,
      color: '#111827',
      marginVertical: 4,
      lineHeight: 22,
    },
    h6: {
      fontFamily: FONT_CONFIG.medium,
      fontSize: 14,
      color: '#111827',
      marginVertical: 4,
      lineHeight: 20,
    },
    blockquote: {
      fontFamily: FONT_CONFIG.regular,
      borderLeftWidth: 4,
      borderLeftColor: '#3B82F6',
      paddingLeft: 16,
      backgroundColor: '#F8FAFC',
      padding: 16,
      borderRadius: 8,
      marginVertical: 12,
      fontStyle: 'italic',
      fontSize: 16,
      lineHeight: 24,
      color: '#374151',
    },
    strong: {
      fontFamily: FONT_CONFIG.medium,
      fontWeight: 600,
      color: '#111827',
    },
    b: {
      fontFamily: FONT_CONFIG.bold,
      color: '#111827',
    },
    em: {
      fontFamily: FONT_CONFIG.regular,
      fontStyle: 'italic',
    },
    i: {
      fontFamily: FONT_CONFIG.regular,
      fontStyle: 'italic',
    },
    a: {
      fontFamily: FONT_CONFIG.medium,
      color: '#3B82F6',
      textDecorationLine: 'underline',
    },
    ul: {
      fontFamily: FONT_CONFIG.regular,
      marginVertical: 8,
      paddingLeft: 20,
    },
    ol: {
      fontFamily: FONT_CONFIG.regular,
      marginVertical: 8,
      paddingLeft: 20,
    },
    li: {
      fontFamily: FONT_CONFIG.regular,
      fontSize: 16,
      lineHeight: 24,
      color: '#1F2937',
      marginVertical: spacing(2),
    },
    table: {
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 8,
      marginVertical: 12,
      width: '100%',
    },
    th: {
      fontFamily: FONT_CONFIG.medium,
      backgroundColor: '#F9FAFB',
      padding: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      fontSize: 14,
    },
    td: {
      fontFamily: FONT_CONFIG.regular,
      padding: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      fontSize: 14,
    },
    pre: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      backgroundColor: '#F3F4F6',
      padding: 12,
      borderRadius: scaleSize(6),
      fontSize: 14,
      lineHeight: 18,
      marginVertical: 8,
    },
    code: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 4,
      paddingVertical: spacing(2),
      borderRadius: 4,
      fontSize: 14,
    },
    div: {
      fontFamily: FONT_CONFIG.regular,
    },
    span: {
      fontFamily: FONT_CONFIG.regular,
    },
  }), []);

  // ✅ MEMOIZE SYSTEM FONTS ARRAY VỚI SF PRO FONTS ĐÃ LOAD
  const systemFonts = useMemo(() => [
    'SFPro-Regular',
    'SFPro-Medium', 
    'SFPro-Bold',
    'SFPro-Light',
    'SFPro-Black',
    'System' // fallback
  ], []);

  // ✅ MEMOIZE DEFAULT TEXT PROPS VỚI SF PRO
  const defaultTextProps = useMemo(() => ({
    style: {
      fontFamily: FONT_CONFIG.regular,
      fontSize: 16,
      lineHeight: 26,
      color: '#1F2937',
      textAlign: 'justify',
    },
    allowFontScaling: false,
  }), []);

  // ✅ MEMOIZE RENDERERS PROPS
  const renderersProps = useMemo(() => ({
    img: {
      enableExperimentalPercentWidth: true,
    },
  }), []);

  // ✅ MEMOIZE HTML SOURCE
  const htmlSource = useMemo(() => ({ html: htmlContent }), [htmlContent]);

  return (
    <View style={styles.htmlContentContainer}>
      <RenderHtml
        contentWidth={contentWidth}
        source={htmlSource}
        renderers={renderers}
        tagsStyles={htmlStyles}
        systemFonts={systemFonts}
        defaultTextProps={defaultTextProps}
        renderersProps={renderersProps}
        enableExperimentalMarginCollapsing={true}
        ignoredTags={['script', 'style']}
        baseStyle={{
          fontSize: 16,
          lineHeight: 26,
          fontFamily: FONT_CONFIG.regular,
          color: '#1F2937',
        }}
        enableExperimentalBRCollapsing={true}
        enableExperimentalGhostLinesPrevention={true}
        computeEmbeddedMaxWidth={(contentWidth) => contentWidth}
      />
    </View>
  );
});

export default function ArticleDetailScreen() {
  useHideTabBar();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { article: articleParam } = route.params;
  const articleId = articleParam?._id;

  // Thêm hook useSavedArticles
  const {
    isSaved,
    isToggling,
    toggleSaveWithAlert,
    saveIcon,
  } = useSavedArticles(articleId);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  

  // ✅ LOADING STATES - LOẠI BỎ FONT LOADING
  const [loadingStates, setLoadingStates] = useState({
    article: true,
    htmlReady: false,
  });

  // Data states
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [error, setError] = useState(null);

  // UI states
  const [isExpanded, setIsExpanded] = useState(true);
  const [lastOffsetY, setLastOffsetY] = useState(0);
  const [showBar, setShowBar] = useState(true);
  const [showReader, setShowReader] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [isReaderActive, setIsReaderActive] = useState(false);

  // Animation refs
  const translateY = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // ✅ COMPUTED STATES - LOẠI BỎ FONT LOADING
  const isContentReady = !loadingStates.article && article;
  const shouldShowHtmlContent = isContentReady && article?.htmlcontent;

  // ✅ VALIDATE ARTICLE ID
  useEffect(() => {
    if (!articleId) {
      console.error('❌ No article ID provided');
      setError('Không tìm thấy ID bài viết');
      return;
    }
  }, [articleId]);

  // ✅ ARTICLE DATA LOADING
  useEffect(() => {
    if (articleId) {
      fetchArticleDetail();
    }
  }, [articleId]);

  // ✅ HTML READY STATE MANAGEMENT
  useEffect(() => {
    if (shouldShowHtmlContent) {
      const timer = setTimeout(() => {
        setLoadingStates(prev => ({ ...prev, htmlReady: true }));
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [shouldShowHtmlContent]);

  // ✅ SMOOTH CONTENT REVEAL
  useEffect(() => {
    if (isContentReady) {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      contentOpacity.setValue(0);
    }
  }, [isContentReady]);

  const fetchArticleDetail = async () => {
    try {
      setError(null);
      setLoadingStates(prev => ({ ...prev, article: true }));
      
      const [articleResponse, relatedResponse] = await Promise.allSettled([
        articlesAPI.getById(articleId),
        articlesAPI.getRelated(articleId, 4)
      ]);

      if (articleResponse.status === 'fulfilled' && articleResponse.value.success) {
        setArticle(articleResponse.value.data);
        setLoadingStates(prev => ({ ...prev, article: false }));
      } else {
        throw new Error(articleResponse.value?.message || 'Failed to load article');
      }

      if (relatedResponse.status === 'fulfilled' && relatedResponse.value.success) {
        setRelatedArticles(relatedResponse.value.data || []);
      }

    } catch (error) {
      console.error('❌ Error fetching article:', error);
      setError(error.message || 'Không thể tải bài viết');
      setLoadingStates(prev => ({ ...prev, article: false }));
      
      Alert.alert(
        'Lỗi tải bài viết',
        error.message || 'Không thể tải nội dung bài viết',
        [
          { text: 'Thử lại', onPress: fetchArticleDetail },
          { text: 'Quay lại', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  // ✅ HELPER FUNCTIONS
  const formatTime = useCallback((dateString) => {
    if (!dateString) return 'Không rõ thời gian';
    
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
      return 'Không rõ thời gian';
    }
  }, []);

  const handleRelatedArticlePress = useCallback((relatedArticle) => {
    navigation.push('ArticleDetail', {
      article: relatedArticle
    });
  }, [navigation]);

  const handleScroll = useCallback((e) => {
    if (isReaderActive) return;
    
    const offsetY = e.nativeEvent.contentOffset.y;

    if (offsetY > lastOffsetY + 15 && showBar) {
      setShowBar(false);
      Animated.timing(translateY, {
        toValue: spacing(100),
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (offsetY < lastOffsetY - 15 && !showBar) {
      setShowBar(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }

    setLastOffsetY(offsetY);
  }, [isReaderActive, lastOffsetY, showBar, translateY]);

  const getTextReaderPosition = useCallback(() => {
    if (!showReader) return {};
    
    return {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
    };
  }, [showReader]);

  const handleOpenTextReader = useCallback(() => {
    setCurrentText(article?.summary || article?.description || 'Không có nội dung để đọc');
    setIsReaderActive(true);
    setShowReader(true);
    
    setShowBar(false);
    Animated.timing(translateY, {
      toValue: spacing(100),
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [article, translateY]);

  const handleCloseTextReader = useCallback(() => {
    setShowReader(false);
    setIsReaderActive(false);
    
    setTimeout(() => {
      setShowBar(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 100);
  }, [translateY]);

  // ✅ RENDER LOADING STATE OR ERROR
  if (!articleId) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center px-6">
        <Text className="text-lg text-red-600 font-sf-bold mb-4">Lỗi tham số</Text>
        <Text className="text-gray-600 font-sf-medium text-center mb-6">Không tìm thấy ID bài viết</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-sf-medium">Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isContentReady || error) {
    if (error) {
      return (
        <View className="flex-1 bg-gray-50 justify-center items-center px-6">
          <Text className="text-lg text-red-600 font-sf-bold mb-4">Không thể tải bài viết</Text>
          <Text className="text-gray-600 font-sf-medium text-center mb-6">{error}</Text>
          <TouchableOpacity
            onPress={fetchArticleDetail}
            className="bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-sf-medium">Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return <LoadingSkeleton />;
  }

  // ✅ MAIN RENDER WITH RENDER HTML
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F9FAFB', // Đặt màu nền đồng nhất với bg-gray-50
        backgroundColor: 'transparent'
      }}
      edges={['left', 'right']} // Chỉ áp dụng safe area cho cạnh trái/phải
    >
      <View
        style={{
          flex: 1,
          backgroundColor: '#F9FAFB', // Đảm bảo màu nền đồng nhất
        }}
      >
        {/* ✅ TOP NAV - SỬ DỤNG SafeAreaView RIÊNG CHO NAVBAR */}
        <SafeAreaView
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            elevation: 1000,
            paddingTop: insets.top,
            backgroundColor: 'transparent',
          }}
          edges={['top']} // Chỉ áp dụng safe area cho cạnh trên
        >
          <View
            className='p-4'
          >
            <View style={styles.topNav}>
              <View className="flex-row justify-between items-center">
                <TouchableOpacity
                  className="bg-white/90 rounded-full p-2"
                  onPress={() => navigation.goBack()}
                  style={styles.navButton}
                >
                  <ChevronLeft size={18} color="#000" strokeWidth={1.5} />
                </TouchableOpacity>
                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    className="bg-white/90 rounded-full p-2"
                    style={styles.navButton}
                  >
                    <EllipsisVertical size={18} color="#000" strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>

        {/* ✅ CONTENT WITH OPACITY ANIMATION */}
        <Animated.View className="flex-1" style={{ opacity: contentOpacity }}>
          <ScrollView
            className="flex-1"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <SmoothTransition isVisible={isContentReady} delay={100}>
              <View className="relative w-full">
                {/* Dynamic Image */}
                {article?.image ? (
                  <Image
                    source={{ uri: article.image }}
                    className='w-full h-[250px] md:h-[400px]'
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={require('../assets/news.jpg')}
                    className='w-full h-[250px] md:h-[400px]'
                    resizeMode="cover"
                  />
                )}
                <View className="absolute inset-0 bg-black/50" style={{ zIndex: 1 }} />
                <View style={[styles.imageOverlay, { zIndex: 2 }]}>
                  <Text
                    className="font-sf-bold text-white leading-7 text-xl md:text-2xl"
                  >
                    {article?.title || 'Đang tải...'}
                  </Text>
                </View>
              </View>
            </SmoothTransition>

            {/* Article body */}
            <View style={styles.articleBody}>
              <SmoothTransition isVisible={isContentReady} delay={200}>
                {/* Dynamic Meta */}
                <View className="flex-row items-center justify-between mb-3 md-mb-4 flex-wrap">
                  <View className="flex-row items-center gap-3 flex-wrap">
                    <View className="flex-row items-center gap-1.5">
                      <Clock size={18} color="#9CA3AF" strokeWidth={2} />
                      <Text className="font-sf-medium text-gray-400 text-sm md:text-xl">
                        {formatTime(article?.publishDate || article?.createdAt)}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <Newspaper size={18} color="#9CA3AF" strokeWidth={2} />
                      <Text className="font-sf-bold text-gray-400 text-sm md:text-xl">
                        {article?.author || 'Không rõ nguồn'}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <Tag size={18} color="#3B82F6" strokeWidth={2} />
                    <Text className="font-sf-bold text-blue-600 text-sm md:text-xl">
                      {article?.categories?.name || 'Tin tức'}
                    </Text>
                  </View>
                </View>
              </SmoothTransition>

              <SmoothTransition isVisible={isContentReady} delay={300}>
                {/* Summary */}
                <LinearGradient
                  colors={['#004b8d', '#00c6ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.summaryGradient}
                >
                  <View
                    style={{
                      backgroundColor: isExpanded ? '#f3f4f6' : '#ffffff',
                      borderRadius: 12,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => setIsExpanded(!isExpanded)}
                      style={{
                        padding: 6,
                        paddingHorizontal: 16,
                      }}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row gap-2 items-center">
                          <Sparkles color="#374151" size={18} strokeWidth={2.5} />
                          <Text className="font-sf-bold text-lg md:text-xl text-gray-700">
                            Tóm tắt
                          </Text>
                        </View>
                        {isExpanded ? (
                          <ChevronUp size={16} color="#374151" strokeWidth={2.5} />
                        ) : (
                          <ChevronDown size={16} color="#374151" strokeWidth={2.5} />
                        )}
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.summaryContent}>
                        {article?.aiSummary && Array.isArray(article.aiSummary) ? (
                          article.aiSummary.map((point, i) => (
                            <View key={i} className="flex-row w-full items-start mb-2">
                              <View className="bg-gray-700 w-1.5 h-1.5 rounded-full ml-2 mt-2 mr-3" />
                              <Text
                                className="flex-1 font-sf-medium text-gray-700 text-lg md:text-xl"
                              >
                                {point}
                              </Text>
                            </View>
                          ))
                        ) : (
                          <Text
                            className="font-sf-medium text-gray-700 text-lg md:text-xl"
                          >
                            {article?.description || 'Tóm tắt đang được tạo...'}
                          </Text>
                        )}
                        <Text
                          className="font-sf-regular text-gray-400 text-sm md:text-lg p-2"
                        >
                          Tóm tắt này được tạo bởi AI và có thể chứa thông tin không chính xác.
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </SmoothTransition>

              <SmoothTransition isVisible={isContentReady} delay={400}>
                {/* Description */}
                {article?.description && (
                  <View>
                    <Text
                      className="font-sf-medium text-justify text-lg text-[#1F2937] md:text-2xl"
                    >
                      {article.description}
                    </Text>
                  </View>
                )}
              </SmoothTransition>

              <SmoothTransition isVisible={isContentReady} delay={500}>
                {/* ✅ HTML CONTENT WITH RENDER HTML - ĐƯỢC MEMOIZED */}
                {shouldShowHtmlContent ? (
                  <View>
                    {/* ✅ LOADING STATE FOR HTML RENDERING */}
                    {!loadingStates.htmlReady && (
                      <View style={{
                        minHeight: spacing(200),
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#F9FAFB',
                        borderRadius: 8,
                        marginVertical: 8,
                      }}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={{
                          fontSize: 14,
                          color: '#6B7280',
                          marginTop: 8,
                          fontWeight: '500',
                          fontFamily: FONT_CONFIG.medium,
                        }}>
                          Đang tải nội dung...
                        </Text>
                      </View>
                    )}
                    
                    {/* ✅ RENDER HTML CONTENT - ĐƯỢC MEMOIZED ĐỂ TRÁNH RE-RENDER */}
                    {loadingStates.htmlReady && (
                      <HtmlContentRenderer 
                        htmlContent={article.htmlcontent}
                      />
                    )}

                    {/* ✅ THÊM NGUỒN LINK */}
                    {loadingStates.htmlReady && (
                      <View className='flex-row w-full'>
                        <Text style={{ fontSize: 16, color: '#000', fontFamily: FONT_CONFIG.medium }}>Nguồn: </Text>
                        <TouchableOpacity onPress={() => Linking.openURL(article?.source)}>
                          <Text className='pl-[4px]' style={{ fontSize: 16, color: '#0066cc', fontFamily: FONT_CONFIG.medium }}>
                            {article?.author}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    
                  </View>
                ) : (
                  <View style={{ 
                    padding: 16, 
                    backgroundColor: '#F3F4F6', 
                    borderRadius: 8,
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      color: '#6B7280',
                      textAlign: 'center',
                      fontFamily: FONT_CONFIG.regular,
                      fontSize:14,
                    }}>
                      Không có nội dung HTML
                    </Text>
                  </View>
                )}
              </SmoothTransition>
            </View>

            {/* Related Articles */}
            <SmoothTransition isVisible={isContentReady && relatedArticles.length > 0} delay={600}>
              <View style={styles.relatedArticles}>
                <Text className="font-sf-bold text-gray-900 text-xl md:text-2xl mb-5">
                  Tin tức liên quan
                </Text>

                {relatedArticles.map((item, index) => {
                  const isLast = index === relatedArticles.length - 1;

                  return (
                    <SmoothTransition key={item._id} isVisible={true} delay={700 + (index * 100)}>
                      <TouchableOpacity
                        className={`flex-row items-start pb-3 ${isLast ? '' : 'border-b border-gray-200'}`}
                        style={styles.relatedItem}
                        onPress={() => handleRelatedArticlePress(item)}
                      >
                        <View className="flex-1 pr-3">
                          <Text className="font-sf-medium text-gray-400 leading-none text-sm md:text-xl">
                            {item.author || 'Không rõ nguồn'}
                          </Text>
                          <Text
                            className="font-sf-bold text-gray-900  text-lg md:text-xl"
                            numberOfLines={3}
                            ellipsizeMode="tail"
                          >
                            {item.title}
                          </Text>
                        </View>
                        {item.image ? (
                          <Image
                            source={{ uri: item.image }}
                            className='w-[80px] h-[80px] md:w-[120px] md:h-[120px] rounded-lg'
                            resizeMode="cover"
                          />
                        ) : (
                          <Image
                            source={require('../assets/news.jpg')}
                            className='w-[80px] h-[80px] md:w-[120px] md:h-[120px] rounded-lg'
                            resizeMode="cover"
                          />
                        )}
                      </TouchableOpacity>
                    </SmoothTransition>
                  );
                })}
              </View>
            </SmoothTransition>
          </ScrollView>
        </Animated.View>

        {/* Text Reader */}
        {showReader && (
          <View style={getTextReaderPosition()}>
            <TextReader
              content={currentText}
              onClose={handleCloseTextReader}
            />
          </View>
        )}

        {/* Bottom Bar */}
        <SmoothTransition isVisible={isContentReady} delay={100}>
          <Animated.View
            style={{
              transform: [{ translateY }],
              position: 'absolute',
              bottom: 0,
              width: '100%',
              alignItems: 'center', // căn giữa
              zIndex: 100,
            }}
          >
            <View
              className="bg-white rounded-xl mb-12"
              style={[
                styles.bottomBar,
                {
                  width: isTablet ? 400 : '90%',
                  maxWidth: 400,
                  paddingHorizontal: 12,
                },
              ]}
            >
              <View className="flex-row items-center justify-between" style={styles.bottomBarContent}>
                <View className="flex-row items-center space-x-1 gap-1">
                  <TouchableOpacity>
                    <Heart size={24} color="#374151" strokeWidth={2} />
                  </TouchableOpacity>
                  <Text style={styles.bottomBarText} className="font-sf-medium text-gray-800">
                    {article?.likes || 0}
                  </Text>
                </View>

                <TouchableOpacity 
                  onPress={toggleSaveWithAlert}
                  disabled={isToggling}
                  style={{ opacity: isToggling ? 0.6 : 1, padding: 4 }}
                >
                  {isToggling ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <Bookmark 
                      size={24} 
                      color={saveIcon.color} 
                      fill={saveIcon.fill}
                      strokeWidth={2} 
                    />
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleOpenTextReader}>
                  <AudioLines size={24} color="#374151" strokeWidth={2} />
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center gap-1">
                  <Share size={22} color="#374151" strokeWidth={2} />
                  <Text style={styles.bottomBarText} className="font-sf-medium text-gray-800">
                    Chia sẻ
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </SmoothTransition>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topNav: {
    zIndex: 1000,
    elevation: 1000,
  },
  navButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: spacing(0),
  },
  mainImage: {
    width: '100%',
    height: 250,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
  },
  articleTitle: {
    fontSize: 19,
  },
  articleBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metaText: {
    fontSize: 14,
  },
  summaryGradient: {
    borderRadius: 12,
    padding: 1.5,
    marginBottom: 12,
  },
  summaryHeader: {
    padding: 6,
    paddingHorizontal: 16,
  },
  summaryTitle: {
    fontSize: 16,
  },
  summaryContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: spacing(2),
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 22,
  },
  summaryNote: {
    fontSize: scaleFont(12),
    padding: 8,
    paddingTop: 0,
    paddingBottom: 0,
    lineHeight: 16,
  },
  articleContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  htmlContentContainer: {
    marginBottom: 16,
    width: '100%',
    minHeight: spacing(100),
  },
  relatedArticles: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 3,
    borderTopColor: '#E5E7EB',
  },
  relatedTitle: {
    fontSize: 20,
    marginBottom: 12,
  },
  relatedItem: {
    marginBottom: 8,
  },
  relatedSource: {
    fontSize: scaleFont(13),
  },
  relatedArticleTitle: {
    fontSize: scaleFont(15),
  },
  relatedImage: {
    width: scaleSize(80),
    height: scaleSize(80),
    borderRadius: 8,
  },
  bottomBar: {
    shadowColor: '#32325D',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  bottomBarContent: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
  },
  bottomBarText: {
    fontSize: 16,
  },
});