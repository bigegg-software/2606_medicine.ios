import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { flex: 1, paddingHorizontal: 12, paddingTop: 12, },
    scrollNew: { paddingBottom: 40 },
    mH12: { marginHorizontal: 12 },
    bodyContent: { paddingBottom: 10 },
    commonWrap: {
        marginTop: 12,
        paddingHorizontal: 15,
        paddingVertical: 13,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#B4C9FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 4, elevation: 3
    },
    nutrientGrid: {
        marginTop: 12,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
    },
    nutrientLoading: {
        marginTop: 12,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    nutrientLoadingText: {
        fontWeight: '500',
        fontSize: 13,
        color: '#999999',
    },
    nutrientCard: {
        width: '31.5%',
        height: 60,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nutrientTitle: {
        fontWeight: '500',
        fontSize: 13,
        color: '#999999',
        textAlign: 'center',
    },
    nutrientValueRow: {
        marginTop: 4,
    },
    nutrientValue: {
        fontWeight: '500',
        fontSize: 18,
        color: '#333333',
        textAlign: 'center',
    },
    backImage1: { width: "100%", height: 50, marginTop: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    backImage1Text: { fontWeight: "bold", fontSize: 16, color: "#333333" },
    nutrientUnit: {
        fontWeight: '500',
        fontSize: 13,
        color: '#333333',
        marginLeft: 2,
        marginBottom: 2,
    },
    foodDetailNutrientGrid: {
        marginTop: 0,
        width: '100%',
        rowGap: 12,
        justifyContent: 'flex-start',
    },
    foodDetailNutrientCard: {
        backgroundColor: '#F6F8FB',
        // 一行 3 个，列间距 12：(100% - 12*2) / 3 ≈ 31.5%，用 margin 控制列间距
        width: '31.5%',
        marginRight: '2.75%',
    },
    foodDetailNutrientCardLast: {
        marginRight: 0,
    },
    foodItemRow: {
        marginBottom: 12,
        paddingHorizontal: 15,
        paddingVertical: 13,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
    foodItemName: {
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
    },
    foodItemMeta: {
        marginTop: 6,
        fontWeight: '400',
        fontSize: 12,
        color: '#999999',
    },
    foodItemKcal: {
        fontWeight: 'bold',
        fontSize: 13,
        color: '#6D925E',
    },
    detailMacroCard: {
        alignItems: 'flex-start',
        paddingVertical: 16,
    },
    detailMacroList: {
        width: '100%',
        gap: 8,
    },
    detailAmountCard: {
        alignItems: 'stretch',
        marginBottom: 24,
    },
    foodItemRightIcon: {
        width: 5, height: 9,
        marginLeft: 6
    },
    imageBox: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden', },
    iconImage: { width: 18, height: 18 },
    iconText: {
        marginLeft: 4,
        fontWeight: "bold",
        fontSize: 16,
        color: "#333333",
    },
    // 左右各占一半，中线始终居中
    summarySplitRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rlBox: {
        flex: 1,
        flexBasis: 0,
        minWidth: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rlValue: {
        fontWeight: "bold",
        fontSize: 25,
        color: "#333333",
        textAlign: 'center',
    },
    kllWrap: { marginTop: 12 },
    kllText: {
        fontWeight: "bold",
        fontSize: 14,
        color: "#999999",
        marginLeft: 6,
    },
    macroList: {
        flex: 1,
        flexBasis: 0,
        minWidth: 0,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    macroRow: {
        gap: 8,
    },
    macroDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    macroLabel: {
        width: 45,
        fontWeight: '500',
        fontSize: 13,
        color: '#666666',
    },
    macroValue: {
        width: 60,
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333333',
    },
    iconTextFood: {
        marginTop: 8,
        fontWeight: 500,
        fontSize: 13,
        color: "#666666"
    },
    iconImageBack: {
        width: 75,
        height: 75,
    },
    headerTimeBtn: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E7EAEB',
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    headerTimeText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333333',
    },
    headerTimeIcon: {
        width: 12,
        height: 12,
        marginLeft: 8
    },
    image: { width: 60, height: 60 },
    title: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
    },
    intro: {
        marginTop: 8,
        fontSize: 14,
        color: '#666666',
        lineHeight: 20,
    },
    summaryRow: {
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    summaryText: {
        fontSize: 13,
        color: '#666666',
    },
    summaryValue: {
        marginTop: 4,
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
    },
    foodCard: {
        marginTop: 12,
        padding: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(79,134,238,0.04)',
    },
    foodName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
    },
    foodMeta: {
        marginTop: 8,
        fontSize: 13,
        color: '#999999',
    },
    foodExpandText: {
        fontWeight: '500',
        fontSize: 12,
        color: '#173F7D',
    },
    foodManualIcon: {
        width: 15,
        height: 15,
        marginRight: 3,
    },
    foodManualBtn: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    foodManualText: {
        fontWeight: '500',
        fontSize: 13,
        color: '#333333',
    },
    foodDetailDivider: {
        marginVertical: 20,
        width: "100%",
        height: 1,
        backgroundColor: 'rgba(23,63,125,0.08)',
    },
    foodHeaderMain: {
        flex: 1,
        paddingRight: 12,
    },
    errorState: {
        paddingTop: 120,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
        textAlign: 'center',
    },
    errorIntro: {
        marginTop: 8,
        fontSize: 14,
        color: '#666666',
        lineHeight: 22,
        textAlign: 'center',
        paddingHorizontal: 24,
    },
    bottomBar: {
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: 40,
        backgroundColor: '#FEFEFE',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 12,
    },
    timeText: {
        fontWeight: 500,
        fontSize: 13,
        color: '#242424',
    },
    csImg: {
        width: 18,
        height: 18,
    },
    csText: {
        fontWeight: '500',
        fontSize: 13,
        marginLeft: 8,
        color: '#000000',
    },
    mealPeriodRow: {
        marginBottom: 12,
        flexWrap: 'wrap',
        gap: 8,
    },
    mealPeriodChip: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mealPeriodChipActive: {
        borderColor: '#6D925E',
    },
    primaryBtn: {
        marginTop: 4,
        height: 50,
        borderRadius: 12,
        backgroundColor: AppTheme.primaryColor,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryBtnIcon: {
        width: 20,
        height: 20,
        marginRight: 4,
    },
    primaryBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    secondaryBtn: {
        marginTop: 12,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: AppTheme.primaryColor,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: AppTheme.primaryColor,
    },
    recordTimeTitle: {
        fontWeight: '400',
        fontSize: 16,
        color: '#333333',
    },
    recordTimeValue: {
        fontWeight: '500',
        fontSize: 14,
        color: '#173F7D',
    },
    recordHeaderTextWrap: {
        flex: 1,
        minWidth: 0,
        marginLeft: 16,
        marginRight: 8,
    },
    recordDetailContent: {
        paddingBottom: 32,
    },
    recordFoodList: {
        gap: 12,
        paddingBottom: 8,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    emptyStateText: {
        fontSize: 14,
        fontWeight: '400',
        color: '#999999',
    },
    recordImg: {
        width: 17,
        height: 17,
        marginLeft: 6,
    },
    medicationBox: {
        marginTop: 18,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        paddingHorizontal: 24,
        paddingVertical: 18,
    },
    cfIcon: { width: 20, height: 20, marginRight: 6 },
    cfIconText: { fontWeight: 400, fontSize: 16, color: '#333333' },
    foodBox: {
        marginTop: 10,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: "rgba(79,134,238,0.04)",
        borderRadius: 18
    },
    foodText: {
        fontWeight: 400,
        fontSize: 12,
        color: '#999999',
    },
    foodInfo: {
        marginTop: 12
    },
    heatText: {
        fontWeight: "bold",
        fontSize: 32,
        color: "#333333",
    },
    rlImg: {
        width: 15,
        height: 15
    },
    rlText: {
        fontWeight: 400,
        fontSize: 12,
        color: "#333333"
    },
    lineBox: {
        width: 1,
        height: 81,
        backgroundColor: "rgba(23,63,125,0.08)",
        flexShrink: 0,
    },
    rightBox: {
        flex: 1
    },
    rightRow: {
        marginTop: 6
    },
    leftText: {
        marginLeft: 6,
        fontWeight: 400,
        fontSize: 12,
        color: "#333333",
    },
    btmLine: {
        marginTop: 12,
        height: 1,
        backgroundColor: "rgba(23,63,125,0.08)"
    },
    colBox: {
        width: "46%"
    },
    btmBox: {
        marginTop: 12,
    },
    wssText: {
        fontWeight: 400,
        fontSize: 12,
        color: "#333333"
    },
    wssValue: {
        fontWeight: '400',
        fontSize: 12,
        color: '#999999',
    },
    expandToggle: {
        marginTop: 12,
    },
    expandText: {
        fontWeight: '400',
        fontSize: 12,
        color: '#173F7D',
    },
    expandSection: {
        marginTop: 12,
    },
    expandRow: {
        marginTop: 12,
    },
    nutritionTable: {},
    foodDetailTitle: {
        marginTop: 18,
        marginLeft: 14,
        fontWeight: 500,
        fontSize: 18,
        color: "#333333",
    },
    foodAmount: {
        marginTop: 18,
        alignSelf: 'center',
        width: 72,
        height: 36,
        backgroundColor: "rgba(23,63,125,0.14)",
        borderRadius: 8,
    },
    foodAmountText: {
        fontWeight: '500',
        fontSize: 18,
        color: '#333333',
    },
    sliderWrap: {
        alignItems: 'center',
    },
    unitRow: {
        marginTop: 12,
        paddingHorizontal: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    unitChip: {
        width: 47,
        height: 25,
        borderRadius: 16,
        backgroundColor: 'rgba(109,146,94,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    unitChipSelected: {
        backgroundColor: '#6D925E',
    },
    unitChipText: {
        fontWeight: '500',
        fontSize: 13,
        color: '#6D925E',
    },
    unitChipTextSelected: {
        fontWeight: '500',
        fontSize: 13,
        color: '#FFFFFF',
    },
    foodDeleteBtn: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
    },
    foodDeleteIcon: {
        width: 18,
        height: 18,
    },
    collapseToggle: {
        marginTop: 24,
    },
});

export default styles;
