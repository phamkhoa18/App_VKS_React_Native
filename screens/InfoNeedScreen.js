import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Scale,
  Shield,
  Users,
  Building,
  Gavel,
  FileText,
  Lock,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  UserCheck,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { FONT_CONFIG } from '../constants/fonts';
import api from '../services/apiService';
const { width, height } = Dimensions.get('window');

// Skeleton Loading Components với Shimmer Effect
const SkeletonShimmer = ({ style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.8, 0.4],
  });

  return (
    <View
      style={[
        {
          backgroundColor: '#E5E7EB',
          borderRadius: 8,
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
          backgroundColor: '#F3F4F6',
          opacity,
        }}
      />
    </View>
  );
};

const SkeletonCard = () => (
  <View className="mb-4">
    {/* Skeleton cho phần header */}
    <View className="mb-3">
      <SkeletonShimmer style={{ height: 14, width: 120, marginBottom: 8 }} />
      <SkeletonShimmer style={{ height: 18, width: '85%', marginBottom: 16 }} />
    </View>
    
    {/* Skeleton cho accordion items */}
    <View className="mb-2">
      <View className="mb-2 bg-white rounded-xl border border-gray-200 p-4">
        <SkeletonShimmer style={{ height: 20, width: '70%', marginBottom: 12 }} />
        <View className="mt-2">
          <SkeletonShimmer style={{ height: 48, width: '100%', borderRadius: 12, marginBottom: 8 }} />
          <SkeletonShimmer style={{ height: 48, width: '100%', borderRadius: 12, marginBottom: 8 }} />
          <SkeletonShimmer style={{ height: 48, width: '95%', borderRadius: 12 }} />
        </View>
      </View>
      <View className="bg-white rounded-xl border border-gray-200 p-4">
        <SkeletonShimmer style={{ height: 20, width: '65%', marginBottom: 12 }} />
        <View className="mt-2">
          <SkeletonShimmer style={{ height: 48, width: '98%', borderRadius: 12, marginBottom: 8 }} />
          <SkeletonShimmer style={{ height: 48, width: '92%', borderRadius: 12 }} />
        </View>
      </View>
    </View>
  </View>
);

const LoadingSkeleton = () => (
  <View className="px-4 py-4">
    {[1, 2, 3].map((item) => (
      <SkeletonCard key={item} />
    ))}
  </View>
);


// Component con: Accordion Item
const AccordionItem = ({ title, children, level = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const heightInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });

  return (
    <View className={`${level === 0 ? 'mb-4' : 'mb-2'}`}>
      <TouchableOpacity
        onPress={toggle}
        className={`flex-row items-center justify-between px-4 py-3 rounded-xl ${
          level === 0 ? 'bg-blue-50' : 'bg-gray-50'
        } border border-gray-200`}
        activeOpacity={0.7}
      >
        <Text
          className={`flex-1 ${
            level === 0 ? 'text-md font-semibold text-blue-900' : 'text-base text-gray-800'
          }`}
          style={{ fontFamily: level === 0 ? FONT_CONFIG.medium : FONT_CONFIG.regular }}
        >
          {title}
        </Text>
        <Animated.View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <ChevronDown 
            size={18} 
            color={level === 0 ? '#0284C7' : '#64748B'} 
            strokeWidth={2.5}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Hidden view để đo chiều cao thực tế của content */}
      <View 
        style={{ position: 'absolute', opacity: 0, zIndex: -1 }}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          if (height > 0 && contentHeight !== height) {
            setContentHeight(height);
          }
        }}
      >
        <View className="px-3 py-2">
          {children}
        </View>
      </View>

      <Animated.View style={{ height: expanded ? heightInterpolate : 0, overflow: 'hidden' }}>
        <View className="px-3 py-2">{children}</View>
      </Animated.View>
    </View>
  );
};

