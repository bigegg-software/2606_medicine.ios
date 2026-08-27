import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  scroll: { paddingHorizontal: 12, paddingBottom: 40 },
  familyTabBar: {
    marginTop: 10,
    minHeight: 36,
  },
  familyTabBarInner: {
    height: 36,
  },
  familyTabScrollWrap: {
    flex: 1,
  },
  familyTabScroll: {
    alignItems: 'center',
  },
  familyTabGap: {
    marginLeft: 10,
  },
  familyTabSelected: {
    height: 36,
    minWidth: 52,
    paddingBottom: 4,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  familyTabSelectedText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  familyTabUnselected: {
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 500,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  familyTabUnselectedText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333333',
  },
  familyListEmpty: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  familyListEmptyText: {
    fontWeight: '400',
    fontSize: 13,
    color: '#999999',
  },
  sectionEmpty: {
    marginTop: 15,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F8FB',
    borderRadius: 12,
  },
  vitalCard: {
    marginTop: 12,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  vitalNoData: {
    paddingTop: 160,
  },
  vitalHeaderTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333333',
  },
  vitalHeaderRight: {
    fontWeight: '500',
    fontSize: 13,
    color: '#666666',
  },
  vitalRow: {
    marginTop: 11,
    gap: 11,
  },
  vitalRowFirst: {
    marginTop: 15,
  },
  vitalItem: {
    flex: 1,
    backgroundColor: '#F6F8FB',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  vitalItemPlaceholder: {
    flex: 1,
  },
  vitalIcon: {
    width: 18,
    height: 18,
  },
  vitalLabel: {
    marginLeft: 4,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333333',
    flexShrink: 1,
  },
  vitalDate: {
    marginTop: 8,
    fontWeight: '500',
    fontSize: 12,
    color: '#999999',
  },
  vitalStatus: {
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    flexShrink: 0,
    maxWidth: '52%',
  },
  vitalStatusText: {
    fontWeight: '600',
    fontSize: 11,
  },
  vitalValue: {
    marginTop: 12,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333333',
  },
  vitalValueSuffix: {
    fontWeight: '500',
    fontSize: 11,
    color: '#666666',
  },
  vitalTrendBtn: {
    marginTop: 15,
    padding: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  vitalTrendBtnText: {
    fontWeight: '500',
    fontSize: 15,
    color: '#333333',
  },
  vitalTrendArrow: {
    width: 5,
    height: 9,
    marginLeft: 8,
  },
  /** 运动处方卡片：对齐首页 HomeTab 样式（不含底部目标行） */
  exerciseRxShadow: {
    marginTop: 12,
    borderRadius: 12,
    shadowColor: '#D0E6FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  exerciseRxBox: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  exerciseRxGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  exerciseRxContent: {
    padding: 12,
  },
  exerciseRxIcon: {
    width: 20,
    height: 20,
  },
  exerciseRxTitle: {
    marginLeft: 4,
    fontWeight: 'bold',
    fontSize: 15,
    color: '#131141',
  },
  exerciseRxMore: {
    fontWeight: '500',
    fontSize: 13,
    color: '#666666',
  },
  exerciseRxMoreIcon: {
    width: 12,
    height: 12,
    marginLeft: 6,
  },
  exerciseRxMetrics: {
    paddingHorizontal: 3,
    marginTop: 18,
  },
  exerciseRxItem: {
    alignItems: 'center',
  },
  exerciseRxValue: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333333',
  },
  exerciseRxLabel: {
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
    fontSize: 12,
    color: '#666666',
  },
  exerciseRxProgressTrack: {
    width: 70,
    height: 5,
    marginTop: 8,
    backgroundColor: '#ECF3FF',
    borderRadius: 6,
    overflow: 'hidden',
  },
  exerciseRxProgressFill: {
    height: 5,
    borderRadius: 6,
  },
  mealNutritionBox: {
    marginTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealNutritionItem: {
    width: '48%',
    backgroundColor: '#F6F8FB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  mealNutritionIcon: {
    width: 18,
    height: 18,
  },
  mealNutritionTitle: {
    marginLeft: 4,
    flex: 1,
    fontWeight: 'bold',
    fontSize: 13,
  },
  mealNutritionStatus: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  mealNutritionStatusText: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  mealNutritionValue: {
    marginTop: 8,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333333',
  },
  mealNutritionValueTarget: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#999999',
  },
  mealNutritionBarTrack: {
    marginTop: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ECEDF1',
    overflow: 'hidden',
  },
  mealNutritionBarFill: {
    height: 6,
    borderRadius: 3,
  },
  medicationItem: {
    backgroundColor: '#F6F8FB',
    borderRadius: 12,
    padding: 15,
  },
  medicationItemFirst: {
    marginTop: 15,
  },
  medicationItemGap: {
    marginTop: 12,
  },
  medicationIcon: {
    width: 30,
    height: 30,
  },
  medicationTitleWrap: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    marginRight: 8,
  },
  medicationTitle: {
    flexShrink: 1,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333333',
  },
  medicationMeta: {
    marginTop: 5,
    fontSize: 12,
    color: '#888888',
  },
  medicationStatusBadge: {
    flexShrink: 0,
    marginLeft: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  medicationStatusTaken: {
    backgroundColor: 'rgba(109,146,94,0.06)',
    borderColor: 'rgba(109,146,94,0.3)',
  },
  medicationStatusUntaken: {
    backgroundColor: 'rgba(251,69,80,0.06)',
    borderColor: 'rgba(251,69,80,0.3)',
  },
  medicationStatusText: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  medicationStatusTextTaken: {
    color: '#6D925E',
  },
  medicationStatusTextUntaken: {
    color: '#FB4550',
  },
  medicationMissedBadge: {
    flexShrink: 0,
    marginLeft: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(251,69,80,0.06)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(251,69,80,0.3)',
  },
  medicationMissedText: {
    fontWeight: 'bold',
    fontSize: 11,
    color: '#FB4550',
  },
  medicationTakenBadge: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  medicationTakenIcon: {
    width: 16,
    height: 16,
    marginRight: 7,
  },
  medicationTakenText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#6D925E',
  },
  medicationRemindBtn: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6D925E',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  medicationRemindBtnDisabled: {
    backgroundColor: '#CBCBCB',
  },
  medicationRemindText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  medicationRemindTextDisabled: {
    color: '#FFFFFF',
  },
  assessmentItem: {
    backgroundColor: '#F6F8FB',
    borderRadius: 12,
    padding: 15,
  },
  assessmentItemFirst: {
    marginTop: 15,
  },
  assessmentItemGap: {
    marginTop: 12,
  },
  assessmentTextWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  assessmentTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333333',
  },
  assessmentSubtitle: {
    marginTop: 6,
    fontWeight: '500',
    fontSize: 12,
    color: '#999999',
  },
  assessmentReportBtn: {
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  assessmentReportBtnText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#6D925E',
  },
  /** 运动处方进度：对齐首页 HomeTab cf* 内容区样式 */
  prescriptionCfContent: {
    paddingHorizontal: 3,
    marginTop: 18,
  },
  prescriptionCfItem: {
    alignItems: 'center',
  },
  prescriptionCfValue: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333333',
  },
  prescriptionCfText: {
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
    fontSize: 12,
    color: '#666666',
  },
  prescriptionCfProgressTrack: {
    width: 70,
    height: 5,
    marginTop: 8,
    backgroundColor: '#ECF3FF',
    borderRadius: 6,
    overflow: 'hidden',
  },
  prescriptionCfProgressFill: {
    height: 5,
    borderRadius: 6,
  },
  /** 用餐记录：对齐首页营养处方内容区 */
  mealYyContent: {
    marginTop: 11,
    paddingHorizontal: 6,
  },
  mealYyItem: {
    width: '33.33%',
  },
  mealYyItemRight: {
    flex: 1,
    minWidth: 0,
    marginLeft: 6,
  },
  mealYyValueRow: {
    alignItems: 'center',
  },
  mealYyTitle: {
    fontWeight: '500',
    fontSize: 12,
    marginTop: 4,
    color: '#333333',
  },
  mealYyValue: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#333333',
    flexShrink: 1,
  },
  mealYyUnit: {
    fontWeight: '500',
    fontSize: 12,
    color: '#999999',
    flexShrink: 1,
  },
  mealYsBox: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  mealYsIcon: {
    width: 22,
    height: 22,
  },
  mealYsText: {
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 12,
    color: '#333333',
  },
  mealWlrBox: {
    marginLeft: 8,
    height: 21,
    backgroundColor: 'rgba(238,156,68,0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EE9C44',
    paddingHorizontal: 10,
  },
  mealWlrBoxLogged: {
    backgroundColor: 'rgba(109,146,94,0.1)',
    borderColor: '#6D925E',
  },
  mealWlrText: {
    fontWeight: '400',
    fontSize: 12,
    color: '#EE9C44',
  },
  mealWlrTextLogged: {
    color: '#6D925E',
  },
  mealLine: {
    height: 30,
    width: 2,
    marginHorizontal: 15,
    backgroundColor: '#F0F4F7',
  },
  mealFoodArea: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  mealFoodList: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 6,
  },
  mealFoodChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(153,153,153,0.08)',
    borderRadius: 7,
    justifyContent: 'center',
    flexShrink: 0,
  },
  mealFoodChipShrink: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  mealFoodText: {
    fontWeight: '500',
    fontSize: 12,
    color: '#333333',
  },
  mealFoodEllipsis: {
    fontWeight: '500',
    fontSize: 12,
    color: '#333333',
    flexShrink: 0,
  },
  mealJyBox: {
    marginTop: 10,
    height: 25,
  },
  mealJyIcon: {
    width: 15,
    height: 15,
    marginRight: 5,
  },
  mealJyText: {
    fontWeight: '500',
    fontSize: 12,
    color: '#6D925E',
  },
  mealYyEmptyTip: {
    marginTop: 10,
    minHeight: 39,
    backgroundColor: 'rgba(254,248,225,0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(238,156,68,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mealYyEmptyTipIcon: {
    width: 15,
    height: 15,
    marginRight: 6,
  },
  mealYyEmptyTipText: {
    flex: 1,
    flexShrink: 1,
    fontWeight: '500',
    fontSize: 12,
    color: '#C98A41',
  },
});

export default styles;
