import { StyleSheet, Dimensions } from 'react-native';
import { AppTheme } from '@/common/theme';

const bannerWidth = Dimensions.get('window').width - 24;
const bannerHeight = (bannerWidth * 115) / 351;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  body: {
    flex: 1,
    paddingTop: 8,
  },
  /** 顶部横幅：屏宽 - 24，宽高比 351:115 */
  banner: {
    marginHorizontal: 12,
    width: bannerWidth,
    height: bannerHeight,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  bannerImage: {
    width: bannerWidth,
    height: bannerHeight,
  },
  bannerTextWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 20,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  bannerText: {
    maxWidth: '58%',
    fontWeight: '500',
    fontSize: 14,
    color: '#333333',
    lineHeight: 25,
  },
  bannerTextHighlight: {
    fontWeight: '500',
    fontSize: 14,
    color: '#6D925E',
    lineHeight: 25,
  },

  backImage1: {
    width: '100%',
    height: 50,
    marginTop: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  backImage1Text: { fontWeight: 'bold', fontSize: 16, color: '#333333' },

  deviceScroll: {
    flex: 1,
  },
  deviceScrollContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  deviceList: {
    marginHorizontal: 12,
  },
  deviceCard: {
    marginTop: 15,
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceCardFirst: {
    marginTop: 0,
  },
  emptyCard: {
    marginTop: 0,
    paddingVertical: 28,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontWeight: '400',
    fontSize: 14,
    color: '#999999',
  },
  deviceLogo: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
    minWidth: 0,
  },
  deviceName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333333',
  },
  deviceStatusRow: {
    marginTop: 8,
  },
  deviceStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  deviceStatusDotOn: {
    backgroundColor: '#39BF56',
  },
  deviceStatusDotOff: {
    backgroundColor: '#CBCBCB',
  },
  deviceStatusText: {
    fontWeight: '500',
    fontSize: 13,
    color: '#666666',
  },
  deviceBatteryWrap: {
    marginLeft: 8,
  },
  deviceBatteryIcon: {
    width: 27,
    height: 13,
    marginRight: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  deviceBatteryFillTrack: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 5,
    bottom: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  deviceBatteryFill: {
    height: '100%',
  },
  deviceBatteryOutline: {
    width: 27,
    height: 13,
  },
  deviceBatteryText: {
    fontWeight: '500',
    fontSize: 13,
    color: '#666666',
  },
  deviceArrow: {
    width: 8,
    height: 13,
    marginLeft: 8,
  },
  bottomBar: {
    width: '100%',
    paddingHorizontal: 15,
    paddingTop: 18,
    backgroundColor: '#FEFEFE',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: '#B4C9FF',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  addDeviceBtn: {
    flex: 1,
    height: 46,
    backgroundColor: '#6D925E',
    borderRadius: 12,
  },
  addDeviceBtnIcon: {
    width: 20,
    height: 20,
    marginRight: 4,
  },
  addDeviceBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default styles;
