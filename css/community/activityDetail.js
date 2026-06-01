import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { padding: 16 },
  body: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '700', color: AppTheme.textPrimary, marginBottom: 16 },
  meta: { fontSize: 16, color: AppTheme.textSecondary, marginBottom: 8 },
  desc: { fontSize: 16, color: AppTheme.textPrimary, lineHeight: 24, marginTop: 16 },
  btn: { position: 'absolute', bottom: 24, left: 20, right: 20, height: 56, backgroundColor: AppTheme.primaryColor, borderRadius: AppTheme.radiusLarge, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});

export default styles;
