import { StyleSheet, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
export const DIET_DATE_PICKER_SHEET_HEIGHT = SCREEN_HEIGHT * 0.72;

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    width: SCREEN_WIDTH,
    height: DIET_DATE_PICKER_SHEET_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    zIndex: 1,
  },
  header: {
    width: '100%',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    zIndex: 2,
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  titleRow: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 18,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333333',
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: 18,
    height: 18,
  },
  monthText: {
    marginTop: 20,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  weekRow: {
    marginTop: 18,
    flexDirection: 'row',
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekText: {
    fontWeight: '500',
    fontSize: 14,
    color: '#333333',
  },
  list: {
    flex: 1,
  },
  monthBlock: {
    paddingHorizontal: 18,
  },
  monthLabel: {
    height: 24,
    lineHeight: 24,
    marginBottom: 15,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  listHidden: {
    opacity: 0,
  },
  dayRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInnerSelected: {
    backgroundColor: '#6D925E',
  },
  dayInnerToday: {
    borderWidth: 1,
    borderColor: '#6D925E',
  },
  dayText: {
    fontWeight: '500',
    fontSize: 16,
    color: '#333333',
  },
  dayTextMuted: {
    color: '#CCCCCC',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dayTextToday: {
    color: '#6D925E',
    fontWeight: 'bold',
  },
});

export default styles;
