import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { padding: 16 },
  body: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 22, fontWeight: '700', color: AppTheme.textPrimary, marginBottom: 16 },
  row: { marginBottom: 14 },
  label: { fontSize: 14, color: AppTheme.textSecondary, marginBottom: 4 },
  value: { fontSize: 16, color: AppTheme.textPrimary, lineHeight: 22 },
  attachSection: { marginTop: 8 },
  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  attachName: { flex: 1, fontSize: 15, color: AppTheme.primaryColor },
  deleteBtn: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppTheme.dangerColor,
    alignItems: 'center',
  },
  deleteText: { color: AppTheme.dangerColor, fontWeight: '600' },
});

export default styles;
