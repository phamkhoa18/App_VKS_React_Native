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
        <View style={{ marginBottom: spacing(16) }}>
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
          <View style={{ backgroundColor: '#f3f4f6', borderRadius: scaleSize(12), padding: spacing(16) }}>
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
        marginVertical: spacing(8),
        alignItems: 'center',
        width: '100%',
      }}>
        <View style={{
          width: contentWidth,
          height: 200,
          backgroundColor: '#F3F4F6',
          borderRadius: scaleSize(8),
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
      marginVertical: spacing(8),
      alignItems: 'center',
      width: '100%',
    }}>
      <Image
        source={{ uri: src }}
        style={{
          width: imageSize.width,
          height: imageSize.height,
          borderRadius: scaleSize(8),
        }}
        resizeMode="cover"
        onError={(error) => {
          console.warn('Image load error:', error);
        }}
      />
      {(alt || title) && (
        <Text style={{
          fontSize: scaleFont(14),
          fontStyle: 'italic',
          color: '#6B7280',
          marginTop: spacing(4),
          textAlign: 'center',
          fontFamily: FONT_CONFIG.regular,
          paddingHorizontal: spacing(8),
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
  const contentWidth = width - spacing(28);

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
        marginVertical: spacing(12),
        alignItems: 'center',
        width: '100%',
      }}>
        <TDefaultRenderer {...props} />
      </View>
    ),

    figcaption: ({ TDefaultRenderer, ...props }) => (
      <Text style={{
        fontSize: scaleFont(14),
        fontStyle: 'italic',
        color: '#6B7280',
        marginTop: spacing(4),
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
      fontSize: scaleFont(16),
      lineHeight: scaleFont(26),
      color: '#1F2937',
      padding: 0,
      margin: 0,
      textAlign: 'justify',
    },
    p: {
      fontFamily: FONT_CONFIG.regular,
      fontSize: scaleFont(16),
      lineHeight: scaleFont(26),
      color: '#1F2937',
      marginVertical: spacing(6),
      textAlign: 'justify',
    },
    h1: {
      fontFamily: FONT_CONFIG.bold,
      fontSize: scaleFont(26),
      color: '#111827',
      marginVertical: spacing(12),
      lineHeight: scaleFont(32),
    },
    h2: {
      fontFamily: FONT_CONFIG.bold,
      fontSize: scaleFont(22),
      color: '#111827',
      marginVertical: spacing(10),
      lineHeight: scaleFont(28),
    },
    h3: {
      fontFamily: FONT_CONFIG.bold,
      fontSize: scaleFont(20),
      color: '#111827',
      marginVertical: spacing(8),
      lineHeight: scaleFont(26),
    },
    h4: {
      fontFamily: FONT_CONFIG.medium,
      fontSize: scaleFont(18),
      color: '#111827',
      marginVertical: spacing(6),
      lineHeight: scaleFont(24),
    },
    h5: {
      fontFamily: FONT_CONFIG.medium,
      fontSize: scaleFont(16),
      color: '#111827',
      marginVertical: spacing(4),
      lineHeight: scaleFont(22),
    },
    h6: {
      fontFamily: FONT_CONFIG.medium,
      fontSize: scaleFont(14),
      color: '#111827',
      marginVertical: spacing(4),
      lineHeight: scaleFont(20),
    },
    blockquote: {
      fontFamily: FONT_CONFIG.regular,
      borderLeftWidth: scaleSize(4),
      borderLeftColor: '#3B82F6',
      paddingLeft: spacing(16),
      backgroundColor: '#F8FAFC',
      padding: spacing(16),
      borderRadius: scaleSize(8),
      marginVertical: spacing(12),
      fontStyle: 'italic',
      fontSize: scaleFont(16),
      lineHeight: scaleFont(24),
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
      marginVertical: spacing(8),
      paddingLeft: spacing(20),
    },
    ol: {
      fontFamily: FONT_CONFIG.regular,
      marginVertical: spacing(8),
      paddingLeft: spacing(20),
    },
    li: {
      fontFamily: FONT_CONFIG.regular,
      fontSize: scaleFont(16),
      lineHeight: scaleFont(24),
      color: '#1F2937',
      marginVertical: spacing(2),
    },
    table: {
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: scaleSize(8),
      marginVertical: spacing(12),
      width: '100%',
    },
    th: {
      fontFamily: FONT_CONFIG.medium,
      backgroundColor: '#F9FAFB',
      padding: spacing(8),
      borderWidth: 1,
      borderColor: '#E5E7EB',
      fontSize: scaleFont(14),
    },
    td: {
      fontFamily: FONT_CONFIG.regular,
      padding: spacing(8),
      borderWidth: 1,
      borderColor: '#E5E7EB',
      fontSize: scaleFont(14),
    },
    pre: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      backgroundColor: '#F3F4F6',
      padding: spacing(12),
      borderRadius: scaleSize(6),
      fontSize: scaleFont(14),
      lineHeight: scaleFont(18),
      marginVertical: spacing(8),
    },
    code: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      backgroundColor: '#F3F4F6',
      paddingHorizontal: spacing(4),
      paddingVertical: spacing(2),
      borderRadius: scaleSize(4),
      fontSize: scaleFont(14),
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
      fontSize: scaleFont(16),
      lineHeight: scaleFont(26),
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
          fontSize: scaleFont(16),
          lineHeight: scaleFont(26),
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

  console.log(isSaved);
  

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

  // ✅ DEBUG LOGS
  useEffect(() => {
    console.log('🔍 Loading states:', loadingStates);
    // console.log('🔍 Content ready:', isContentReady.name);
    console.log('✅ Using SF Pro fonts from App.js:', FONT_CONFIG);
  }, [loadingStates, isContentReady]);

  // ✅ VALIDATE ARTICLE ID
  useEffect(() => {
    if (!articleId) {
      console.error('❌ No article ID provided');
      setError('Không tìm thấy ID bài viết');
      return;
    }
    console.log('✅ Article ID found:', articleId);
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
        console.log('✅ HTML content ready for rendering');
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
      
      console.log('🔄 Fetching article for ID:', articleId);
      
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
        console.log('✅ Related articles loaded:', relatedResponse.value.data?.length);
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
      bottom: spacing(4),
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
    <SafeAreaView
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
            backgroundColor: 'transparent',
          }}
          edges={['top']} // Chỉ áp dụng safe area cho cạnh trên
        >
          <View
            style={{
              paddingHorizontal: spacing(12),
              paddingTop: insets.top, // Áp dụng insets.top trực tiếp
              paddingBottom: spacing(8), // Thêm paddingBottom để tạo khoảng cách đẹp
            }}
          >
            <View style={styles.topNav}>
              <View className="flex-row justify-between items-center">
                <TouchableOpacity
                  className="bg-white/90 rounded-full p-2"
                  onPress={() => navigation.goBack()}
                  style={styles.navButton}
                >
                  <ChevronLeft size={scaleSize(22)} color="#000" strokeWidth={1.5} />
                </TouchableOpacity>
                <View className="flex-row space-x-2">
                  <TouchableOpacity
                    className="bg-white/90 rounded-full p-2"
                    style={styles.navButton}
                  >
                    <EllipsisVertical size={scaleSize(22)} color="#000" strokeWidth={1.5} />
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
                    style={styles.mainImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={require('../assets/news.jpg')}
                    style={styles.mainImage}
                    resizeMode="cover"
                  />
                )}
                <View className="absolute inset-0 bg-black/50" style={{ zIndex: 1 }} />
                <View style={[styles.imageOverlay, { zIndex: 2 }]}>
                  <Text
                    style={styles.articleTitle}
                    className="font-sf-bold text-white leading-7"
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
                <View className="flex-row items-center justify-between mb-3 flex-wrap">
                  <View className="flex-row items-center gap-3 flex-wrap">
                    <View className="flex-row items-center gap-1.5">
                      <Clock size={scaleSize(16)} color="#9CA3AF" strokeWidth={2} />
                      <Text style={styles.metaText} className="font-sf-medium text-gray-400">
                        {formatTime(article?.publishDate || article?.createdAt)}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <Newspaper size={scaleSize(16)} color="#9CA3AF" strokeWidth={2} />
                      <Text style={styles.metaText} className="font-sf-bold text-gray-400">
                        {article?.author || 'Không rõ nguồn'}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <Tag size={scaleSize(16)} color="#3B82F6" strokeWidth={2} />
                    <Text style={styles.metaText} className="font-sf-bold text-blue-600">
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
                      borderRadius: scaleSize(12),
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => setIsExpanded(!isExpanded)}
                      style={styles.summaryHeader}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row gap-2 items-center">
                          <Sparkles color="#374151" size={scaleSize(18)} strokeWidth={2.5} />
                          <Text style={styles.summaryTitle} className="font-sf-bold text-gray-700">
                            Tóm tắt
                          </Text>
                        </View>
                        {isExpanded ? (
                          <ChevronUp size={scaleSize(16)} color="#374151" strokeWidth={2.5} />
                        ) : (
                          <ChevronDown size={scaleSize(16)} color="#374151" strokeWidth={2.5} />
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
                                style={styles.summaryText}
                                className="flex-1 font-sf-medium text-gray-700"
                              >
                                {point}
                              </Text>
                            </View>
                          ))
                        ) : (
                          <Text
                            style={styles.summaryText}
                            className="font-sf-medium text-gray-700"
                          >
                            {article?.description || 'Tóm tắt đang được tạo...'}
                          </Text>
                        )}
                        <Text
                          style={styles.summaryNote}
                          className="font-sf-regular text-gray-400"
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
                  <View style={{ marginBottom: spacing(2) }}>
                    <Text
                      style={[styles.articleContent, { fontWeight: '600', color: '#1F2937'}]}
                      className="font-sf-medium text-justify"
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
                        borderRadius: scaleSize(8),
                        marginVertical: spacing(8),
                      }}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={{
                          fontSize: scaleFont(14),
                          color: '#6B7280',
                          marginTop: spacing(8),
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
                        <Text style={{ fontSize: scaleFont(16), color: '#000', fontFamily: FONT_CONFIG.medium }}>Nguồn: </Text>
                        <TouchableOpacity onPress={() => Linking.openURL(article?.source)}>
                          <Text className='pl-[4px]' style={{ fontSize: scaleFont(16), color: '#0066cc', fontFamily: FONT_CONFIG.medium }}>
                            {article?.author}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    
                  </View>
                ) : (
                  <View style={{ 
                    padding: spacing(16), 
                    backgroundColor: '#F3F4F6', 
                    borderRadius: scaleSize(8),
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      color: '#6B7280',
                      textAlign: 'center',
                      fontFamily: FONT_CONFIG.regular,
                      fontSize: scaleFont(14),
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
                <Text style={styles.relatedTitle} className="font-sf-bold text-gray-900">
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
                          <Text style={styles.relatedSource} className="font-sf-medium text-gray-400 leading-none">
                            {item.author || 'Không rõ nguồn'}
                          </Text>
                          <Text
                            style={styles.relatedArticleTitle}
                            className="font-sf-bold text-gray-900"
                            numberOfLines={3}
                            ellipsizeMode="tail"
                          >
                            {item.title}
                          </Text>
                        </View>
                        {item.image ? (
                          <Image
                            source={{ uri: item.image }}
                            style={styles.relatedImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Image
                            source={require('../assets/news.jpg')}
                            style={styles.relatedImage}
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
              paddingHorizontal: spacing(12),
              zIndex: 100,
            }}
          >
            <View
              className="bg-white rounded-xl mx-5 mb-12"
              style={styles.bottomBar}
            >
              <View className="flex-row items-center justify-between" style={styles.bottomBarContent}>
              <View className="flex-row items-center space-x-1 gap-1">
                <TouchableOpacity>
                  <Heart size={scaleSize(24)} color="#374151" strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.bottomBarText} className="font-sf-medium text-gray-800">
                  {article?.likes || 0}
                </Text>
              </View>
              
              {/* ✅ FIX BOOKMARK BUTTON */}
              <TouchableOpacity 
                onPress={toggleSaveWithAlert}
                disabled={isToggling}
                style={{ 
                  opacity: isToggling ? 0.6 : 1,
                  padding: 4, // Tăng touch area
                }}
              >
                {isToggling ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Bookmark 
                    size={scaleSize(24)} 
                    color={saveIcon.color} 
                    fill={saveIcon.fill}
                    strokeWidth={2} 
                  />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleOpenTextReader}>
                <AudioLines size={scaleSize(24)} color="#374151" strokeWidth={2} />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center gap-1">
                <Share size={scaleSize(22)} color="#374151" strokeWidth={2} />
                <Text style={styles.bottomBarText} className="font-sf-medium text-gray-800">
                  Chia sẻ
                </Text>
              </TouchableOpacity>
            </View>
            </View>
          </Animated.View>
        </SmoothTransition>
      </View>
    </SafeAreaView>
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
    paddingBottom: spacing(80),
  },
  mainImage: {
    width: '100%',
    height: spacing(250),
  },
  imageOverlay: {
    position: 'absolute',
    bottom: spacing(8),
    left: spacing(12),
    right: spacing(12),
  },
  articleTitle: {
    fontSize: scaleFont(19),
  },
  articleBody: {
    paddingHorizontal: spacing(14),
    paddingVertical: spacing(12),
  },
  metaText: {
    fontSize: scaleFont(14),
  },
  summaryGradient: {
    borderRadius: scaleSize(12),
    padding: scaleSize(1.5),
    marginBottom: spacing(12),
  },
  summaryHeader: {
    padding: spacing(6),
    paddingHorizontal: spacing(16),
  },
  summaryTitle: {
    fontSize: scaleFont(16),
  },
  summaryContent: {
    paddingHorizontal: spacing(12),
    paddingBottom: spacing(8),
    gap: spacing(2),
  },
  summaryText: {
    fontSize: scaleFont(16),
    lineHeight: scaleFont(22),
  },
  summaryNote: {
    fontSize: scaleFont(12),
    padding: spacing(8),
    paddingTop: 0,
    paddingBottom: 0,
    lineHeight: scaleFont(16),
  },
  articleContent: {
    fontSize: scaleFont(16),
    lineHeight: scaleFont(24),
  },
  htmlContentContainer: {
    marginBottom: spacing(16),
    width: '100%',
    minHeight: spacing(100),
  },
  relatedArticles: {
    paddingHorizontal: spacing(12),
    paddingTop: spacing(12),
    paddingBottom: spacing(20),
    borderTopWidth: spacing(3),
    borderTopColor: '#E5E7EB',
  },
  relatedTitle: {
    fontSize: scaleFont(20),
    marginBottom: spacing(12),
  },
  relatedItem: {
    marginBottom: spacing(8),
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
    borderRadius: scaleSize(8),
  },
  bottomBar: {
    shadowColor: '#32325D',
    shadowOpacity: 0.2,
    shadowRadius: scaleSize(8),
    shadowOffset: { width: 0, height: spacing(2) },
    elevation: 6,
  },
  bottomBarContent: {
    paddingTop: spacing(10),
    paddingBottom: spacing(10),
    paddingLeft: spacing(20),
    paddingRight: spacing(20),
  },
  bottomBarText: {
    fontSize: scaleFont(16),
  },
});