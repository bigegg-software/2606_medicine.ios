import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.backgroundColor,
  },
  content: {
    flex: 1,
  },
  contentBox: {
    paddingHorizontal: 13,
  },
  navBox: {
    marginHorizontal: 13,
    marginTop: 11,
    height: 43,
    padding: 3,
    backgroundColor: 'rgba(109,146,94,0.12)',
    borderRadius: 25,
    gap: 6,
  },
  navItem: {
    flex: 1,
    height: '100%',
    borderRadius: 25,
    paddingHorizontal: 4,
  },
  activeNavItem: {
    backgroundColor: '#FFF',
  },
  navText: {
    fontWeight: '500',
    fontSize: 15,
    color: AppTheme.textPrimary,
  },
  activeNavText: {
    fontWeight: 'bold',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 80,
  },
  weekOnlineTitle: {
    marginTop: 16,
    marginBottom: 3,
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 17,
    color: '#333333',
  },
  followCard: {
    marginTop: 13,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
  },
  followCover: {
    width: 86,
    height: 86,
    borderRadius: 50,
    flexShrink: 0,
  },
  followInfo: {
    flex: 1,
    marginLeft: 13,
    minWidth: 0,
  },
  followTime: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    fontWeight: '500',
    fontSize: 14,
    color: '#6D925E',
  },
  followTitle: {
    marginTop: 9,
    fontWeight: 'bold',
    fontSize: 17,
    color: '#333333',
  },
  followMetaRow: {
    marginTop: 8,
  },
  followMetaIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  followMeta: {
    flex: 1,
    minWidth: 0,
    fontWeight: '500',
    fontSize: 14,
    color: '#999999',
  },
  completedCard: {
    marginTop: 13,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
  },
  completedDateIcon: {
    width: 16,
    height: 16,
    marginTop: 2,
    flexShrink: 0,
  },
  completedInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 9,
    marginRight: 8,
  },
  completedDate: {
    fontWeight: '500',
    fontSize: 15,
    color: '#333333',
  },
  completedTitle: {
    marginTop: 10,
    fontWeight: '500',
    fontSize: 14,
    color: '#666666',
  },
  completedStatusTag: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6D925E',
    flexShrink: 0,
  },
  completedStatusText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#6D925E',
  },
  bookingCard: {
    width: '100%',
    position: 'relative',
  },
  bookingCardBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  bookingCardBody: {
    padding: 30,
  },
  bookingLabel: {
    fontWeight: '500',
    fontSize: 13,
    color: '#666666',
  },
  bookingStatusTag: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    backgroundColor: 'rgba(109,146,94,0.06)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(109,146,94,0.3)',
  },
  bookingStatusText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#6D925E',
  },
  bookingTime: {
    marginTop: 11,
    fontWeight: '500',
    fontSize: 15,
    color: '#333333',
  },
  bookingTitle: {
    marginTop: 11,
    fontWeight: 'bold',
    fontSize: 17,
    color: '#333333',
  },
  bookingCoachRow: {
    marginTop: 19,
  },
  bookingCoachAvatar: {
    width: 64,
    height: 64,
    borderRadius: 50,
    flexShrink: 0,
  },
  bookingCoachInfo: {
    flex: 1,
    marginLeft: 16,
    minWidth: 0,
  },
  bookingCoachName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333333',
  },
  bookingCoachMetaIcon: {
    width: 13,
    height: 13,
    marginRight: 4,
  },
  bookingCoachMetaRow: {
    marginTop: 9,
  },
  bookingCoachMeta: {
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
  },
  bookingCoachTip: {
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
  },
  bookingActionRow: {
    marginTop: 32,
    gap: 16,
  },
  bookingAdjustBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(109,146,94,0.1)',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(109,146,94,0.3)',
  },
  bookingAdjustBtnIcon: {
    width: 16,
    height: 16,
    marginRight: 6
  },
  bookingAdjustBtnText: {
    fontWeight: '500',
    fontSize: 15,
    color: '#6D925E',
  },
  bookingDetailBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  bookingDetailBtnText: {
    fontWeight: '500',
    fontSize: 15,
    color: '#333333',
  },
  bookingDetailBtnIcon: {
    width: 5,
    height: 10,
    marginLeft: 9,
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
