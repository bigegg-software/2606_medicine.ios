import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 310 },
  pageTitle: { height: 27, fontWeight: 500, fontSize: 18, color: AppTheme.textPrimary, lineHeight: 27, textAlign: "center", },
  pageLine: { marginTop: 18, height: 1, backgroundColor: "#053A93", opacity: 0.06 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 18, paddingBottom: 40 },
  glassCardWrap: { borderRadius: 18, shadowColor: '#B4C9FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 4, elevation: 3, },
  glassCard: { height: 184, paddingHorizontal: 24, paddingVertical: 20, borderRadius: 18, overflow: 'hidden', backgroundColor: '#F8FAFF', },
  glassCardHighlight: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#FFFFFF', },
  glassCardTitle: { fontWeight: 500, fontSize: 18, color: AppTheme.textPrimary, },
  statusBox: { backgroundColor: 'rgba(52,182,159,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 13, },
  statusText: { fontWeight: 500, fontSize: 12, color: '#34B69F', },
  milestoneRingsBox: { width: 99, height: 99, },
  colBox: { marginTop: 8, marginLeft: 8 },
  iconImg: { width: 22, height: 22, marginRight: 4, },
  colTitle: { marginRight: 4, fontWeight: 400, fontSize: 12, color: "#333333" },
  colText: { fontWeight: 500, fontSize: 14, color: "#333333" },
  titleBox: { marginTop: 16, paddingVertical: 5 },
  borderBox: { width: 3, height: 16, backgroundColor: "#173F7D", borderRadius: 2 },
  titleText: { marginLeft: 11, fontWeight: 500, fontSize: 18, color: "#333333" },
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
  tasksBox: {},
  tasksCol: {
    marginTop: 14,
    padding: 14,
    width: "48%",
    height: 170,
    backgroundColor: "#FFFFFF",
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
    padding: 13
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
  statRow: { marginTop: 17, gap: 10 },
  statBox: { flex: 1, marginTop: 0 },
  allBtn: { fontWeight: 400, fontSize: 14, color: "#053A93" },
  medicalBox: {
    marginTop: 17,
    shadowColor: AppTheme.primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
  },
  statTitle: { fontWeight: 400, fontSize: 14, color: AppTheme.textPrimary, marginTop: 4 },
  statValue: { marginTop: 4, fontWeight: 500, fontSize: 16, color: AppTheme.primaryColor },
  statUnit: { fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary },
  medicalTitle: { fontWeight: 500, marginTop: 14, fontSize: 16, color: AppTheme.textPrimary },
  leftText: { fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary, marginTop: 14 },
  statusInfo: { fontWeight: 400, fontSize: 12, color: "#FF8B07", marginTop: 6 },
  yztBox: {
    backgroundColor: "#FF9926",
    borderRadius: 19,
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  yztText: {
    fontWeight: 500,
    fontSize: 12,
    color: "#FFFFFF"
  }
})

export default styles
