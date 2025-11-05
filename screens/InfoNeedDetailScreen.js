import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft, BookOpen, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FONT_CONFIG } from '../constants/fonts';
import api from '../services/apiService';

const { width, height } = Dimensions.get('window');

export default function InfoNeedDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { title, content: initialContent, partTitle, partId } = route.params || {};
  
  const [content, setContent] = useState(initialContent || null);
  const [loading, setLoading] = useState(!initialContent);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      // Nếu đã có content từ params thì không cần fetch
      if (initialContent) {
        return;
      }

      // Nếu không có title thì không fetch
      if (!title) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('📤 Fetching detail from /api/data/detail with title:', title);
        
        const response = await api.post('/data/detail', { title });
        console.log('✅ Detail fetched successfully:', response.data);
        
        if (response.data?.success && response.data?.data) {
          // Có thể response.data.data là string content hoặc object có content property
          const fetchedContent = typeof response.data.data === 'string' 
            ? response.data.data 
            : response.data.data.content || response.data.data;
          setContent(fetchedContent);
        } else if (response.data?.data) {
          // Trường hợp response.data.data trực tiếp là content
          setContent(response.data.data);
        } else {
          console.warn('⚠️ Unexpected data format:', response.data);
          setError('Không tìm thấy nội dung');
        }
      } catch (err) {
        console.error('❌ Error fetching detail:', err);
        setError(err.response?.data?.message || err.message || 'Không thể tải nội dung chi tiết');
        setContent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [title, initialContent]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']} style={{ fontFamily: FONT_CONFIG.regular }}>
      <StatusBar barStyle="light-content" backgroundColor="#0284C7" translucent={false} />

      {/* Header */}
      <LinearGradient colors={['#0EA5E9', '#0284C7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerGradient}>
        <View className="px-4 py-3">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 rounded-full bg-white/20" activeOpacity={0.7}>
              <ChevronLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View className="flex-1 items-center">
              <Text className="text-lg text-white font-bold" style={{ fontFamily: FONT_CONFIG.medium }}>
                {partId}
              </Text>

              <Text className="text-base text-white font-semibold" style={{ fontFamily: FONT_CONFIG.medium }}>
                {partTitle}
              </Text>
            </View>

            <BookOpen size={24} color="#FFFFFF" strokeWidth={2} />
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View className="px-4 pt-3 pb-5">
          {/* Title Section */}
          <View style={styles.titleCard}>
            {partTitle && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{partTitle}</Text>
              </View>
            )}
            <Text style={styles.titleText} numberOfLines={0}>
              {title || 'Chi tiết'}
            </Text>
          </View>

          {/* Content Card */}
          {loading ? (
            <View style={styles.loadingCard}>
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color="#0284C7" />
                <Text style={styles.loadingText}>Đang tải nội dung...</Text>
                <Text style={styles.loadingSubtext}>Vui lòng đợi trong giây lát</Text>
              </View>
            </View>
          ) : error ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <AlertCircle size={48} color="#EF4444" strokeWidth={1.5} />
                <Text style={styles.emptyText}>{error}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setLoading(true);
                    setError(null);
                    api.post('/data/detail', { title }).then(response => {
                      if (response.data?.success && response.data?.data) {
                        const fetchedContent = typeof response.data.data === 'string' 
                          ? response.data.data 
                          : response.data.data.content || response.data.data;
                        setContent(fetchedContent);
                      } else if (response.data?.data) {
                        setContent(response.data.data);
                      } else {
                        setError('Không tìm thấy nội dung');
                      }
                      setLoading(false);
                    }).catch(err => {
                      setError(err.response?.data?.message || err.message || 'Không thể tải nội dung chi tiết');
                      setLoading(false);
                    });
                  }}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : content ? (
            <View style={styles.contentCard}>
              <View style={styles.contentWrapper}>
                {(() => {
                  // Hàm parse và format text với các pattern đặc biệt
                  const parseTextWithFormatting = (text) => {
                    const lines = text.split('\n');
                    
                    return lines.map((line, lineIdx) => {
                      const trimmed = line.trim();
                      if (!trimmed) {
                        return <View key={lineIdx} style={{ height: 12 }} />;
                      }
                      
                      // Kiểm tra heading
                      const isHeading = trimmed.length < 80 &&
                        !trimmed.match(/^\d+\./) &&
                        !trimmed.match(/^[a-zđ]\)/) &&
                        !trimmed.match(/[\.\)]$/) &&
                        (trimmed === trimmed.toUpperCase() || trimmed.split(' ').length <= 6);
                      
                      if (isHeading) {
                        return (
                          <View key={lineIdx} style={[styles.headingContainer, lineIdx > 0 && { marginTop: 24 }]}>
                            <Text style={styles.headingText}>{trimmed}</Text>
                          </View>
                        );
                      }
                      
                      // Kiểm tra số đầu dòng: 1. 2. 3.
                      const numberMatch = trimmed.match(/^(\d+)\.\s*(.+)$/);
                      if (numberMatch) {
                        return (
                          <View key={lineIdx} style={[styles.listItem, styles.numberedListItem]}>
                            <View style={styles.numberBadge}>
                              <Text style={styles.numberText}>{numberMatch[1]}</Text>
                            </View>
                            <Text style={styles.listItemText}>{numberMatch[2]}</Text>
                          </View>
                        );
                      }
                      
                      // Kiểm tra chữ cái đầu dòng: a) b) đ)
                      const letterMatch = trimmed.match(/^([a-zđ])\)\s*(.+)$/);
                      if (letterMatch) {
                        return (
                          <View key={lineIdx} style={[styles.listItem, styles.letterListItem]}>
                            <View style={styles.letterBadge}>
                              <Text style={styles.letterText}>{letterMatch[1]}</Text>
                            </View>
                            <Text style={styles.listItemText}>{letterMatch[2]}</Text>
                          </View>
                        );
                      }
                      
                      // Kiểm tra Roman số: I. II. III.
                      const romanMatch = trimmed.match(/^([IVX]+)\.\s*(.+)$/);
                      if (romanMatch) {
                        return (
                          <View key={lineIdx} style={[styles.listItem, styles.romanListItem]}>
                            <View style={styles.romanBadge}>
                              <Text style={styles.romanText}>{romanMatch[1]}</Text>
                            </View>
                            <Text style={styles.listItemText}>{romanMatch[2]}</Text>
                          </View>
                        );
                      }
                      
                      // Kiểm tra text có số trong nội dung (nhưng không phải đầu dòng)
                      // Ví dụ: "Theo quy định tại Điều 107..." -> làm đậm số
                      const parts = trimmed.split(/(\d+)/);
                      const formattedParts = parts.map((part, partIdx) => {
                        if (/^\d+$/.test(part)) {
                          return (
                            <Text key={partIdx} style={styles.boldNumber}>
                              {part}
                            </Text>
                          );
                        }
                        return <Text key={partIdx}>{part}</Text>;
                      });
                      
                      return (
                        <Text key={lineIdx} style={[styles.paragraphText, lineIdx > 0 && { marginTop: 16 }]}>
                          {formattedParts}
                        </Text>
                      );
                    });
                  };
                  
                  return parseTextWithFormatting(content);
                })()}
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <BookOpen size={48} color="#9CA3AF" strokeWidth={1.5} />
                <Text style={styles.emptyText}>Chưa có nội dung chi tiết</Text>
                <Text style={styles.emptySubtext}>Nội dung sẽ được cập nhật sau</Text>
              </View>
            </View>
          )}
        </View>

        <View className="h-32" />
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles - ĐÃ TỐI ƯU
const styles = StyleSheet.create({
  headerGradient: {
    width: '100%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6 },
      android: { elevation: 6 },
    }),
  },
  scrollContent: { paddingBottom: 50 },
  titleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    borderLeftWidth: 4,
    borderLeftColor: '#0284C7',
    marginTop: 20,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    fontFamily: FONT_CONFIG.medium,
    fontSize: 11,
    color: '#0369A1',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  titleText: {
    fontFamily: FONT_CONFIG.medium,
    fontSize: 18,
    lineHeight: 24,
    color: '#111827',
    letterSpacing: 0.2,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...Platform.select({
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 8 
      },
      android: { elevation: 2 },
    }),
  },
  contentWrapper: {
    paddingTop: 4,
  },
  paragraphText: {
    fontFamily: FONT_CONFIG.regular,
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    letterSpacing: 0.15,
  },
  headingContainer: { 
    marginTop: 8, 
    marginBottom: 12, 
    paddingBottom: 12, 
    borderBottomWidth: 2, 
    borderBottomColor: '#E0F2FE',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingTop: 12,
    borderRadius: 8,
  },
  headingText: { 
    fontFamily: FONT_CONFIG.bold, 
    fontSize: 19, 
    lineHeight: 28, 
    color: '#0284C7', 
    letterSpacing: 0.3,
  },
  listContainer: {},
  listItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 12,
    paddingVertical: 4,
  },
  numberedListItem: {
    marginBottom: 10,
    paddingLeft: 4,
  },
  letterListItem: {
    marginBottom: 10,
    paddingLeft: 4,
  },
  romanListItem: {
    marginBottom: 10,
    paddingLeft: 4,
  },
  numberBadge: {
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#E0F2FE',
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12, 
    marginTop: 2,
    borderWidth: 2,
    borderColor: '#0284C7',
  },
  numberText: { 
    fontFamily: FONT_CONFIG.bold, 
    fontSize: 15, 
    color: '#0284C7',
    fontWeight: 'bold',
  },
  letterBadge: {
    minWidth: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#F0F9FF',
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 10, 
    marginRight: 12, 
    marginTop: 2,
    borderWidth: 2,
    borderColor: '#0369A1',
  },
  letterText: { 
    fontFamily: FONT_CONFIG.bold, 
    fontSize: 15, 
    color: '#0369A1',
    fontWeight: 'bold',
  },
  romanBadge: {
    minWidth: 40, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#E9D5FF',
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 10, 
    marginRight: 12, 
    marginTop: 2,
    borderWidth: 2,
    borderColor: '#9333EA',
  },
  romanText: { 
    fontFamily: FONT_CONFIG.bold, 
    fontSize: 14, 
    color: '#9333EA',
    fontWeight: 'bold',
  },
  listItemText: { 
    flex: 1, 
    fontFamily: FONT_CONFIG.regular, 
    fontSize: 16, 
    lineHeight: 26, 
    color: '#1F2937', 
    paddingTop: 6,
    letterSpacing: 0.1,
  },
  contentText: { 
    fontFamily: FONT_CONFIG.regular, 
    fontSize: 16, 
    lineHeight: 26, 
    color: '#1F2937',
  },
  boldNumber: {
    fontFamily: FONT_CONFIG.bold,
    fontWeight: 'bold',
    color: '#0284C7',
    fontSize: 16,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  emptyContent: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: FONT_CONFIG.medium, fontSize: 16, color: '#6B7280', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontFamily: FONT_CONFIG.regular, fontSize: 14, color: '#9CA3AF', textAlign: 'center', fontStyle: 'italic' },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  loadingContent: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: FONT_CONFIG.medium, fontSize: 16, color: '#0284C7', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  loadingSubtext: { fontFamily: FONT_CONFIG.regular, fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0284C7',
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#0284C7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  retryButtonText: { fontFamily: FONT_CONFIG.medium, fontSize: 14, color: '#FFFFFF', textAlign: 'center' },
});