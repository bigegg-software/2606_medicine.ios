import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 310 },
  pageTitleBox: {},
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
    marginTop: 18,
    shadowColor: '#B4C9FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 4, elevation: 3
  },
  pageTopBg: { padding: 12, height: 214, borderRadius: 12, overflow: "hidden" },
  pageTopBgIcon: { width: 18, height: 18 },
  pageTopBgText: { fontWeight: "bold", fontSize: 12, color: "#333333", marginLeft: 4 },
  topRowBox: {

  },
  topRowBoxItem: {

  },
  topRowBoxItemValue: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#333333"
  },
  topRowBoxItemText: {},
  navIcon: { width: 24, height: 24 },
  pageLine: { marginTop: 18, height: 1, backgroundColor: "#053A93", opacity: 0.06 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 18, paddingBottom: 40 },
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
