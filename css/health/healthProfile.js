import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  back: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', paddingHorizontal: 20, color: AppTheme.textPrimary },
  body: { padding: 20 },
  row: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: AppTheme.borderColor },
  label: { fontSize: 14, color: AppTheme.textSecondary },
  value: { fontSize: 17, fontWeight: '600', color: AppTheme.textPrimary, marginTop: 4 },
});

export default styles;
