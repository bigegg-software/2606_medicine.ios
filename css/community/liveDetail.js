import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  pageBody: { flex: 1 },
  scrollFlex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 24 },
  scrollNoFooter: { paddingBottom: 40 },
  headerShareBtn: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerShareIcon: {
    width: 24,
    height: 24,
  },
  headerReserveBadge: {
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#F6F8FB',
    borderRadius: 6,
  },
  headerReserveIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
  },
  headerReserveText: {
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
  },
  headerReserveCount: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#333333',
  },

  heroWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroTagRow: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  statusTagIcon: {
    width: 12,
    height: 12,
    marginRight: 2,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 3,
  },
  statusTagText: {
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  categoryTag: {
    height: 22,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    borderRadius: 4,
  },
  categoryText: {
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
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
    flexShrink: 1,
  },
  metaSchedule: {
    fontWeight: '500',
    fontSize: 13,
    color: '#333333',
    flexShrink: 1,
  },
  metaDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 6,
    backgroundColor: 'rgba(51,51,51,0.5)',
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

  body: {
    paddingHorizontal: 15,
    paddingTop: 16,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 'bold',
    color: AppTheme.textPrimary,
  },
  watchCard: {
    marginTop: 12,
    backgroundColor: '#F6F8FB',
    borderRadius: 6,
    padding: 15,
  },
  watchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchMethodLabel: {
    flexShrink: 0,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
  },
  watchMethodText: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
  },
  watchBtn: {
    flexShrink: 0,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#6D925E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchBtnText: {
    fontWeight: '600',
    fontSize: 13,
    color: '#FFFFFF',
  },
  watchLinkBox: {
    marginTop: 12,
    minHeight: 56,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchLinkText: {
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 18,
    color: '#6D925E',
    textAlign: 'center',
  },
  watchCopyBtn: {
    marginTop: 8,
    alignSelf: 'center',
  },
  watchCopyText: {
    fontWeight: '500',
    fontSize: 13,
    color: '#6D925E',
    textAlign: 'center',
  },
  infoText: {
    marginTop: 10,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 22,
    color: '#666666',
  },

  sectionTitleRow: {
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitleBar: {
    width: 4,
    height: 15,
    marginRight: 6,
    backgroundColor: '#6D925E',
    borderRadius: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppTheme.textPrimary,
  },
  detailText: {
    fontSize: 14,
    color: AppTheme.textPrimary,
    lineHeight: 22,
  },
  detailHtml: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  detailBlock: {
    marginTop: 12,
  },

  bottomBar: {
    width: '100%',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 40,
    backgroundColor: '#FEFEFE',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#B4C9FF',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  btn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6D925E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6D925E',
  },
  btnDisabled: {
    opacity: 0.65,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnCancelText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#6D925E',
  },
  emptyText: {
    fontSize: 14,
    color: AppTheme.textSecondary,
  },
});

export default styles;
