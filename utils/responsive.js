// utils/responsive.js
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Base scaling functions
export const scaleSize = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
export const scaleFont = (size) => PixelRatio.roundToNearestPixel(scaleSize(size));
export const vw = (percent) => (SCREEN_WIDTH * percent) / 100;
export const vh = (percent) => (SCREEN_HEIGHT * percent) / 100;
export const spacing = (size) => scaleSize(size);

// Device detection
export const isSmallDevice = SCREEN_WIDTH < 360;
export const isTablet = SCREEN_WIDTH >= 768;
export const isLargeTablet = SCREEN_WIDTH >= 1024;
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Orientation
export const isPortrait = SCREEN_HEIGHT > SCREEN_WIDTH;
export const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;

export { SCREEN_WIDTH, SCREEN_HEIGHT };

// ============= MỞ RỘNG =============

/**
 * Responsive font sizes - tự động scale theo device
 */
export const rf = {
  xs: scaleFont(isTablet ? 10 : 10),
  sm: scaleFont(isTablet ? 11 : 11),
  base: scaleFont(isTablet ? 13 : 13),
  md: scaleFont(isTablet ? 14 : 14),
  lg: scaleFont(isTablet ? 15 : 15),
  xl: scaleFont(isTablet ? 17 : 17),
  '2xl': scaleFont(isTablet ? 19 : 20),
  '3xl': scaleFont(isTablet ? 22 : 24),
  '4xl': scaleFont(isTablet ? 26 : 28),
};

/**
 * Responsive spacing - padding, margin, gap
 */
export const rs = {
  xs: spacing(isTablet ? 2 : 2),
  sm: spacing(isTablet ? 4 : 4),
  md: spacing(isTablet ? 6 : 6),
  lg: spacing(isTablet ? 8 : 8),
  xl: spacing(isTablet ? 12 : 12),
  '2xl': spacing(isTablet ? 16 : 16),
  '3xl': spacing(isTablet ? 20 : 20),
  '4xl': spacing(isTablet ? 24 : 24),
};

/**
 * Responsive icon sizes
 */
export const ri = {
  sm: scaleSize(isTablet ? 16 : 16),
  md: scaleSize(isTablet ? 20 : 20),
  lg: scaleSize(isTablet ? 24 : 24),
  xl: scaleSize(isTablet ? 28 : 28),
};

/**
 * Responsive image/component sizes
 */
export const rc = {
  // Header logo
  headerLogo: scaleSize(isTablet ? 45 : 40),
  
  // News thumbnails
  newsThumbnail: scaleSize(isTablet ? 90 : 80),
  
  // Article cards
  articleHeight: scaleSize(isTablet ? 110 : 90),
  
  // Border radius
  radiusSm: scaleSize(isTablet ? 6 : 6),
  radiusMd: scaleSize(isTablet ? 8 : 8),
  radiusLg: scaleSize(isTablet ? 10 : 10),
  radiusXl: scaleSize(isTablet ? 12 : 12),
};

/**
 * Grid columns theo device
 */
export const columns = {
  articles: isLargeTablet ? 4 : isTablet ? 3 : 2,
  categories: isTablet ? 1 : 1,
};

/**
 * Container padding theo device
 */
export const containerPadding = isTablet ? rs['3xl'] : rs['2xl'];

/**
 * Helper function: Chọn giá trị theo device type
 * Usage: rValue(phoneValue, tabletValue, largeTabletValue)
 */
export const rValue = (phone, tablet = phone, largeTablet = tablet) => {
  if (isLargeTablet) return largeTablet;
  if (isTablet) return tablet;
  return phone;
};

/**
 * Helper function: Tạo responsive style object
 * Usage: rStyle({ fontSize: rf.base, padding: rs.md })
 */
export const rStyle = (styles) => {
  return Object.keys(styles).reduce((acc, key) => {
    acc[key] = styles[key];
    return acc;
  }, {});
};

/**
 * Tailwind-like className helper
 * Usage: tw('text-sm', isTablet && 'md:text-base')
 */
export const tw = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Responsive value with breakpoints
 * Usage: breakpoint({ phone: 12, tablet: 16, largeTablet: 20 })
 */
export const breakpoint = (values) => {
  if (typeof values !== 'object') return values;
  
  if (isLargeTablet && values.largeTablet !== undefined) {
    return values.largeTablet;
  }
  if (isTablet && values.tablet !== undefined) {
    return values.tablet;
  }
  return values.phone || values.default || 0;
};

/**
 * Quick responsive helpers
 */
export const r = {
  // Font
  f: rf,
  
  // Spacing
  s: rs,
  
  // Icon
  i: ri,
  
  // Component
  c: rc,
  
  // Columns
  col: columns,
  
  // Device checks
  isPhone: !isTablet,
  isTablet,
  isLargeTablet,
  isSmall: isSmallDevice,
  
  // Quick value picker
  v: rValue,
  
  // Breakpoint
  bp: breakpoint,
};