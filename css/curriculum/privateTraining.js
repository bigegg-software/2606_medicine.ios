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
  nextTrainIcon: {
    width: 43,
    height: 43,
    flexShrink: 0,
  },
  nextTrainInfo: {
    marginLeft: 13,
    flex: 1,
    minWidth: 0,
  },
  nextTrainTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#6D925E',
  },
  nextTrainDetail: {
    marginTop: 4,
    fontWeight: '500',
    fontSize: 14,
    color: '#333333',
  },
  coachCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    overflow: 'hidden',
  },
  coachCardFirst: {
    marginTop: 19,
  },
  coachCardRest: {
    marginTop: 13,
  },
  coachCoverWrap: {
    width: 150,
    minHeight: 209,
    alignSelf: 'stretch',
    flexShrink: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  coachCover: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  coachInfo: {
    flex: 1,
    minWidth: 0,
    padding: 17,
  },
  coachNameRow: {
    flexWrap: 'wrap',
  },
  coachName: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#333333',
  },
  coachTag: {
    marginLeft: 4,
    paddingHorizontal: 5,
    paddingVertical: 3,
    backgroundColor: '#6D925E',
    borderRadius: 4,
  },
  coachTagText: {
    fontWeight: '500',
    fontSize: 11,
    color: '#FFFFFF',
  },
  coachDesc: {
    marginTop: 11,
    fontWeight: '500',
    fontSize: 14,
    color: '#999999',
  },
  coachDivider: {
    marginTop: 13,
    height: 1,
    backgroundColor: 'rgba(23,63,125,0.08)',
  },
  coachTime: {
    marginTop: 13,
    fontWeight: '500',
    fontSize: 19,
    color: '#6D925E',
  },
  coachTopic: {
    marginTop: 8,
    fontWeight: '500',
    fontSize: 13,
    color: '#666666',
  },
  coachBookBtn: {
    marginTop: 13,
    height: 33,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#6D925E',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  coachBookBtnText: {
    fontWeight: '500',
    fontSize: 13,
    color: '#6D925E',
  },
  coachBenefitRow: {
    marginTop: 13,
    alignItems: 'center',
  },
  coachBenefitIcon: {
    width: 13,
    height: 13,
    flexShrink: 0,
  },
  coachBenefitText: {
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 13,
    color: '#333333',
  },
  coachBenefitHighlight: {
    fontWeight: '500',
    fontSize: 13,
    color: '#6D925E',
  },
  coachBookBtnBooked: {
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'rgba(109,146,94,0.2)',
  },
  coachBookBtnBookedText: {
    color: '#6D925E',
  },
  coachBookBtnDeadline: {
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: '#E4E5E7',
  },
  coachBookBtnDeadlineText: {
    color: '#333333',
  },
  coachBookBtnOngoing: {
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: '#6D925E',
  },
  coachBookBtnOngoingText: {
    color: '#FFFFFF',
  },
  coachBookBtnEnded: {
    borderWidth: 1,
    borderColor: '#FB4550',
    backgroundColor: '#FFFFFF',
  },
  coachBookBtnEndedText: {
    color: '#FB4550',
  },
  coachBookBtnFull: {
    borderWidth: 1,
    borderColor: '#EE9C44',
    backgroundColor: '#FFFFFF',
  },
  coachBookBtnFullText: {
    color: '#EE9C44',
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
