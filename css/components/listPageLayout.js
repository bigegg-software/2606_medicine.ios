import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: AppTheme.textPrimary },
  action: { color: AppTheme.primaryColor, fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  empty: { textAlign: 'center', color: AppTheme.textSecondary, marginTop: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppTheme.borderColor,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 17, fontWeight: '600', color: AppTheme.textPrimary },
  cardSub: { fontSize: 14, color: AppTheme.textSecondary, marginTop: 4 },
  delete: { color: AppTheme.dangerColor },
});

export default styles;
