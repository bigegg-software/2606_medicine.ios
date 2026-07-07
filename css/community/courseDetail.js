import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 32 },
  videoWrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  video: { width: '100%', height: '100%' },
  body: { paddingHorizontal: 18, paddingTop: 16 },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(5,58,147,0.1)',
    marginBottom: 10,
  },
  categoryText: { fontSize: 12, color: AppTheme.primaryColor, fontWeight: '500' },
  title: { fontSize: 20, fontWeight: '600', color: AppTheme.textPrimary, lineHeight: 28 },
  instructor: { marginTop: 8, fontSize: 14, color: AppTheme.textSecondary },
  intro: { marginTop: 12, fontSize: 14, color: AppTheme.textSecondary, lineHeight: 22 },
  statsRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  statText: { fontSize: 13, color: 'rgba(43,18,13,0.75)', marginRight: 16 },
  actionRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#053A93',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  actionBtn: { alignItems: 'center', justifyContent: 'center', minWidth: 72 },
  actionIcon: { width: 24, height: 24 },
  actionText: { marginTop: 6, fontSize: 13, color: AppTheme.textSecondary },
  actionTextActive: { color: AppTheme.primaryColor, fontWeight: '500' },
  sectionTitle: { marginTop: 24, fontSize: 16, fontWeight: '600', color: AppTheme.textPrimary },
  detailText: { marginTop: 10, fontSize: 14, color: AppTheme.textPrimary, lineHeight: 22 },
  emptyText: { marginTop: 40, textAlign: 'center', fontSize: 14, color: AppTheme.textSecondary },
});

export default styles;
