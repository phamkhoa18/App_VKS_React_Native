// utils/responsive.js
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const scaleSize = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
export const scaleFont = (size) =>
  PixelRatio.roundToNearestPixel(scaleSize(size));
export const vw = (percent) => (SCREEN_WIDTH * percent) / 100;
export const vh = (percent) => (SCREEN_HEIGHT * percent) / 100;
export const spacing = (size) => scaleSize(size);
export const isSmallDevice = SCREEN_WIDTH < 360;
export const isTablet = SCREEN_WIDTH >= 768;
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export { SCREEN_WIDTH, SCREEN_HEIGHT };
