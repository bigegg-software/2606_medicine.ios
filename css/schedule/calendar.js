import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  body: { paddingVertical: 18, paddingTop: 2, paddingBottom: 40 },
  mg18: { marginHorizontal: 18 },
  rowBox: {
    padding: 15,
    borderRadius: 8,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: AppTheme.primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  dayTitleBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dayTitle: { fontWeight: 500, fontSize: 18, color: AppTheme.textPrimary, textAlign: 'center' },
  navIconLeftWrap: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  navIconRightWrap: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  navIcon: { width: 8, height: 18 },
  weekHead: { flexDirection: 'row', marginTop: 20, gap: 12 },
  weekCellWrap: {
    flex: 1,
    height: 29,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(109,146,94,0.08)",
    borderRadius: 6,
  },
  weekCell: {
    flex: 1,
    fontWeight: 500,
    fontSize: 14,
    color: AppTheme.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%',
    minHeight: 48,
    paddingVertical: 4,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  dayCellFirstRow: {
    marginTop: 16,
  },
  dayText: {
    fontWeight: 400,
    fontSize: 14,
    color: '#4F6E43',
    lineHeight: 21,
    textAlign: 'center',
  },
  dayTextOther: {
    fontWeight: 400,
    fontSize: 14,
    color: 'rgba(79,110,67,0.5)',
    lineHeight: 21,
    textAlign: 'center',
  },
  dayInner: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  daySelected: { backgroundColor: AppTheme.primaryColor, borderRadius: 20 },
  dayTextSelected: { fontWeight: 400, fontSize: 14, color: '#FFFFFF', textAlign: 'center' },
  dayDotWrap: {
    height: 16,
    width: '100%',
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayDotWrapGap: { gap: 4 },
  dayDotWrapOverlap: {},
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  dayDotOverlap: { marginLeft: -2 },
  calendarBack: { marginTop: 12, height: 50, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  typeColor: { width: 6, height: 6, borderRadius: 3, backgroundColor: AppTheme.primaryColor },
  typeText: { fontWeight: 500, fontSize: 14, color: AppTheme.textSecondary, marginLeft: 6 },
  loadingBox: { marginTop: 24, alignItems: 'center' },
  emptyTimelineBox: { marginTop: 20, paddingVertical: 24, alignItems: 'center' },
  emptyTimelineText: { fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary },
  timelineWrap: {
    position: 'relative',
  },
  exerciseSectionWrap: {},
  scheduledTimelineWrap: {
    position: 'relative',
  },
  timelineSection: {
    position: 'relative',
  },
  sectionItems: {
    position: 'relative',
  },
  timelineRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  axisCol: {
    marginTop: 4,
    width: 8,
    alignItems: 'center',
  },
  axisSegment: {
    flex: 1,
    width: 1,
    marginTop: -4,
    marginBottom: -30,
    backgroundColor: 'rgba(19,17,65,0.1)',
  },
  timelineContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
  },
  periodRow: {
    marginTop: 20
  },
  exerciseDateTitle: {
    marginBottom: 20,
    alignItems: 'center',
  },
  timelineRowGap: {
    marginBottom: 0,
  },
  periodText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333333"
  },
  todayText: {
    fontWeight: 500,
    fontSize: 16,
    color: "#333333",
    marginLeft: 3
  },
  exerciseScroll: {
    marginTop: 20
  },
  timeAxisLine: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#131141",
    zIndex: 1,
  },
  cardSide: {
    flex: 1,
    marginRight: 16,
  },
  cardSideList: {
    flex: 1,
    marginTop: 6,
    gap: 10,
  },
  cardSideBox: {
    backgroundColor: "#F6F8FB",
    borderRadius: 12,
  },
  mergedTimelineCard: {
    paddingHorizontal: 12,
    paddingVertical: 15
  },
  timeText: {
    fontWeight: 400,
    fontSize: 16,
    color: '#333333',
  },
  taskCardIcon: { width: 15, height: 15, marginRight: 3, marginTop: 2 },
  taskCard: {
    width: 280,
    maxWidth: '100%',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 17,
    shadowColor: '#053A93',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  exerciseTaskCard: {
    width: 200,
    maxWidth: '100%',
    minHeight: 64,
    backgroundColor: '#F6F8FB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  exerciseCardContent: {
    flex: 1,
    minWidth: 0,
  },
  dietCalorieInlineText: {
    marginLeft: 8,
    flexShrink: 1,
    fontWeight: 400,
    fontSize: 12,
    color: AppTheme.textSecondary,
  },
  taskCardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: '#333333',
  },
  mergedTimelineCardItem: {
    marginTop: 15,
    paddingLeft: 18,
  },
  mergedMedicationContent: {
    flex: 1,
    minWidth: 0,
    marginRight: 30,
  },
  mergedMedicationTitleRow: {
    minWidth: 0,
  },
  mergedMedicationName: {
    flexShrink: 1,
    fontWeight: "bold",
    fontSize: 14,
    color: '#333333',
  },
  mergedMedicationDesc: {
    marginTop: 4,
    fontWeight: 500,
    fontSize: 12,
    lineHeight: 18,
    color: '#666666',
  },
  activityStatusBtn: {
    maxWidth: 88,
    height: 29,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityStatusBtnText: {
    fontWeight: '500',
    fontSize: 12,
    color: '#3B74BD',
  },
  activityStatusBtnTextDone: {
    color: '#6D925E',
  },
  activityStatusBtnTextPending: {
    color: '#EE9C44',
  },
  activityLocationText: {
    marginLeft: 18,
  },
  taskCardMedicationType: {
    marginLeft: 8,
    fontWeight: 400,
    fontSize: 14,
    color: AppTheme.textSecondary,
  },
  taskCardDesc: {
    fontWeight: "bold",
    fontSize: 14,
    color: AppTheme.textPrimary,
  },
  taskCardDescBtm: {
    marginTop: 4,
    fontWeight: 500,
    fontSize: 12,
    color: "#666666",
  },
  taskCardDescText: {
    fontWeight: "bold",
    fontSize: 14,
    color: AppTheme.textSecondary,
  },
  taskCardStatus: {
    marginLeft: 6,
    fontWeight: '400',
    fontSize: 14,
    color: AppTheme.textSecondary,
  },
  taskCardStatusButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCardStatusTakenIcon: {
    width: 13,
    height: 13,
  },
  taskCardStatusTaken: {
    color: AppTheme.primaryColor,
  },
  taskCardStatusAction: {
    color: AppTheme.primaryColor,
  },
});

export default styles;
