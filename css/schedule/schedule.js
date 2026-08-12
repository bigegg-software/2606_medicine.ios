import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 12, paddingBottom: 40 },
  scrollNew: { paddingBottom: 40 },
  mH12: { marginHorizontal: 12 },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 310 },
  pageTitleBox: { marginTop: 12 },
  pageTitle: { fontWeight: "bold", fontSize: 22, color: "#000" },
  pageTitleSubtitle: {
    marginLeft: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: "rgba(109,146,94,0.06)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    shadowColor: '#B4C9FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 4, elevation: 3
  },
  pageTitleSubtitleText: { fontWeight: "bold", fontSize: 12, color: "#6D925E" },
  pageTopText: { marginTop: 11, fontWeight: 500, fontSize: 12, color: "#666666" },
  pageTopBgWrap: {
    marginTop: 18, position: "relative",
    shadowColor: '#B4C9FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 4, elevation: 3
  },
  pageTopBg: { borderRadius: 12, overflow: "hidden" },
  pageTopBgImg: { position: "absolute", top: 0, left: 0, right: 0, width: '100%', height: undefined, aspectRatio: 1404 / 856 },
  pageTopBgIcon: { width: 18, height: 18 },
  pageTopBgText: { fontWeight: "bold", fontSize: 12, color: "#333333", marginLeft: 4 },
  sectionTitleWrap: { marginLeft: 4, position: 'relative', alignSelf: 'flex-start' },
  sectionTitleText: { marginLeft: 0, fontSize: 16, color: "#333333", fontWeight: "bold" },
  sectionTitleUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 7,
    borderRadius: 25,
  },
  topRowBoxItem: {
    position: "relative",
    marginTop: 12,
    height: 78,
    width: "47%",
  },
  topRowBoxItemImg: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },

  topRowBoxItemValue: { marginLeft: 12, marginTop: 27, fontWeight: "bold", fontSize: 18, color: "#333333" },
  topRowBoxItemText: { marginLeft: 12, marginTop: 4, fontWeight: 500, fontSize: 12, color: "#999999" },
  backImage1: { width: "100%", height: 50, marginTop: 12 },
  backImage1Text: { fontWeight: "bold", fontSize: 16, color: "#333333" },
  dayProgressText: { fontWeight: 500, fontSize: 14, color: "#333333" },
  dayProgressNum: { fontWeight: "bold", fontSize: 14, color: AppTheme.primaryColor },
  navTabBox: {
    height: 30,
    paddingVertical: 6,
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: 'center',
  },
  navTabBoxActive: { backgroundColor: "#6D925E", borderColor: "#6D925E", borderRadius: 25 },
  navTabIcon: { width: 15, height: 15 },
  navTabText: { marginLeft: 4, fontWeight: '500', fontSize: 13, color: "#333333" },
  navTabTextActive: { fontWeight: '500', fontSize: 13, color: "#FFFFFF" },
  commonWrap: {
    marginHorizontal: 12,
    paddingHorizontal: 15,
    paddingVertical: 17,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: '#B4C9FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 4, elevation: 3
  },
  tipBox: {
    backgroundColor: "rgba(109,146,94,0.12)",
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 6
  },
  tipText: { fontWeight: 500, fontSize: 11, color: "#6D925E" },
  listBox: { marginTop: 5, position: "relative" },
  listItem: { marginTop: 12, padding: 15, backgroundColor: "#F6F8FB", borderRadius: 8 },
  listItemTitle: { fontWeight: "bold", fontSize: 14, color: "#333333" },
  listItemSubtitle: { fontWeight: 500, fontSize: 12, color: "#999999", marginLeft: 4 },
  listItemBox: { marginTop: 7 },
  listItemValue: { fontWeight: "bold", fontSize: 22, color: "#333333" },
  listItemUnit: { fontWeight: 500, fontSize: 14, color: "#999999", marginLeft: 4, marginTop: 4 },
  listItemTarget: { fontWeight: 500, fontSize: 14, color: "#999999", marginLeft: 6, marginTop: 4 },
  listItemLine: { marginTop: 15, height: 6, backgroundColor: '#ECEDF1', borderRadius: 25, overflow: 'hidden' },
  listItemLineFill: { height: 6, backgroundColor: '#6D925E', borderRadius: 25 },
  listIcon: { width: 12, height: 12, marginRight: 4 },
  listItemValueNum: { fontWeight: "bold", fontSize: 12, color: "#333333" },
  listItemBtmBox: { marginTop: 15 },
  listItemBtmText: { fontWeight: 500, fontSize: 13, color: "#999999" },
  listItemBtmText1: { fontWeight: "bold", fontSize: 14, color: "#333333" },
  rightText: { fontWeight: 500, fontSize: 13, color: "#999999" },
  leftLine: { width: 3, height: 12, backgroundColor: "#6D925E", borderRadius: 25 },
  xlTitle: { fontWeight: "bold", fontSize: 14, color: "#333333", marginLeft: 6 },
  xlText: { fontWeight: "bold", fontSize: 12, color: "#6D925E" },
  weekTrainWrap: { marginTop: 20, gap: 12 },
  weekBox: { flex: 1, justifyContent: 'flex-end' },
  iconBox: { width: "95%", alignSelf: "center", alignItems: "center", justifyContent: "center", position: "relative" },
  weekText: { position: "absolute", left: 0, right: 0, top: 2, bottom: 0, textAlign: "center", fontWeight: "bold", fontSize: 12, color: "#999999" },
  weekIcon: { width: 35, height: 23 },
  WTitle: { marginTop: 6, textAlign: "center", width: "100%", fontWeight: "bold", fontSize: 13, color: "#999999" },
  weekProgress: { width: '100%', justifyContent: 'flex-end', marginTop: 6 },
  weekProgressBar: { width: '100%', borderRadius: 6, backgroundColor: '#ECEDF1' },
  weekProgressBarDone: { backgroundColor: '#6D925E' },
  weekRateText: { fontWeight: 500, fontSize: 13, color: "#999999" },
  weekRateTextNum: { fontWeight: "bold", fontSize: 14, color: "#333333" },
  weekRateList: { marginTop: 13 },
  weekRateItem: { gap: 12, height: 19, marginTop: 12 },
  weekRateItemTitle: { fontWeight: 500, fontSize: 14, color: "#333333" },
  weekRateBar: { flex: 1, height: 6, backgroundColor: '#ECEDF1', borderRadius: 25, overflow: 'hidden' },
  weekRateBarFill: { height: 6, borderRadius: 25 },
  kcalInfoBox: { marginTop: 10, backgroundColor: "rgba(254,248,225,0.2)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(238,156,68,0.3)", paddingHorizontal: 12, paddingVertical: 10 },
  kcalInfoIcon: { width: 15, height: 15, marginRight: 6, marginTop: 1 },
  kcalInfoText: { flex: 1, flexShrink: 1, fontWeight: 500, fontSize: 12, color: "#C98A41", lineHeight: 18 },
  historyBox: { marginTop: 5 },
  historyItem: {
    padding: 15,
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E7EAEB",
  },
  historyItemTitle: { fontWeight: "bold", fontSize: 14, color: "#333333" },
  historyItemStatus: { backgroundColor: "#FFFFFF", borderRadius: 4, borderWidth: 1, borderColor: "#EE9C44" },
  historyItemStatusDone: { borderColor: "#6D925E" },
  historyItemStatusText: { fontWeight: "bold", fontSize: 11, color: "#EE9C44", paddingHorizontal: 6, paddingVertical: 4 },
  historyItemStatusTextDone: { color: "#6D925E" },
  historyItemTextWrap: { marginTop: 5 },
  historyItemIcon: { width: 15, height: 15 },
  historyItemText: { marginLeft: 6, fontWeight: 500, fontSize: 12, color: "#999999" },
  historyRow: { marginTop: 16, gap: 20 },
  historyLine: { width: 3, height: 12, backgroundColor: "#EE9C44", borderRadius: 25 },
  historyTitle: {
    fontWeight: 500,
    fontSize: 13,
    color: "#666666",
    marginLeft: 5
  },
  historyValue: {
    marginTop: 6,
    fontWeight: "bold",
    fontSize: 22,
    color: "#333333",
  },
  historyUnit: {
    marginTop: 14,
    marginLeft: 2,
    fontWeight: 500,
    fontSize: 12,
    color: "#999999",
    textDecorationLine: "line-through"
  },
  historyInfo: {
    marginTop: 17,
    padding: 12,
    backgroundColor: "#F6F8FB",
    borderRadius: 25,
  },
  historyInfoText: {
    fontWeight: 500,
    fontSize: 13,
    color: "#999999",
    marginLeft: 6
  },
















  navIcon: { width: 24, height: 24 },
  pageLine: { marginTop: 18, height: 1, backgroundColor: "#053A93", opacity: 0.06 },
  glassCardWrap: { borderRadius: 18, shadowColor: '#B4C9FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 4, elevation: 3 },
  glassCard: { padding: 16, marginTop: 10, borderRadius: 18, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  glassCardHighlight: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#FFFFFF' },
  glassCardTitle: { fontWeight: "bold", fontSize: 18, color: AppTheme.textPrimary },
  statusBox: { borderWidth: 1, borderColor: "#6D925E", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontWeight: 500, fontSize: 12, color: '#6D925E' },
  milestoneRingsBox: { width: 120, height: 120 },
  rowBox: { padding: 16, marginTop: 10, borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  colRow: { marginTop: 15, paddingHorizontal: 14, width: "100%" },
  colBox: { marginTop: 8, marginLeft: 8 },
  colIcon: { width: 6, height: 6, backgroundColor: "#6D925E", borderRadius: 3, marginTop: 4, marginRight: 6 },
  colTitle: { fontWeight: 500, fontSize: 12, color: "#666666" },
  colText: { fontWeight: "bold", marginTop: 4, fontSize: 14, color: "#333333" },
  titleBox: { marginTop: 16, paddingVertical: 5 },
  scrollBox: { marginTop: 14 },
  backBox: {
    width: 162,
    height: 110,
    padding: 16,
    position: 'relative',
    marginRight: 12,
    borderRadius: 18,
    shadowColor: '#0C3D9A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 18
  },
  backImg: {
    width: 162,
    height: 110,
    position: 'absolute',
  },
  backText: {
    fontWeight: 500,
    fontSize: 16,
    color: "#333333"
  },
  exerciseImg: {
    width: 24,
    height: 24,
  },
  statusColBox: {
    marginTop: 15
  },
  statusColText: {
    fontWeight: 500,
    fontSize: 14,
    color: "#00B388"
  },
  statusIcon: {
    width: 16,
    height: 16,
  },
  colBtmText: {
    marginTop: 4,
    fontWeight: 400,
    fontSize: 12,
    color: "#999999"
  },
  tasksBox: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tasksCol: {
    width: '48%',
    padding: 14,
    height: 170,
    backgroundColor: '#F6F8FB',
    borderRadius: 18,
  },
  tasksTitle: {
    fontWeight: 500,
    fontSize: 16,
    color: "#333333",
    marginLeft: 7
  },
  tasksIntro: {
    marginTop: 4,
    fontWeight: 400,
    fontSize: 14,
    color: "#999999"
  },
  taskProgressWrap: {
    marginTop: 14,
    alignSelf: 'center',
  },
  dayBox: {
    marginTop: 14,
    backgroundColor: "#FEFFFF",
    borderRadius: 18,
    shadowColor: '#0C3D9A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 18,
  },
  dayCol: { width: 36, height: 62 },
  dayColAcitve: {
    width: 36,
    height: 62,
    borderRadius: 30,
    backgroundColor: "#F1F6FF",
  },
  dayText: {
    fontWeight: 400,
    fontSize: 14,
    color: "#333333"
  },
  dayTimeBox: {
    marginTop: 6,
    width: 24,
    height: 24,
    // backgroundColor: "#053A93",
    borderRadius: 12
  },
  dayTime: {
    fontWeight: 400,
    fontSize: 14,
    color: "#FFFFFF"
  },
  dayTimeColor: {
    color: "#333333"
  },
  dayTimeIncomplete: {
    backgroundColor: '#FF8B07',
  },
  dayTimeToday: {
    backgroundColor: '#053A93',
  },
  dayTimeBadgeText: {
    fontWeight: 400,
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statRow: { marginTop: 20, height: 78, backgroundColor: "#F7FAFC", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 18 },
  statBox: { marginTop: 0 },
  allBtn: { fontWeight: 500, fontSize: 13, color: "#666666", marginRight: 6 },
  medicalBox: {
    marginTop: 17,
    shadowColor: AppTheme.primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    overflow: 'hidden',
  },
  medicalBackImg: {
    borderRadius: 8,
    resizeMode: 'cover',
  },
  statTitle: { fontWeight: 500, fontSize: 14, color: "#666666", marginTop: 6 },
  statValue: { fontWeight: "bold", fontSize: 18, color: "#333333" },
  statValue_1: { fontWeight: 500, fontSize: 18, color: "#666666" },
  statUnit: { fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary },
  medicalTitle: { fontWeight: 500, marginTop: 14, fontSize: 16, color: AppTheme.textPrimary },
  leftText: { fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary, marginTop: 14 },
  statusInfo: { fontWeight: 500, fontSize: 12, color: "#333333", marginTop: 6 },
  yztBox: {
    borderWidth: 1,
    borderColor: "#FF9926",
    backgroundColor: "rgba(238,156,68,0.1)",
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  yztText: {
    fontWeight: 500,
    fontSize: 12,
    color: "#FF9926"
  },
  yjsBox: {
    borderWidth: 1,
    borderColor: "#053A93",
    backgroundColor: "rgba(5,58,147,0.1)",
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  yjsText: {
    fontWeight: 500,
    fontSize: 12,
    color: "#053A93"
  },
  historyPage: { padding: 18, paddingBottom: 40 },
  historyPageBody: { flex: 1 },
  historyFilterSection: { paddingHorizontal: 18, paddingTop: 18 },
  historyListScroll: { flex: 1 },
  historyListContent: { paddingHorizontal: 18, paddingBottom: 40 },
  historyListContentEmpty: { flexGrow: 1 },
  historyEmptyWrap: { flex: 1, justifyContent: 'center', paddingTop: 40 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F1F6FF',
  },
  filterItemActive: {
    backgroundColor: AppTheme.primaryColor,
  },
  filterText: {
    fontWeight: 400,
    fontSize: 14,
    color: '#333333',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  loadMoreText: {
    textAlign: 'center',
    fontSize: 14,
    color: AppTheme.textSecondary,
    marginTop: 16,
  },
})

export default styles
