export const COLORS = {
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
  }
};

export const GRADIENTS = {
  primary: [COLORS.primary[400], COLORS.primary[600], COLORS.primary[700]],
  secondary: [COLORS.secondary[400], COLORS.secondary[600]],
  news: ['#667EEA', '#764BA2'],
  reading: [COLORS.accent.purple, '#7C3AED'],
  guest: [COLORS.neutral[400], COLORS.neutral[500]],
  update: ['#667EEA', '#764BA2'],
};
