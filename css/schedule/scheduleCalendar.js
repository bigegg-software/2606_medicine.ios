import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: AppTheme.textPrimary },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
  monthText: { fontSize: 18, fontWeight: '600' },
  weekHead: { flexDirection: 'row', paddingHorizontal: 12 },
  weekCell: { flex: 1, textAlign: 'center', color: AppTheme.textSecondary, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 16, color: AppTheme.textPrimary },
  dot: { marginTop: 2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: AppTheme.primaryColor, alignItems: 'center', justifyContent: 'center' },
  dotText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

export default styles;
