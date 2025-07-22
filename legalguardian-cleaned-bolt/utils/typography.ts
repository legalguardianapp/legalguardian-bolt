import { Platform } from 'react-native';

// Centralized typography system for consistent font styling
export const typography = {
  // Font families
  fontFamily: {
    primary: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Font sizes - responsive based on screen size
  fontSize: {
    // Headers
    headerLarge: { small: 26, medium: 30, large: 32 },
    headerMedium: { small: 20, medium: 22, large: 24 },
    headerSmall: { small: 18, medium: 19, large: 20 },
    
    // Body text
    bodyLarge: { small: 16, medium: 17, large: 18 },
    bodyMedium: { small: 14, medium: 15, large: 16 },
    bodySmall: { small: 12, medium: 13, large: 14 },
    
    // UI elements
    button: { small: 14, medium: 15, large: 16 },
    buttonLarge: { small: 18, medium: 20, large: 22 },
    caption: { small: 10, medium: 11, large: 12 },
    
    // Special cases
    appTitle: { small: 32, medium: 38, large: 42 },
    sectionTitle: { small: 26, medium: 30, large: 32 },
  },

  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 1,
    wider: 2,
  },
};

// Helper function to get responsive font size
export const getResponsiveFontSize = (
  sizeKey: keyof typeof typography.fontSize,
  screenWidth: number
): number => {
  const sizes = typography.fontSize[sizeKey];
  
  if (screenWidth < 375) return sizes.small;
  if (screenWidth >= 375 && screenWidth < 414) return sizes.medium;
  return sizes.large;
};

// Common text styles
export const textStyles = {
  // Headers
  appTitle: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wider,
    lineHeight: typography.lineHeight.tight,
  },
  
  headerLarge: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wider,
    lineHeight: typography.lineHeight.tight,
  },
  
  headerMedium: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
    lineHeight: typography.lineHeight.tight,
  },
  
  headerSmall: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
    lineHeight: typography.lineHeight.normal,
  },
  
  // Body text
  bodyLarge: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.regular,
    letterSpacing: typography.letterSpacing.normal,
    lineHeight: typography.lineHeight.normal,
  },
  
  bodyMedium: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.regular,
    letterSpacing: typography.letterSpacing.normal,
    lineHeight: typography.lineHeight.normal,
  },
  
  bodySmall: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.regular,
    letterSpacing: typography.letterSpacing.normal,
    lineHeight: typography.lineHeight.normal,
  },
  
  // UI elements
  button: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
    lineHeight: typography.lineHeight.tight,
  },
  
  buttonLarge: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
    lineHeight: typography.lineHeight.tight,
  },
  
  caption: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.wide,
    lineHeight: typography.lineHeight.normal,
  },
  
  // Special styles
  subtitle: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.normal,
    lineHeight: typography.lineHeight.normal,
  },
  
  label: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
    lineHeight: typography.lineHeight.normal,
  },
};

// Color system for text
export const textColors = {
  primary: '#FFFFFF',
  secondary: '#FFFFFF',
  accent: '#22C55E',
  error: '#FF3B30',
  warning: '#FFA500',
  success: '#22C55E',
  black: '#000000',
  muted: '#FFFFFF',
};