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
  calendarDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#6D925E',
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
    borderRadius: 20,
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
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  classTitleRow: {
    alignItems: 'center',
  },
  classTitle: {
    flex: 1,
    minWidth: 0,
    fontWeight: 'bold',
    fontSize: 17,
    color: '#333333',
  },
  classTag: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    marginRight: 6,
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
    marginTop: 11,
    alignItems: 'flex-start',
  },
  classTime: {
    flexShrink: 0,
    marginRight: 10,
    fontWeight: '500',
    fontSize: 15,
    color: '#6D925E',
  },
  classMetaCenter: {
    flex: 1,
    minWidth: 0,
    marginRight: 9,
  },
  classMetaCoach: {
    fontWeight: '500',
    fontSize: 13,
    color: '#666666',
  },
  classMetaEnroll: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  classMetaIcon: {
    width: 13,
    height: 13,
    marginRight: 5,
    flexShrink: 0,
  },
  classMetaEnrollText: {
    flex: 1,
    minWidth: 0,
    fontWeight: '500',
    fontSize: 13,
    color: '#666666',
  },
  classBookBtnWrap: {
    flexShrink: 0,
  },
  classDivider: {
    marginTop: 13,
    height: 1,
    backgroundColor: 'rgba(23,63,125,0.08)',
  },
  classBenefitRow: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  classBenefitIcon: {
    width: 13,
    height: 13,
    marginRight: 4,
    flexShrink: 0,
  },
  classBenefitText: {
    flex: 1,
    minWidth: 0,
    fontWeight: '500',
    fontSize: 13,
    color: '#666666',
  },
  classBookBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#6D925E',
    backgroundColor: '#FFFFFF',
  },
  classBookBtnText: {
    fontWeight: '500',
    fontSize: 14,
    color: '#6D925E',
  },
  classBookBtnBooked: {
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'rgba(109,146,94,0.2)',
  },
  classBookBtnBookedText: {
    color: '#6D925E',
  },
  classBookBtnDeadline: {
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: '#E4E5E7',
  },
  classBookBtnDeadlineText: {
    color: '#333333',
  },
  classBookBtnOngoing: {
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: '#6D925E',
  },
  classBookBtnOngoingText: {
    color: '#FFFFFF',
  },
  classBookBtnEnded: {
    borderWidth: 1,
    borderColor: '#FB4550',
    backgroundColor: '#FFFFFF',
  },
  classBookBtnEndedText: {
    color: '#FB4550',
  },
  classBookBtnFull: {
    borderWidth: 1,
    borderColor: '#EE9C44',
    backgroundColor: '#FFFFFF',
  },
  classBookBtnFullText: {
    color: '#EE9C44',
  },
  planListFooter: {
    marginTop: 19,
    gap: 6,
  },
  planListFooterImage: {
    width: 13,
    height: 13,
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
