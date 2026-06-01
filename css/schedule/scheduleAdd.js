import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: AppTheme.textPrimary },
  body: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: AppTheme.textPrimary, marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 2,
    borderColor: AppTheme.borderColor,
    borderRadius: AppTheme.radiusMedium,
    padding: 16,
    fontSize: 18,
    backgroundColor: '#fff',
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: AppTheme.borderColor, backgroundColor: '#fff' },
  typeChipActive: { backgroundColor: AppTheme.primaryColor, borderColor: AppTheme.primaryColor },
  typeChipText: { color: AppTheme.textPrimary },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },
  btn: { marginTop: 32, height: 56, backgroundColor: AppTheme.primaryColor, borderRadius: AppTheme.radiusLarge, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});

export default styles;
