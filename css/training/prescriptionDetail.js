import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { padding: 16 },
  body: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: AppTheme.textPrimary },
  meta: { fontSize: 15, color: AppTheme.textSecondary, marginTop: 8 },
  section: { fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 12, color: AppTheme.textPrimary },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: AppTheme.borderColor },
  cardTitle: { fontSize: 16, fontWeight: '600', color: AppTheme.textPrimary },
  cardSub: { fontSize: 14, color: AppTheme.textSecondary, marginTop: 4 },
  empty: { color: AppTheme.textSecondary },
});

export default styles;
