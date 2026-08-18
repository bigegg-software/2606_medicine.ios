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
    vitalNoData:{
        paddingTop:160,
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
        fontWeight: '500',
        fontSize: 13,
        color: '#999999',
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
    prescriptionTypeBox: {
        marginTop: 15,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    prescriptionTypeCol: {
        width: '48%',
        padding: 14,
        backgroundColor: '#F6F8FB',
        borderRadius: 8,
    },
    prescriptionTypeIcon: {
        width: 18,
        height: 18,
    },
    prescriptionTypeTitle: {
        marginLeft: 6,
        fontWeight: '500',
        fontSize: 16,
        color: '#333333',
    },
    prescriptionTypeIntro: {
        marginTop: 4,
        fontWeight: '400',
        fontSize: 14,
        color: '#999999',
    },
  prescriptionTypeProgress: {
    marginTop: 15,
    alignSelf: 'center',
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
  medicationRemindText: {
    fontWeight: 'bold',
    fontSize: 13,
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
});

export default styles;
