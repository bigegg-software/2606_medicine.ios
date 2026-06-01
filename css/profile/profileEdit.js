import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: AppTheme.textPrimary },
  body: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: AppTheme.textPrimary },
  input: {
    borderWidth: 2,
    borderColor: AppTheme.borderColor,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: AppTheme.borderColor,
    backgroundColor: '#fff',
  },
  chipActive: { borderColor: AppTheme.primaryColor, backgroundColor: '#FFF8F0' },
  chipText: { fontSize: 16, color: AppTheme.textSecondary },
  chipTextActive: { color: AppTheme.primaryColor, fontWeight: '600' },
  btn: { height: 56, backgroundColor: AppTheme.primaryColor, borderRadius: AppTheme.radiusLarge, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});

export default styles;
