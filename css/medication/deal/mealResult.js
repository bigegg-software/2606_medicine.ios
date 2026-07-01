import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    page: { flex: 1, },
    body: { flex: 1, paddingHorizontal: 18, paddingTop: 12, },
    bodyContent: { paddingBottom: 10 },
    imageBox: { width: '100%', height: 208, borderRadius: 18, overflow: 'hidden', },
    image: { width: '100%', height: '100%', },
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
    foodManualText: {
        fontWeight: '500',
        fontSize: 12,
        color: '#053A93',
    },
    foodHeaderMain: {
        flex: 1,
        paddingRight: 12,
    },
    errorTitle: {
        marginTop: 24,
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
        marginLeft: 4,
        color: '#000000',
    },
    mealPeriodRow: {
        marginBottom: 12,
        flexWrap: 'wrap',
        gap: 8,
    },
    mealPeriodChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mealPeriodChipActive: {
        borderColor: '#4F86EE',
    },
    primaryBtn: {
        marginTop: 4,
        height: 50,
        borderRadius: 12,
        backgroundColor: AppTheme.primaryColor,
        justifyContent: 'center',
        alignItems: 'center',
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
        width: 18,
        height: 18
    },
    rlText: {
        fontWeight: 400,
        fontSize: 12,
        color: "#333333"
    },
    lineBox: {
        marginHorizontal: 21,
        width: 1,
        height: 66,
        backgroundColor: "rgba(23,63,125,0.08)"
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
        marginTop: 12,
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
        backgroundColor: 'rgba(23,63,125,0.14)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    unitChipSelected: {
        backgroundColor: '#053A93',
    },
    unitChipText: {
        fontWeight: '400',
        fontSize: 12,
        color: '#053A93',
    },
    unitChipTextSelected: {
        fontWeight: '500',
        fontSize: 12,
        color: '#FFFFFF',
    },
    collapseToggle: {
        marginTop: 24,
    },
});

export default styles;
