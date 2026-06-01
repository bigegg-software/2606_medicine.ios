import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  back: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: AppTheme.textPrimary, paddingHorizontal: 20, marginBottom: 12 },
  scroll: { padding: 20, paddingTop: 0 },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  chip: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: AppTheme.borderColor, alignItems: 'center' },
  chipLabel: { fontSize: 13, color: AppTheme.textSecondary },
  chipValue: { fontSize: 18, fontWeight: '700', color: AppTheme.textPrimary, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: AppTheme.borderColor },
  cellDisabled: { opacity: 0.65 },
  cellIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: `${AppTheme.primaryColor}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  cellLabel: { fontSize: 15, fontWeight: '600', color: AppTheme.textPrimary },
  soon: { fontSize: 11, color: AppTheme.textSecondary, marginTop: 4 },
  section: { fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 12, color: AppTheme.textPrimary },
  listRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: AppTheme.borderColor },
  listLabel: { flex: 1, fontSize: 16, color: AppTheme.textPrimary },
});

export default styles;
