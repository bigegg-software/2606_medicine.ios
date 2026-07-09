export const AppTheme = {
  primaryColor: '#6D925E',
  onPrimaryColor: '#FFFFFF',
  accentColor: '#D4A24C',
  backgroundColor: '#F5F8FF',
  textPrimary: '#333333',
  textSecondary: '#999999',
  borderColor: '#E8DED2',
  inputBorderColor: '#E8DED2',
  hintTextColor: '#BFAA98',
  dangerColor: '#C45C4B',
  radiusLarge: 20,
  radiusMedium: 16,
  borderRgbColor: 'rgba(5,58,147,0.06)',
} as const;

export const primaryShadow = (opacity = 0.2) => ({
  shadowColor: AppTheme.primaryColor,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: opacity,
  shadowRadius: 16,
  elevation: 8,
});

export const logoShadow = () => ({
  shadowColor: AppTheme.primaryColor,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.3,
  shadowRadius: 20,
  elevation: 10,
});