export default function InfoNeedScreen() {
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📤 Fetching data from /api/data...');
        
        const response = await api.get('/data');
        console.log('✅ Data fetched successfully:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          setData(response.data);
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          setData(response.data.data);
        } else if (response.data?.success && Array.isArray(response.data.data)) {
          setData(response.data.data);
        } else {
          console.warn('⚠️ Unexpected data format:', response.data);
          setData([]);
        }
      } catch (err) {
        console.error('❌ Error fetching data:', err);
        setError(err.response?.data?.message || err.message || 'Không thể tải dữ liệu');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']} style={{ fontFamily: FONT_CONFIG.regular }}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#0284C7" 
        translucent={false}
      />

      {/* Header */}
      <LinearGradient 
        colors={['#0EA5E9', '#0284C7']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View className="px-5 py-2">
          <View className="flex flex-row items-center mb-1 justify-between">
            {/* Nút Back */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="p-2 rounded-full bg-white/20"
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            {/* Title và Icon */}
            <View className="flex flex-col items-center h-full">
              <View className="">
                <Text 
                  className="text-xl text-white flex items-center font-bold"
                  style={{ fontFamily: FONT_CONFIG.bold }}
                >
                  Tài liệu VKSND
                </Text>
              </View>

              <Text 
                className="text-sm text-sky-100"
                style={{ fontFamily: FONT_CONFIG.regular }}
              >
                Hệ thống pháp luật & quy trình tố tụng
              </Text>
            </View>

            <BookOpen size={24} color="#FFFFFF" />
          </View>
        </View>
      </LinearGradient>

      {/* Body */}
      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="flex-1">
            {/* Loading Header với Animation */}
            <View className="items-center justify-center py-8">
              <View className="relative">
                <ActivityIndicator size="large" color="#0284C7" />
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 20,
                    borderWidth: 3,
                    borderColor: '#0284C7',
                    borderTopColor: 'transparent',
                    borderRightColor: 'transparent',
                  }}
                />
              </View>
              <View className="mt-4 items-center">
                <Text
                  className="text-gray-700 text-base"
                  style={{ fontFamily: FONT_CONFIG.medium }}
                >
                  Đang tải tài liệu VKSND
                </Text>
                <Text
                  className="text-gray-500 text-sm mt-1"
                  style={{ fontFamily: FONT_CONFIG.regular }}
                >
                  Vui lòng đợi trong giây lát...
                </Text>
              </View>
            </View>
            
            {/* Skeleton Loading */}
            <LoadingSkeleton />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-20 px-4">
            <AlertCircle size={48} color="#EF4444" />
            <Text 
              className="text-red-600 mt-4 text-center"
              style={{ fontFamily: FONT_CONFIG.medium }}
            >
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setLoading(true);
                setError(null);
                api.get('/data').then(response => {
                  if (response.data && Array.isArray(response.data)) {
                    setData(response.data);
                  } else if (response.data?.data && Array.isArray(response.data.data)) {
                    setData(response.data.data);
                  } else if (response.data?.success && Array.isArray(response.data.data)) {
                    setData(response.data.data);
                  } else {
                    setData([]);
                  }
                  setLoading(false);
                }).catch(err => {
                  setError(err.response?.data?.message || err.message || 'Không thể tải dữ liệu');
                  setLoading(false);
                });
              }}
              className="mt-4 px-6 py-3 bg-blue-500 rounded-lg"
            >
              <Text 
                className="text-white"
                style={{ fontFamily: FONT_CONFIG.medium }}
              >
                Thử lại
              </Text>
            </TouchableOpacity>
          </View>
        ) : data.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <BookOpen size={48} color="#9CA3AF" />
            <Text 
              className="text-gray-600 mt-4 text-center"
              style={{ fontFamily: FONT_CONFIG.regular }}
            >
              Chưa có dữ liệu
            </Text>
          </View>
        ) : (
          data.map((part, index) => (
          <View key={index} className="mb-3">
            {/* Phần lớn */}
            <View className="mb-3">
              <Text 
                className="text-sm text-amber-600"
                style={{ fontFamily: FONT_CONFIG.medium }}
              >
                {part.part}
              </Text>
              <Text 
                className="text-md font-bold text-gray-700 mt-1"
                style={{ fontFamily: FONT_CONFIG.medium }}
              >
                {part.title}
              </Text>
            </View>

            {/* Các mục con */}
            {part.sections.map((section, sIdx) => (
              <AccordionItem
                key={sIdx}
                title={section.title}
                level={0}
              >
                {section.subsections.length > 0 ? (
                  <View className="space-y-1">
                    {section.subsections.map((sub, subIdx) => {
                      // Kiểm tra nếu sub là object (có title và content) hay string
                      const isObject = typeof sub === 'object' && sub !== null;
                      const subTitle = isObject ? sub.title : sub;
                      const subContent = isObject ? sub.content : null;
                      
                      // Luôn tạo TouchableOpacity để navigate (nếu có content thì truyền content, không có thì truyền null)
                      return (
                        <TouchableOpacity
                          key={subIdx}
                          onPress={() => navigation.navigate('InfoNeedDetail', {
                            title: subTitle,
                            content: subContent,
                            partTitle: `${section.title}`,
                            partId: part.part
                          })}
                          className="flex-row items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mb-2"
                          activeOpacity={0.7}
                        >
                          <Text
                            className="flex-1 text-base text-gray-800 mr-2"
                            style={{ fontFamily: FONT_CONFIG.regular }}
                          >
                            {subTitle}
                          </Text>
                          <ChevronRight 
                            size={20} 
                            color="#64748B" 
                            strokeWidth={2.5}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View className="py-3 px-4 bg-amber-50 rounded-lg border border-amber-200">
                    <Text 
                      className="text-sm text-amber-800"
                      style={{ fontFamily: FONT_CONFIG.medium }}
                    >
                      Biểu mẫu sẽ được cập nhật
                    </Text>
                  </View>
                )}
              </AccordionItem>
            ))}
          </View>
          ))
        )}
        <View className="h-32" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    width: '100%',
  },
});