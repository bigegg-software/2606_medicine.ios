import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  logoSection: { flex: 3, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  logoBox: {
    width: 112,
    height: 112,
    borderRadius: 28,
    backgroundColor: AppTheme.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 36, fontWeight: '700', letterSpacing: 2, color: AppTheme.textPrimary, marginTop: 24 },
  subtitle: { fontSize: 20, color: AppTheme.textSecondary, marginTop: 12 },
  featuresRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 32, paddingVertical: 20 },
  featureItem: { alignItems: 'center' },
  featureIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: `${AppTheme.primaryColor}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { fontSize: 16, fontWeight: '500', color: AppTheme.textPrimary, marginTop: 8 },
  actions: { paddingHorizontal: 32 },
  primaryBtn: {
    height: 64,
    backgroundColor: AppTheme.primaryColor,
    borderRadius: AppTheme.radiusLarge,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryBtnText: { fontSize: 20, fontWeight: '600', color: AppTheme.onPrimaryColor },
  outlineBtn: {
    height: 64,
    borderRadius: AppTheme.radiusLarge,
    borderWidth: 2,
    borderColor: AppTheme.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: { fontSize: 20, fontWeight: '700', color: AppTheme.primaryColor },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: AppTheme.borderColor },
  dividerText: { marginHorizontal: 16, fontSize: 16, color: AppTheme.textSecondary },
  wechatWrap: { alignItems: 'center' },
  wechatBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#07C160',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wechatLabel: { fontSize: 14, color: AppTheme.textSecondary, marginTop: 8 },
  terms: { textAlign: 'center', fontSize: 14, color: AppTheme.textSecondary, padding: 20 },
  link: { color: AppTheme.primaryColor, fontWeight: '600' },
});

export default styles;
