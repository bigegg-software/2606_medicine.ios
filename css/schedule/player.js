import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  scroll: { padding: 18, paddingBottom: 40 },
  playerBox: { position: "relative", width: '100%', aspectRatio: 16 / 9, backgroundColor: "rgba(0,0,0,0.24)", borderRadius: 18, overflow: 'hidden' },
  playerVideo: { flex: 1, width: '100%', height: '100%' },
  playerCover: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  progressBox: { marginTop: 24, width: '100%', height: 10, backgroundColor: "rgba(5,58,147,0.14)", borderRadius: 10, overflow: 'hidden' },
  progressBar: { minWidth: 0, height: 10, paddingRight: 2, backgroundColor: '#4F86EE', borderRadius: 10, },
  progressBarInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF', },
  timeBox: { marginTop: 10, paddingHorizontal: 22, },
  timeText: { fontWeight: 500, fontSize: 14, color: '#4F86EE', },
  timeAllText: { fontWeight: 500, fontSize: 14, color: '#333333', },
  btnBox: { marginTop: 18, },
  btnImg: { width: 54, height: 54 },
  btnImgBox: { width: 54, height: 54, marginHorizontal: 32, },
  btnIcon: { width: 28, height: 28, },
  btnIconDisabled: { opacity: 0.35 },
  tabBox: { marginTop: 24, marginHorizontal: 13, },
  tabItem: { alignItems: 'center', },
  tabItemGap: { marginLeft: 26, },
  tabText: { fontWeight: '400', fontSize: 16, color: '#999999', },
  tabTextActive: { fontWeight: '500', fontSize: 18, color: '#333333', },
  tabIndicator: { marginTop: 2, width: 72, height: 4, backgroundColor: '#4F86EE', borderRadius: 4, },
  tabIndicatorHidden: { marginTop: 2, width: 72, height: 4, opacity: 0, },
  infoBox: { marginTop: 18, height: 92, backgroundColor: '#FFFFFF', borderRadius: 18, },



  medicalBox: {
    marginTop: 17,
    shadowColor: AppTheme.primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 25,
    paddingVertical: 16,
  },
  medicalInfoValue: { fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary, lineHeight: 21, },
  cfIcon: { width: 20, height: 20, marginRight: 6 },
  cfIconText: { fontWeight: 400, fontSize: 16, color: '#333333' },
  suggestBox: {
    marginTop: 10,
    paddingHorizontal: 26,
    paddingVertical: 12,
    backgroundColor: "rgba(79,134,238,0.04)",
    borderRadius: 18
  },
  aiSuggest: {
    marginTop: 4,
    fontWeight: 400,
    fontSize: 12,
    color: "#999999"
  },

})

export default styles
