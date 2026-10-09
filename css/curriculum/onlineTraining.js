import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  tabPage: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  contentBox: {
    paddingHorizontal: 12,
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
  bannerTitle: {
    width: 120,
    fontWeight: 'bold',
    fontSize: 17,
    lineHeight: 26,
    color: '#333333',
  },
  bannerDesc: {
    marginTop: 8,
    fontWeight: '400',
    fontSize: 14,
    color: '#666666',
    lineHeight: 21,
  },
  weekOnlineTitle: {
    marginTop: 16,
    marginBottom: 3,
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 17,
    color: '#333333',
  },
  liveCard: {
    marginTop: 13,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
  },
  liveAvatar: {
    width: 89,
    height: 89,
    borderRadius: 50,
    flexShrink: 0,
  },
  liveInfo: {
    flex: 1,
    marginLeft: 16,
    minWidth: 0,
  },
  liveTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 4,
    backgroundColor: '#EFF7F0',
    borderRadius: 4,
  },
  liveTagText: {
    fontWeight: 'bold',
    fontSize: 11,
    color: '#6D925E',
  },
  liveTitle: {
    marginTop: 9,
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333333',
  },
  liveTime: {
    marginTop: 9,
    fontWeight: '500',
    fontSize: 14,
    color: '#333333',
  },
  liveSuit: {
    marginTop: 9,
    fontWeight: '500',
    fontSize: 13,
    color: '#666666',
  },
  liveActionRow: {
    marginTop: 9,
    alignItems: 'center',
  },
  liveEnrollRow: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveEnrollIcon: {
    width: 13,
    height: 13,
    marginRight: 5,
    flexShrink: 0,
  },
  liveEnrollText: {
    flex: 1,
    minWidth: 0,
    fontWeight: '500',
    fontSize: 13,
    color: '#333333',
  },
  livePrepareBox: {
    marginTop: 11,
    paddingHorizontal: 13,
    paddingVertical: 16,
    backgroundColor: '#F6F8FB',
    borderRadius: 6,
    alignItems: 'center',
  },
  livePrepareIcon: {
    width: 13,
    height: 13,
    marginRight: 8,
    flexShrink: 0,
  },
  livePrepareText: {
    flex: 1,
    minWidth: 0,
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 18,
    color: '#666666',
  },
  liveBookBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#6D925E',
    backgroundColor: '#FFFFFF',
  },
  liveBookBtnText: {
    fontWeight: '500',
    fontSize: 14,
    color: '#6D925E',
  },
  liveBookBtnBooked: {
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'rgba(109,146,94,0.2)',
  },
  liveBookBtnBookedText: {
    color: '#6D925E',
  },
  liveBookBtnDeadline: {
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: '#E4E5E7',
  },
  liveBookBtnDeadlineText: {
    color: '#333333',
  },
  liveBookBtnOngoing: {
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: '#6D925E',
  },
  liveBookBtnOngoingText: {
    color: '#FFFFFF',
  },
  liveBookBtnEnded: {
    borderWidth: 1,
    borderColor: '#FB4550',
    backgroundColor: '#FFFFFF',
  },
  liveBookBtnEndedText: {
    color: '#FB4550',
  },
  liveBookBtnFull: {
    borderWidth: 1,
    borderColor: '#EE9C44',
    backgroundColor: '#FFFFFF',
  },
  liveBookBtnFullText: {
    color: '#EE9C44',
  },
  practiceScroll: {
    marginTop: 13,
  },
  practiceScrollContent: {
    gap: 13,
    paddingHorizontal: 12,
  },
  practiceCard: {
    width: 190,
    padding: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    shadowColor: '#EAEAEA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 2,
  },
  practiceCover: {
    width: 86,
    height: 72,
    borderRadius: 8,
    flexShrink: 0,
  },
  practiceInfo: {
    flex: 1,
    marginLeft: 9,
    minWidth: 0,
  },
  practiceTitle: {
    marginTop: 4,
    fontWeight: '500',
    fontSize: 13,
    color: '#333333',
  },
  practiceTitleSecond: {
    marginTop: 2,
  },
  practiceSubtitle: {
    marginTop: 8,
    fontWeight: '500',
    fontSize: 12,
    color: '#999999',
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
