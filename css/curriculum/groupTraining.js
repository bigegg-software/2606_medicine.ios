import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  tabPage: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 12,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  calendarBox: {
    marginTop: 18,
    height: 72,
    paddingHorizontal: 13,
  },
  calendarCol: {
    width: 38,
    height: '100%',
    borderRadius: 25,
    backgroundColor: 'transparent',
  },
  calendarColActive: {
    backgroundColor: 'rgba(109,146,94,0.12)',
  },
  calendarTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  calendarTitleActive: {
    fontWeight: 'bold',
    fontSize: 13,
    color: AppTheme.primaryColor,
    marginTop: 8,
    textAlign: 'center',
  },
  calendarSubtitle: {
    fontWeight: '500',
    fontSize: 18,
    marginTop: 4,
    color: AppTheme.textPrimary,
    textAlign: 'center',
  },
  calendarSubtitleActive: {
    fontWeight: '500',
    fontSize: 18,
    marginTop: 4,
    color: AppTheme.primaryColor,
    textAlign: 'center',
  },
  calendarDotWrap: {
    marginTop: 2,
    minHeight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarImage: {
    width: 22,
    height: 22,
    marginTop: 5,
    alignSelf: 'center',
  },
  filterRow: {
    marginTop: 19,
    alignItems: 'center',
  },
  filterChipRow: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    shadowColor: '#EAEAEA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 2,
  },
  filterChipText: {
    fontWeight: '500',
    fontSize: 14,
    color: '#333333',
  },
  filterChipIcon: {
    width: 9,
    height: 4,
    marginLeft: 5,
  },
  myBookingIcon: {
    width: 8,
    height: 16,
    marginLeft: 4,
  },
  myBookingText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#6D925E',
  },
  nextTrainBox: {
    marginTop: 13,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: 'rgba(109,146,94,0.1)',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(109,146,94,0.16)',
  },
  nextTrainLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  nextTrainTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333333',
  },
  nextTrainMeta: {
    marginTop: 6,
    fontWeight: '500',
    fontSize: 14,
    color: '#666666',
  },
  nextTrainBtn: {
    paddingHorizontal: 19,
    paddingVertical: 8,
    backgroundColor: AppTheme.primaryColor,
    borderRadius: 27,
  },
  nextTrainBtnText: {
    fontWeight: '500',
    fontSize: 14,
    color: '#FFFFFF',
  },
  imgBackground: {
    marginTop: 19,
    padding: 16,
    borderRadius: 13,
    overflow: 'hidden',
  },
  imgBackgroundImage: {
    borderRadius: 13,
  },
  groupBannerTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#333333',
  },
  groupBannerDesc: {
    marginTop: 6,
    fontWeight: '400',
    fontSize: 14,
    color: '#666666',
    lineHeight: 21,
  },
  classCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    shadowColor: '#EAEAEA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
  },
  classCover: {
    width: '100%',
    height: 107,
  },
  classBody: {
    padding: 16,
  },
  classTitleRow: {
    alignItems: 'center',
  },
  classTitle: {
    minWidth: 0,
    marginRight: 8,
    fontWeight: 'bold',
    fontSize: 17,
    color: '#333333',
  },
  classTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingHorizontal: 4,
    paddingVertical: 5,
    backgroundColor: '#6D925E',
    borderRadius: 4,
  },
  classTagIcon: {
    width: 11,
    height: 11,
    marginRight: 4,
  },
  classTagText: {
    fontWeight: '500',
    fontSize: 11,
    color: '#FFFFFF',
  },
  classMetaRow: {
    marginTop: 9,
    alignItems: 'center',
  },
  classMetaLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    fontWeight: '500',
    fontSize: 14,
    color: '#999999',
  },
  classMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  classMetaIcon: {
    width: 13,
    height: 13,
    marginRight: 5,
  },
  classMetaRightText: {
    fontWeight: '500',
    fontSize: 14,
    color: '#999999',
  },
  classDashWrap: {
    marginTop: 16,
    height: 1,
    overflow: 'hidden',
  },
  classDash: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(23,63,125,0.08)',
    marginTop: -1,
  },
  classBottomRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  classBottomLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  classTime: {
    fontWeight: '500',
    fontSize: 14,
    color: '#6D925E',
  },
  classBenefitRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  classBenefitIcon: {
    width: 13,
    height: 13,
    marginRight: 4,
  },
  classBenefitText: {
    fontWeight: '500',
    fontSize: 14,
    color: '#666666',
  },
  classBookBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#6D925E',
    backgroundColor: '#FFFFFF',
  },
  classBookBtnText: {
    fontWeight: '500',
    fontSize: 14,
    color: '#6D925E',
  },
  planListFooter: {
    marginTop: 19,
    gap: 13,
  },
  planListFooterLine: {
    width: 26,
    height: 1,
    backgroundColor: '#999999',
    opacity: 0.4,
  },
  planListFooterText: {
    fontWeight: '400',
    fontSize: 13,
    color: '#999999',
  },
});

export default styles;
