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
    fontWeight: 'bold',
    fontSize: 17,
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
    width: 86,
    height: 86,
    borderRadius: 50,
    flexShrink: 0,
  },
  liveInfo: {
    flex: 1,
    marginLeft: 13,
    minWidth: 0,
  },
  liveTag: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 5,
    paddingVertical: 3,
    backgroundColor: '#6D925E',
    borderRadius: 4,
  },
  liveTagText: {
    fontWeight: '500',
    fontSize: 11,
    color: '#FFFFFF',
  },
  liveTitle: {
    marginTop: 7,
    fontWeight: 'bold',
    fontSize: 17,
    color: '#333333',
  },
  liveSuit: {
    marginTop: 11,
    fontWeight: '500',
    fontSize: 14,
    color: '#999999',
  },
  livePrepareBox: {
    marginTop: 16,
    paddingHorizontal: 13,
    paddingVertical: 16,
    backgroundColor: '#F6F8FB',
    borderRadius: 6,
  },
  livePrepareIcon: {
    width: 13,
    height: 13,
    marginRight: 5,
  },
  livePrepareText: {
    fontWeight: '500',
    fontSize: 13,
    color: '#666666',
  },
  liveBottomRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  liveBottomLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  liveTime: {
    fontWeight: '500',
    fontSize: 14,
    color: '#6D925E',
  },
  liveBenefitRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveBenefitIcon: {
    width: 13,
    height: 13,
    marginRight: 5,
  },
  liveBenefitText: {
    fontWeight: '500',
    fontSize: 14,
    color: '#666666',
  },
  liveBookBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#6D925E',
    backgroundColor: '#FFFFFF',
  },
  liveBookBtnText: {
    fontWeight: '500',
    fontSize: 14,
    color: '#6D925E',
  },
  practiceScroll: {
    marginTop: 13,
  },
  practiceScrollContent: {
    gap: 13,
    paddingHorizontal: 12,
  },
  practiceCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    shadowColor: '#EAEAEA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 2,
  },
  practiceCover: {
    width: 54,
    height: 54,
    borderRadius: 50,
    flexShrink: 0,
  },
  practiceInfo: {
    marginLeft: 13,
    minWidth: 0,
  },
  practiceTitle: {
    marginTop: 4,
    fontWeight: '500',
    fontSize: 15,
    color: '#333333',
  },
  practiceSubtitle: {
    marginTop: 6,
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
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
