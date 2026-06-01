import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  back: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', paddingHorizontal: 20, color: AppTheme.textPrimary },
  link: { color: AppTheme.primaryColor, paddingHorizontal: 20, marginTop: 8, fontWeight: '600' },
  body: { padding: 20 },
  planTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, color: AppTheme.textPrimary },
  empty: { color: AppTheme.textSecondary, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: AppTheme.borderColor },
  cardTitle: { fontSize: 17, fontWeight: '700', color: AppTheme.textPrimary },
  cardSub: { fontSize: 14, color: AppTheme.textSecondary, marginTop: 4 },
  start: { color: AppTheme.primaryColor, fontWeight: '600', marginTop: 12 },
});

export default styles;
