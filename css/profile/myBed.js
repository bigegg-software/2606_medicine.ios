import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor, padding: 20 },
  back: { marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: AppTheme.textPrimary, marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: AppTheme.borderColor },
  label: { fontSize: 14, color: AppTheme.textSecondary, marginTop: 12 },
  value: { fontSize: 18, fontWeight: '600', color: AppTheme.textPrimary, marginTop: 4 },
});

export default styles;
