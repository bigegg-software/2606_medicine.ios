import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateText: { fontSize: 18, fontWeight: '600', color: AppTheme.textPrimary },
  cardWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  typeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

export default styles;
