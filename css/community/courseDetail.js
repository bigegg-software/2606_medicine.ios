import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF'},
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 32 },
  headerShareBtn: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerShareIcon: {
    width: 24,
    height: 24,
  },
  videoWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  video: { width: '100%', height: '100%' },
  body: { paddingHorizontal: 15, paddingTop: 16 },
  categoryTag: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderRadius: 4,
  },
  categoryText: {
    fontWeight: '400',
    fontSize: 12,
    color: '#FFFFFF',
  },
  metaBar: {
    height: 50,
    paddingHorizontal: 15,
    backgroundColor: '#F6F8FB',
  },
  metaLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  metaName: {
    fontWeight: '500',
    fontSize: 13,
    color: '#333333',
  },
  metaTitle: {
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
  },
  metaRight: {
    flexShrink: 0,
  },
  metaWatchIcon: {
    width: 12,
    height: 12,
  },
  metaWatchText: {
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: AppTheme.textPrimary},
  intro: { marginTop: 12, fontSize: 14, color: AppTheme.textSecondary, lineHeight: 22 },
  statsRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  statText: { fontSize: 13, color: 'rgba(43,18,13,0.75)', marginRight: 16 },
  actionRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    backgroundColor: '#F6F8FB',
    borderRadius: 12,
  },
  actionBtn: { alignItems: 'center', justifyContent: 'center', minWidth: 72 },
  actionIcon: { width: 24, height: 24 },
  actionText: {
    marginTop: 6,
    fontWeight: '500',
    fontSize: 12,
    color: '#999999',
  },
  actionTextActive: {
    color: '#6D925E',
  },
  sectionTitleRow: {
    marginTop: 12,
  },
  sectionTitleBar: {
    width: 4,
    height: 15,
    marginRight: 6,
    backgroundColor: '#6D925E',
    borderRadius: 25,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: AppTheme.textPrimary },
  detailText: { marginTop: 12, fontSize: 14, color: AppTheme.textPrimary, lineHeight: 22 },
  detailHtml: {
    marginTop: 12,
    width: '100%',
    backgroundColor: 'transparent',
  },
  emptyText: { marginTop: 40, textAlign: 'center', fontSize: 14, color: AppTheme.textSecondary },
});

export default styles;
