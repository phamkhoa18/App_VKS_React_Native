import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,  
  StatusBar,
  Animated,
  Dimensions,
  Platform,
  StyleSheet
} from 'react-native';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Share2,
  Bookmark,
  Type,
  Palette,
  RotateCcw,
  ChevronUp,
  Eye,
  Calendar,
  Building,
  Users,
  Award,
  Scale,
  Shield,
  UserCheck,
  MapPin,
  Briefcase,
  Heart,
  MessageCircle,
  ChevronLeft
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Color system từ ProfileScreen
const COLORS = {
  primary: {
    50: '#F0F9FF',
    100: '#E0F2FE', 
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  secondary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  accent: {
    amber: '#F59E0B',
    rose: '#F43F5E',
    purple: '#8B5CF6',
    indigo: '#6366F1',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  surface: {
    primary: '#FFFFFF',
    secondary: '#FAFBFC',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
  },
  reading: {
    sepia: '#F7F3E9',
    sepiaText: '#5D4E37',
    dark: '#1A1A1A',
    darkText: '#E5E5E5',
  }
};

const FONT_CONFIG = {
  black: 'SFPro-Black',
  bold: 'SFPro-Bold',
  regular: 'SFPro-Regular',
  medium: 'SFPro-Medium',
  light: 'SFPro-Light',
};

const GRADIENTS = {
  primary: [COLORS.primary[400], COLORS.primary[600], COLORS.primary[700]],
  secondary: [COLORS.secondary[400], COLORS.secondary[600]],
  reading: [COLORS.accent.purple, '#7C3AED'],
};

// Reading themes
const READING_THEMES = {
  light: {
    background: COLORS.surface.secondary,
    text: COLORS.neutral[900],
    secondary: COLORS.neutral[600],
    surface: COLORS.surface.card,
  },
  sepia: {
    background: COLORS.reading.sepia,
    text: COLORS.reading.sepiaText,
    secondary: '#8B7355',
    surface: '#F5F1E8',
  },
  dark: {
    background: COLORS.reading.dark,
    text: COLORS.reading.darkText,
    secondary: '#A0A0A0',
    surface: '#2D2D2D',
  }
};

const FONT_SIZES = {
  small: { title: 20, body: 14, heading: 16, subheading: 15 },
  medium: { title: 24, body: 16, heading: 18, subheading: 17 },
  large: { title: 28, body: 18, heading: 20, subheading: 19 },
  xlarge: { title: 32, body: 20, heading: 22, subheading: 21 },
};

export default function ReadingScreen() {
  const navigation = useNavigation();
  const [currentTheme, setCurrentTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('8 phút');
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);

  const theme = READING_THEMES[currentTheme];
  const fontSizes = FONT_SIZES[fontSize];

  // Auto-hide controls when scrolling
  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const progress = Math.min(value / (height * 4), 1);
      setReadingProgress(progress);
      
      if (value > 100 && showControls) {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
        setShowControls(false);
      }
    });

    return () => scrollY.removeListener(listener);
  }, [showControls]);

  const showControlsAgain = () => {
    if (!showControls) {
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setShowControls(true);
    }
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleBack = () => {
    navigation.goBack();
  };


  const renderFloatingControls = () => (
    <View style={styles.floatingControls}>
      {!showControls && (
        <TouchableOpacity 
          onPress={showControlsAgain}
          style={[styles.floatingButton, { backgroundColor: theme.surface }]}
          activeOpacity={0.8}
        >
          <ChevronUp size={20} color={theme.text} />
        </TouchableOpacity>
      )}
      
      <TouchableOpacity 
        onPress={scrollToTop}
        style={[styles.floatingButton, { backgroundColor: theme.surface }]}
        activeOpacity={0.8}
      >
        <RotateCcw size={20} color={theme.text} />
      </TouchableOpacity>
    </View>
  );

  const renderArticleMeta = () => (
    <View style={[styles.articleMeta, { backgroundColor: theme.surface }]}>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Calendar size={16} color={theme.secondary} />
          <Text style={[styles.metaText, { color: theme.secondary, fontFamily: FONT_CONFIG.medium }]}>
            20/11/2018
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Clock size={16} color={theme.secondary} />
          <Text style={[styles.metaText, { color: theme.secondary, fontFamily: FONT_CONFIG.medium }]}>
            {estimatedTime} đọc
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Building size={16} color={theme.secondary} />
          <Text style={[styles.metaText, { color: theme.secondary, fontFamily: FONT_CONFIG.medium }]}>
            VKSNDTC
          </Text>
        </View>
      </View>
      
      <View style={styles.readingStats}>
        <View style={styles.statItem}>
          <Eye size={14} color={COLORS.primary[500]} />
          <Text style={[styles.statText, { color: theme.secondary, fontFamily: FONT_CONFIG.medium }]}>5.2k</Text>
        </View>
        <View style={styles.statItem}>
          <Heart size={14} color={COLORS.accent.rose} />
          <Text style={[styles.statText, { color: theme.secondary, fontFamily: FONT_CONFIG.medium }]}>298</Text>
        </View>
        <View style={styles.statItem}>
          <MessageCircle size={14} color={COLORS.secondary[500]} />
          <Text style={[styles.statText, { color: theme.secondary, fontFamily: FONT_CONFIG.medium }]}>54</Text>
        </View>
      </View>
    </View>
  );

  const renderSection = (title, content, icon = null, isHighlight = false) => (
    <View style={[
      styles.section, 
      { backgroundColor: theme.surface },
      isHighlight && { borderLeftWidth: 4, borderLeftColor: COLORS.primary[500] }
    ]}>
      <View style={styles.sectionHeader}>
        {icon && (
          <View style={[styles.sectionIcon, { backgroundColor: COLORS.primary[100] }]}>
            {icon}
          </View>
        )}
        <Text style={[
          styles.sectionTitle, 
          { 
            color: theme.text, 
            fontSize: fontSizes.heading,
            fontFamily: FONT_CONFIG.bold 
          }
        ]}>
          {title}
        </Text>
      </View>
      <Text style={[
        styles.sectionContent, 
        { 
          color: theme.text, 
          fontSize: fontSizes.body,
          fontFamily: FONT_CONFIG.regular
        }
      ]}>
        {content}
      </Text>
    </View>
  );

  const renderOrganizationCard = (level, name, count, icon, gradientColors = GRADIENTS.primary) => (
    <View style={[styles.orgCard, { backgroundColor: theme.surface }]}>
      <View style={styles.orgHeader}>
        <LinearGradient
          colors={gradientColors}
          style={styles.orgIcon}
        >
          {icon}
        </LinearGradient>
        <View style={[styles.orgLevel, { backgroundColor: COLORS.primary[100] }]}>
          <Text style={[styles.orgLevelText, { color: COLORS.primary[600], fontFamily: FONT_CONFIG.medium }]}>
            {level}
          </Text>
        </View>
      </View>
      <Text style={[
        styles.orgName, 
        { 
          color: theme.text, 
          fontSize: fontSizes.subheading,
          fontFamily: FONT_CONFIG.medium 
        }
      ]}>
        {name}
      </Text>
      {count && (
        <Text style={[styles.orgCount, { color: theme.secondary, fontFamily: FONT_CONFIG.regular }]}>
          {count}
        </Text>
      )}
    </View>
  );

  const renderPositionCard = (title, description, rank) => (
    <View style={[styles.positionCard, { backgroundColor: theme.surface }]}>
      <View style={styles.positionHeader}>
        <Text style={[
          styles.positionTitle, 
          { 
            color: theme.text, 
            fontSize: fontSizes.subheading,
            fontFamily: FONT_CONFIG.medium
          }
        ]}>
          {title}
        </Text>
        <View style={[styles.rankBadge, { backgroundColor: COLORS.secondary[100] }]}>
          <Text style={[styles.rankText, { color: COLORS.secondary[700], fontFamily: FONT_CONFIG.medium }]}>
            {rank}
          </Text>
        </View>
      </View>
      <Text style={[
        styles.positionDesc, 
        { 
          color: theme.secondary, 
          fontSize: fontSizes.body,
          fontFamily: FONT_CONFIG.regular 
        }
      ]}>
        {description}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar 
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} 
      />
      
      {/* Header */}
      <View className="py-4 px-4 bg-white relative">
        {/* Nút Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute left-4 top-1/2 -translate-y-2 p-2 rounded-full bg-gray-100 z-10"
          style={{
            top: '80%',
            transform: [{ translateY: -12 }],
          }}
        >
          <ChevronLeft size={20} color="#000" />
        </TouchableOpacity>

        {/* Tiêu đề ở giữa */}
        <Text
          className="text-xl font-sf-bold text-black text-center"
          numberOfLines={1}
        >
          Tin tức
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

      
      <ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onTouchStart={showControlsAgain}
      >
        {/* Article Header */}
        <View style={styles.articleHeader}>
          <View style={styles.categoryBadge}>
            <Scale size={14} color={COLORS.primary[500]} />
            <Text style={[styles.categoryText, { fontFamily: FONT_CONFIG.medium }]}>
              Tổ chức và chức năng
            </Text>
          </View>
          
          <Text style={[
            styles.articleTitle, 
            { 
              color: theme.text, 
              fontSize: fontSizes.title,
              fontFamily: FONT_CONFIG.black
            }
          ]}>
            Vị trí, chức năng, nhiệm vụ của Viện kiểm sát nhân dân
          </Text>
          
          <Text style={[
            styles.articleSubtitle, 
            { 
              color: theme.secondary, 
              fontSize: fontSizes.body,
              fontFamily: FONT_CONFIG.regular
            }
          ]}>
            Hệ thống cơ quan nhà nước độc lập thực hành quyền công tố và kiểm sát hoạt động tư pháp
          </Text>
        </View>

        {renderArticleMeta()}

        {/* Historical Note */}
        <View style={[styles.historicalNote, { backgroundColor: COLORS.primary[50] }]}>
          <View style={styles.historicalHeader}>
            <Calendar size={20} color={COLORS.primary[600]} />
            <Text style={[
              styles.historicalTitle, 
              { 
                color: COLORS.primary[800],
                fontFamily: FONT_CONFIG.bold
              }
            ]}>
              Mốc lịch sử quan trọng
            </Text>
          </View>
          <Text style={[
            styles.historicalText, 
            { 
              color: COLORS.primary[700], 
              fontSize: fontSizes.body,
              fontFamily: FONT_CONFIG.regular
            }
          ]}>
            Ngày 26/7/1960, Chủ tịch Hồ Chí Minh ký Lệnh số 20-LCT công bố Luật Tổ chức Viện kiểm sát nhân dân và ngày này cũng chính là ngày thành lập Viện kiểm sát nhân dân.
          </Text>
        </View>

        {/* 1. Vị trí, tổ chức */}
        {renderSection(
          "1. Vị trí, tổ chức", 
          "Theo quy định của Hiến pháp Việt Nam hiện hành và Luật Tổ chức Viện kiểm sát nhân dân năm 2014 (sửa đổi, bổ sung năm 2025), Viện kiểm sát nhân dân là một hệ thống cơ quan nhà nước độc lập trong cơ cấu tổ chức bộ máy của các cơ quan nhà nước.",
          <Building size={20} color={COLORS.primary[500]} />,
          true
        )}

        {/* Cơ cấu tổ chức */}
        <View style={styles.organizationSection}>
          <Text style={[
            styles.orgSectionTitle, 
            { 
              color: theme.text, 
              fontSize: fontSizes.heading,
              fontFamily: FONT_CONFIG.bold
            }
          ]}>
            Cơ cấu tổ chức theo ngành dọc (3 cấp)
          </Text>
          
          <View style={styles.orgGrid}>
            {renderOrganizationCard(
              "Cấp 1", 
              "Viện kiểm sát nhân dân tối cao",
              "1 Viện",
              <Shield size={18} color="#FFFFFF" />,
              GRADIENTS.primary
            )}
            
            {renderOrganizationCard(
              "Cấp 2", 
              "Viện kiểm sát nhân dân tỉnh, thành phố trực thuộc Trung ương",
              "34 Viện",
              <MapPin size={18} color="#FFFFFF" />,
              GRADIENTS.secondary
            )}
            
            {renderOrganizationCard(
              "Cấp 3", 
              "Viện kiểm sát nhân dân khu vực",
              "355 Viện",
              <Users size={18} color="#FFFFFF" />,
              GRADIENTS.reading
            )}
          </View>
        </View>

        {/* Hệ thống Viện kiểm sát quân sự */}
        {renderSection(
          "Hệ thống Viện kiểm sát quân sự", 
          "Trong hệ thống Viện kiểm sát nhân dân có các Viện kiểm sát quân sự, bao gồm: Viện kiểm sát quân sự Trung ương; Viện kiểm sát quân sự quân khu và tương đương; Viện kiểm sát quân sự khu vực.",
          <Award size={20} color={COLORS.secondary[500]} />
        )}

        {/* Viện trưởng VKSNDTC */}
        <View style={[styles.leadershipSection, { backgroundColor: theme.surface }]}>
          <Text style={[
            styles.leaderTitle, 
            { 
              color: theme.text, 
              fontSize: fontSizes.heading,
              fontFamily: FONT_CONFIG.bold
            }
          ]}>
            Viện trưởng Viện kiểm sát nhân dân tối cao
          </Text>
          
          <View style={styles.leadershipDetails}>
            <View style={styles.leaderDetail}>
              <UserCheck size={16} color={COLORS.primary[500]} />
              <Text style={[
                styles.leaderText, 
                { 
                  color: theme.text, 
                  fontSize: fontSizes.body,
                  fontFamily: FONT_CONFIG.regular
                }
              ]}>
                Do Quốc hội bầu, miễn nhiệm, bãi nhiệm theo đề nghị của Chủ tịch nước
              </Text>
            </View>
            
            <View style={styles.leaderDetail}>
              <Clock size={16} color={COLORS.primary[500]} />
              <Text style={[
                styles.leaderText, 
                { 
                  color: theme.text, 
                  fontSize: fontSizes.body,
                  fontFamily: FONT_CONFIG.regular
                }
              ]}>
                Nhiệm kỳ theo nhiệm kỳ của Quốc hội
              </Text>
            </View>
            
            <View style={styles.leaderDetail}>
              <Award size={16} color={COLORS.primary[500]} />
              <Text style={[
                styles.leaderText, 
                { 
                  color: theme.text, 
                  fontSize: fontSizes.body,
                  fontFamily: FONT_CONFIG.regular
                }
              ]}>
                Tiếp tục làm nhiệm vụ cho đến khi Quốc hội khoá mới bầu ra người kế nhiệm
              </Text>
            </View>
          </View>
        </View>

        {/* Phó Viện trưởng */}
        {renderSection(
          "Phó Viện trưởng Viện kiểm sát nhân dân tối cao", 
          "Do Chủ tịch nước bổ nhiệm, miễn nhiệm, cách chức theo đề nghị của Viện trưởng Viện kiểm sát nhân dân tối cao. Nhiệm kỳ của Phó Viện trưởng là 05 năm, kể từ ngày được bổ nhiệm.",
          <UserCheck size={20} color={COLORS.accent.indigo} />
        )}

        {/* 2. Chức năng, nhiệm vụ */}
        {renderSection(
          "2. Chức năng, nhiệm vụ của Viện kiểm sát nhân dân", 
          "Viện kiểm sát nhân dân là cơ quan thực hành quyền công tố, kiểm sát hoạt động tư pháp của nước Cộng hòa xã hội chủ nghĩa Việt Nam.",
          <Scale size={20} color={COLORS.primary[500]} />,
          true
        )}

        {/* Nhiệm vụ bảo vệ */}
        <View style={[styles.missionSection, { backgroundColor: theme.surface }]}>
          <Text style={[
            styles.missionTitle, 
            { 
              color: theme.text, 
              fontSize: fontSizes.heading,
              fontFamily: FONT_CONFIG.bold
            }
          ]}>
            Nhiệm vụ bảo vệ
          </Text>
          
          <View style={styles.missionList}>
            <View style={styles.missionItem}>
              <LinearGradient
                colors={GRADIENTS.primary}
                style={styles.missionIcon}
              >
                <BookOpen size={16} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[
                styles.missionText, 
                { 
                  color: theme.text, 
                  fontSize: fontSizes.body,
                  fontFamily: FONT_CONFIG.medium
                }
              ]}>
                Bảo vệ Hiến pháp và pháp luật
              </Text>
            </View>
            
            <View style={styles.missionItem}>
              <LinearGradient
                colors={GRADIENTS.secondary}
                style={styles.missionIcon}
              >
                <Users size={16} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[
                styles.missionText, 
                { 
                  color: theme.text, 
                  fontSize: fontSizes.body,
                  fontFamily: FONT_CONFIG.medium
                }
              ]}>
                Bảo vệ quyền con người, quyền công dân
              </Text>
            </View>
            
            <View style={styles.missionItem}>
              <View style={[styles.missionIcon, { backgroundColor: COLORS.accent.rose }]}>
                <Shield size={16} color="#FFFFFF" />
              </View>
              <Text style={[
                styles.missionText, 
                { 
                  color: theme.text, 
                  fontSize: fontSizes.body,
                  fontFamily: FONT_CONFIG.medium
                }
              ]}>
                Bảo vệ chế độ xã hội chủ nghĩa
              </Text>
            </View>
            
            <View style={styles.missionItem}>
              <View style={[styles.missionIcon, { backgroundColor: COLORS.accent.amber }]}>
                <Building size={16} color="#FFFFFF" />
              </View>
              <Text style={[
                styles.missionText, 
                { 
                  color: theme.text, 
                  fontSize: fontSizes.body,
                  fontFamily: FONT_CONFIG.medium
                }
              ]}>
                Bảo vệ lợi ích của Nhà nước
              </Text>
            </View>
            
            <View style={styles.missionItem}>
              <View style={[styles.missionIcon, { backgroundColor: COLORS.accent.purple }]}>
                <Heart size={16} color="#FFFFFF" />
              </View>
              <Text style={[
                styles.missionText, 
                { 
                  color: theme.text, 
                  fontSize: fontSizes.body,
                  fontFamily: FONT_CONFIG.medium
                }
              ]}>
                Bảo vệ quyền và lợi ích hợp pháp của tổ chức, cá nhân
              </Text>
            </View>
          </View>
          
          <Text style={[
            styles.missionGoal, 
            { 
              color: theme.secondary, 
              fontSize: fontSizes.body,
              fontFamily: FONT_CONFIG.regular
            }
          ]}>
            Góp phần bảo đảm pháp luật được chấp hành nghiêm chỉnh và thống nhất.
          </Text>
        </View>

        {/* 3. Các chức danh tư pháp */}
        {renderSection(
          "3. Các chức danh tư pháp trong Viện kiểm sát nhân dân", 
          "",
          <Briefcase size={20} color={COLORS.primary[500]} />,
          true
        )}

        {/* Danh sách chức danh */}
        <View style={styles.positionsSection}>
          {renderPositionCard(
            "Viện trưởng, Phó Viện trưởng",
            "Viện kiểm sát nhân dân, Viện kiểm sát quân sự các cấp",
            "Lãnh đạo"
          )}
          
          {renderPositionCard(
            "Kiểm sát viên",
            "4 ngạch: Kiểm sát viên VKSNDTC, Kiểm sát viên cao cấp, trung cấp, sơ cấp",
            "4 ngạch"
          )}
          
          {renderPositionCard(
            "Thủ trưởng, Phó Thủ trưởng",
            "Cơ quan điều tra thuộc Viện kiểm sát",
            "Điều tra"
          )}
          
          {renderPositionCard(
            "Điều tra viên",
            "3 ngạch: Điều tra viên cao cấp, trung cấp, sơ cấp",
            "3 ngạch"
          )}
          
          {renderPositionCard(
            "Kiểm tra viên",
            "3 ngạch: Kiểm tra viên cao cấp, chính, kiểm tra viên",
            "3 ngạch"
          )}
        </View>

      </ScrollView>
      
      {renderFloatingControls()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.neutral[200],
    elevation: 4,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  progressContainer: {
    height: 3,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  progressBackground: {
    height: 3,
    borderRadius: 1.5,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  articleHeader: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary[100],
    borderRadius: 16,
    marginBottom: 16,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.primary[700],
    fontWeight: '600',
  },
  articleTitle: {
    lineHeight: 32,
    marginBottom: 12,
  },
  articleSubtitle: {
    lineHeight: 24,
    opacity: 0.8,
  },
  articleMeta: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  readingStats: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  historicalNote: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary[200],
  },
  historicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  historicalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  historicalText: {
    lineHeight: 22,
    fontStyle: 'italic',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    flex: 1,
  },
  sectionContent: {
    lineHeight: 26,
    textAlign: 'justify',
  },
  organizationSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  orgSectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  orgGrid: {
    gap: 12,
  },
  orgCard: {
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orgIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgLevel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  orgLevelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orgName: {
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 22,
  },
  orgCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  leadershipSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  leaderTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  leadershipDetails: {
    gap: 16,
  },
  leaderDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  leaderText: {
    flex: 1,
    lineHeight: 22,
  },
  missionSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  missionTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  missionList: {
    gap: 16,
    marginBottom: 16,
  },
  missionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  missionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionText: {
    flex: 1,
    fontWeight: '500',
    lineHeight: 22,
  },
  missionGoal: {
    fontStyle: 'italic',
    lineHeight: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
  },
  positionsSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  positionCard: {
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  positionTitle: {
    fontWeight: '600',
    flex: 1,
  },
  rankBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '600',
  },
  positionDesc: {
    lineHeight: 20,
  },
  floatingControls: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    gap: 12,
  },
  floatingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  articleFooter: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  footerStats: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  reactionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});