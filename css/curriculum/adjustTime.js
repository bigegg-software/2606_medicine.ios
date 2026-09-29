import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  sheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'visible',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: '500',
    fontSize: 17,
    color: '#333333',
  },
  closeBtn: {
    padding: 4,
  },
  closeIcon: {
    width: 18,
    height: 18,
  },
  dateStripWrap: {
    position: 'relative',
  },
  dateScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingRight: 56,
  },
  dateCell: {
    width: 58,
    height: 60,
    backgroundColor: '#F6F8FB',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCellActive: {
    backgroundColor: 'rgba(109,146,94,0.1)',
    borderWidth: 1,
    borderColor: '#6D925E',
  },
  dateWeekday: {
    fontWeight: '500',
    fontSize: 13,
    color: '#333333',
    textAlign: 'center',
  },
  dateWeekdayActive: {
    fontWeight: '500',
    fontSize: 13,
    color: '#6D925E',
    textAlign: 'center',
  },
  dateDay: {
    marginTop: 4,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
  dateDayActive: {
    marginTop: 4,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#6D925E',
    textAlign: 'center',
  },
  dateDotWrap: {
    marginTop: 2,
    minHeight: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#6D925E',
  },
  allDateFloat: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#EAEAEA',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  allDateLabel: {
    fontWeight: '500',
    fontSize: 11,
    color: '#333333',
    textAlign: 'center',
  },
  allDateIcon: {
    width: 20,
    height: 20,
    marginTop: 4,
  },
  dashedLine: {
    marginTop: 21,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E5E5E5',
  },
  slotList: {
    gap: 13,
  },
  slotBody: {
    marginTop: 16,
    minHeight: 220,
    position: 'relative',
  },
  slotListDimmed: {
    opacity: 0.45,
  },
  slotEmpty: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotEmptyText: {
    fontWeight: '500',
    fontSize: 14,
    color: '#999999',
  },
  slotLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotRow: {
    flexDirection: 'row',
    gap: 13,
  },
  slotCell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 13,
    backgroundColor: '#F6F8FB',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotCellActive: {
    backgroundColor: 'rgba(109,146,94,0.1)',
    borderWidth: 1,
    borderColor: '#6D925E',
  },
  slotCellDisabled: {
    backgroundColor: '#F0F0F0',
    borderWidth: 0,
  },
  slotCellPlaceholder: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 13,
    opacity: 0,
  },
  slotText: {
    fontWeight: '500',
    fontSize: 15,
    color: '#333333',
  },
  slotTextActive: {
    fontWeight: '500',
    fontSize: 15,
    color: '#6D925E',
  },
  slotTextDisabled: {
    color: '#BBBBBB',
  },
  panelBody: {
    minHeight: 340,
  },
  calendarPanel: {
    marginTop: 4,
    minHeight: 340,
  },
  calendarMonthRow: {
    marginBottom: 16,
  },
  calendarMonthText: {
    fontWeight: '500',
    fontSize: 16,
    color: '#333333',
  },
  calendarNavIcon: {
    width: 7,
    height: 12,
    tintColor: '#666666',
    transform: [{ rotate: '180deg' }],
  },
  calendarNavIconRight: {
    width: 7,
    height: 12,
    tintColor: '#666666',
  },
  calendarWeekRow: {
    marginBottom: 8,
  },
  calendarWeekCell: {
    flex: 1,
    alignItems: 'center',
  },
  calendarWeekText: {
    fontWeight: '500',
    fontSize: 13,
    color: '#999999',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: '14.2857%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  calendarDayInner: {
    width: 40,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayInnerActive: {
    backgroundColor: 'rgba(109,146,94,0.12)',
  },
  calendarDayInnerDisabled: {
    opacity: 0.45,
  },
  calendarDayText: {
    fontWeight: '500',
    fontSize: 15,
    color: '#333333',
  },
  calendarDayTextActive: {
    color: '#6D925E',
    fontWeight: 'bold',
  },
  calendarDayTextDisabled: {
    color: '#BBBBBB',
  },
  confirmBtn: {
    marginTop: 24,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6D925E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  toastHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 100,
  },
  toastBox: {
    maxWidth: '82%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderRadius: 8,
  },
  toastText: {
    fontWeight: '500',
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
export default styles;
