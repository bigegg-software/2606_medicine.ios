import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  rightBox: { marginRight: 16, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: 'rgba(109,146,94,0.1)', borderRadius: 32 },
  rightText: { fontWeight: "bold", fontSize: 14, color: '#6D925E' },
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  pageWrap: { flex: 1 },
  pageItem: { flex: 1 },
  scroll: { padding: 12, paddingBottom: 24 },
  pageIndicatorWrap: {
    alignItems: 'center',
    paddingTop: 8,
  },
  pageIndicator: {
    width: 107,
    height: 27,
    backgroundColor: 'rgba(109,146,94,0.2)',
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    marginHorizontal: 3,
  },
  pageDotInactive: {
    backgroundColor: '#FFFFFF',
  },
  pageDotActive: {
    backgroundColor: '#6D925E',
  },
  pagePlaceholderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  playerBox: { position: "relative", marginTop: 18, backgroundColor: "#FFFFFF", borderRadius: 18, overflow: 'hidden' },
  playerContent: { width: '100%', aspectRatio: 16 / 9, backgroundColor: "rgba(0,0,0,0.24)" },
  playerVideo: { flex: 1, width: '100%', height: '100%' },
  playerCover: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  progressBoxWrap: {
    marginTop: 10,
    backgroundColor: "#6D925E",
    paddingHorizontal: 15,
    paddingVertical: 18,
    borderRadius: 12
  },
  progressTitle: { fontWeight: 500, fontSize: 14, color: "#FFFFFF", marginTop: 4 },
  progressText: { fontWeight: 500, fontSize: 30, color: "#FFFFFF", marginTop: 6 },
  progressBox: { marginTop: 24, width: '100%', height: 10, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, overflow: 'hidden' },
  progressBar: { minWidth: 8, height: 10, paddingRight: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 10 },
  progressBarInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
  timeBox: { marginTop: 10, paddingHorizontal: 22 },
  timeText: { fontWeight: 500, fontSize: 14, color: '#4F86EE' },
  timeAllText: { fontWeight: 500, fontSize: 14, color: '#333333' },
  btnBox: { marginTop: 18 },
  btnImg: { width: 70, height: 70 },
  btnImgBox: { width: 70, height: 70, marginHorizontal: 25 },
  btnIcon: { width: 50, height: 50 },
  btnIconDisabled: { opacity: 0.35 },
  sportBox: { paddingHorizontal: 10, marginRight: 6, paddingVertical: 8, backgroundColor: '#FFFFFF', borderRadius: 25, borderWidth: 1, borderColor: '#E5E5E5' },
  sportScrollWrap: { position: 'relative' },
  sportScroll: { zIndex: 2 },
  sportScrollFade: {
    position: 'absolute',
    left: -12,
    top: -12,
    width: 375,
    height: 66,
    borderRadius: 0,
    zIndex: 1,
  },
  sportScrollMask: {
    position: 'absolute',
    right: -12,
    top: -12,
    width: 50,
    height: 66,
    borderRadius: 0,
    zIndex: 3,
  },
  sportImg: { width: 15, height: 15 },
  sportText: { fontWeight: 500, fontSize: 13, marginLeft: 4, color: '#333333' },
  selectSport: {
    backgroundColor: '#6D925E',
    borderColor: '#6D925E',
  },
  selectSportText: {
    color: '#FFFFFF',
  },
  playerTitleBox: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  playerTitleText: {
    fontWeight: "bold",
    fontSize: 16,
    color: '#333333',
  },
  tjBtnImg: {
    width: 12,
    height: 12
  },
  tjBtn: {
    marginLeft: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(238,156,68,0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EE9C44',
  },
  tjBtnText: {
    marginLeft: 3,
    fontWeight: "bold",
    fontSize: 11,
    color: '#EE9C44',
  },
  playerTabImg: {
    width: 16,
    height: 16,
  },
  sportInfoBox: {
    padding: 15,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  xlImg: {
    width: 45,
    height: 45,
  },
  xlTextWrap: {
    marginLeft: 12
  },
  xlText: {
    fontWeight: "bold",
    fontSize: 14,
    color: '#333333',
  },
  xlValue: {
    marginTop: 6,
    fontWeight: "bold",
    fontSize: 24,
    color: '#333333',
  },
  xlValueText: {
    fontWeight: 400,
    fontSize: 12,
    color: '#333333',
  },
  xlStatus: {
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6D925E',
  },
  xlStatusText: {
    fontWeight: "bold",
    fontSize: 12,
    color: '#6D925E',
  },
  lineBox: {
    marginTop: 15,
    height: 1,
    backgroundColor: 'rgba(23,63,125,0.08)',
  },
  msgImg: {
    width: 15,
    height: 15
  },
  msgText: {
    marginLeft:4,
    fontWeight: 500,
    fontSize: 12,
    color: '#666666',
  },
  statusText: {
    fontWeight: "bold",
    fontSize: 12,
    color: '#EE9C44',
  },
})

export default styles
