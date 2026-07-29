import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  pageBody: { flex: 1 },
  scrollFlex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerShareBtn: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerShareIcon: {
    width: 24,
    height: 24,
  },
  scroll: { paddingBottom: 24 },
  scrollNoFooter: { paddingBottom: 40 },

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
  categoryTag: {
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
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#6D925E',
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 3,
  },
  statusTagText: {
    fontWeight: '500',
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
  metaProgressTrack: {
    width: 90,
    height: 5,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  metaProgressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: AppTheme.primaryColor,
  },
  metaRemainLabel: {
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 13,
    color: '#000000',
  },
  metaRemainValue: {
    marginLeft: 4,
    fontWeight: 'bold',
    fontSize: 15,
    color: '#6D925E',
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
    color: '#333333',
  },

  body: {
    paddingHorizontal: 15,
    paddingTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppTheme.textPrimary,
  },
  titleStatusTag: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleStatusTagText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  signupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(109,146,94,0.12)',
  },
  signupBadgePending: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  signupBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6D925E',
  },
  signupBadgeTextPending: {
    color: '#999999',
  },

  infoCard: {
    marginTop: 0,
  },
  infoRow: {
    marginTop: 12,
    height: 24,
  },
  infoIcon: {
    width: 15,
    height: 15,
    marginRight: 6,
  },
  infoText: {
    flex: 1,
    fontWeight: '500',
    fontSize: 14,
    color: '#666666',
  },
  infoArrow: {
    width: 5,
    height: 9,
  },

  noticeBox: {
    marginTop: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(254,248,225,0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(238,156,68,0.3)',
  },
  noticeIcon: {
    width: 15,
    height: 15,
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 13,
    color: '#C98A41',
    lineHeight: 20,
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
  sectionSubBlock: {
    marginTop: 12,
  },
  sectionSubTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    color: AppTheme.textPrimary,
    lineHeight: 22,
  },
  detailLine: {
    fontSize: 14,
    color: AppTheme.textPrimary,
    lineHeight: 22,
    marginTop: 6,
  },

  signupStatRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  signupStat: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6D925E',
    lineHeight: 28,
  },
  signupStatUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999999',
    marginBottom: 3,
    marginLeft: 4,
  },
  progressTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(109,146,94,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#6D925E',
  },
  signupMeta: {
    marginTop: 8,
    fontSize: 13,
    color: '#999999',
    lineHeight: 20,
  },
  signupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  signupStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(109,146,94,0.12)',
  },
  signupStatusPillPending: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  signupStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6D925E',
  },
  signupStatusTextPending: {
    color: '#999999',
  },

  organizerCard: {
    marginTop: 20,
    minHeight: 60,
    paddingHorizontal: 15,
    paddingVertical: 13,
    backgroundColor: '#F6F8FB',
    borderRadius: 8,
  },
  organizerInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
    justifyContent: 'center',
  },
  organizerName: {
    fontWeight: '500',
    fontSize: 14,
    color: '#333333',
  },
  organizerPhone: {
    marginTop: 8,
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
  },
  organizerPhoneBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  organizerPhoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontWeight: '600',
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
