
import { StyleSheet } from 'react-native'
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    scheduleBox: {
        marginTop: 16,
        backgroundColor: '#FEFFFF',
        borderRadius: 16,
        paddingHorizontal: 24,
        paddingTop: 18,
        paddingBottom: 20,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    cfIcon: { width: 20, height: 20, marginRight: 6 },
    cfIconText: { fontWeight: 500, fontSize: 16, color: '#333333', },
    leftText: {
        fontWeight: 400,
        fontSize: 14,
        color: "#173F7D",
    },
    cfIconText1: { fontWeight: 400, fontSize: 16, color: '#333333' },
    cfContent: { paddingHorizontal: 9, marginTop: 25 },
    cfValue: { textAlign: 'center', fontWeight: "bold", fontSize: 19, color: '#FF8B07', },
    cfText: { textAlign: 'center', marginTop: 8, fontWeight: 400, fontSize: 12, color: "#666666" },
    cfLine: { marginTop: 25, height: 1, backgroundColor: "rgba(23,63,125,0.06)" },
    btmText: { fontWeight: "bold", fontSize: 18, color: "#333333", paddingHorizontal: 2, },
    btm1: { fontWeight: 400, fontSize: 12, color: "#666666" },
    ydbBox: { backgroundColor: "rgba(52,182,159,0.14)", borderRadius: 16, paddingHorizontal: 17, height: 21, marginLeft: 10, },
    ydbText: { fontWeight: 400, fontSize: 12, color: "#34B69F" },
    yyContent: {
        marginTop: 16,
        flexDirection: 'row',
        width: '100%',
    },
    yyItem: {
        width: "33.33%",
        alignItems: 'flex-start',
    },
    yyTitle: {
        fontWeight: 500,
        fontSize: 12,
        color: "#666666",
        marginRight: 8,
    },
    yyValue: {
        fontWeight: 500,
        fontSize: 12,
        color: "#333333",
    },
    yyUnit: {
        fontWeight: 500,
        fontSize: 12,
        color: "#666666",
    },
    statusText: {
        fontWeight: 500,
        fontSize: 12,
    },
    statusIcon: {
        width: 14,
        height: 14,
        marginLeft: 2,
    },
    ysBox: {
        paddingHorizontal: 21,
        paddingVertical: 16,
        borderRadius: 12,
    },
    stackWrap: {
        marginTop: 14,
        overflow: 'visible',
    },
    stackMainCard: {
        zIndex: 3,
        borderRadius: 12,
        backgroundColor: '#F1F6FF',
        shadowColor: '#4F86EE',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.39,
        shadowRadius: 3,
        elevation: 3,
    },
    mealSuggestEmpty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 32,
        minHeight: 132,
    },
    mealSuggestEmptyIcon: {
        width: 36,
        height: 36,
        marginBottom: 12,
        opacity: 0.35,
    },
    mealSuggestEmptyText: {
        fontWeight: 400,
        fontSize: 14,
        lineHeight: 20,
        color: '#999999',
        textAlign: 'center',
    },
    stackPeek: {
        height: 10,
        backgroundColor: '#F1F6FF',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        shadowColor: '#4F86EE',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 1,
    },
    stackPeekFirst: {
        marginTop: -1,
        marginHorizontal: 14,
        zIndex: 2,
    },
    stackPeekSecond: {
        marginTop: -1,
        marginHorizontal: 28,
        zIndex: 1,
    },
    ysRight: {
        flex: 1,
        minWidth: 0,
    },
    foodList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
    },
    ysIcon: {
        width: 24,
        height: 24,
    },
    ysText: {
        fontWeight: 500,
        fontSize: 14,
        color: "#333333"
    },
    wlrBox: {
        marginTop: 8,
        height: 25,
        paddingHorizontal: 10,
        alignSelf: 'flex-start',
        backgroundColor: "#FF8B07",
        borderRadius: 12,
    },
    wlrText: {
        fontWeight: 400,
        fontSize: 12,
        color: "#FFF"
    },
    line: {
        marginLeft: 14,
        marginRight: 6,
        height: 30,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lineDash: {
        width: 1,
        height: 3,
        backgroundColor: '#999999',
    },
    foodBox: {
        flexGrow: 0,
        flexShrink: 0,
        alignSelf: 'flex-start',
        maxWidth: '100%',
        marginLeft: 8,
        marginBottom: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: 'rgba(153,153,153,0.08)',
        borderRadius: 7,
        justifyContent: 'center',
    },
    foodText: {
        fontWeight: 500,
        fontSize: 12,
        color: '#333333',
        lineHeight: 18,
    },
    jyBox: {
        marginTop: 6,
        marginLeft: 8,
        alignSelf: 'flex-start',
        height: 25,
        paddingHorizontal: 10,
        backgroundColor: "rgba(153,153,153,0.08)",
        borderRadius: 7,
    },
    jyIcon: {
        width: 15,
        height: 15,
        marginRight: 5
    },
    jyText: {
        fontWeight: 500,
        fontSize: 12,
        color: "#FF8B07",
    },
    mealBox: {
        marginTop: 16,
        backgroundColor: '#FEFFFF',
        borderRadius: 16,
        paddingHorizontal: 15,
        paddingTop: 18,
        paddingBottom: 20,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    suggestBox: {
        marginTop: 8,
        paddingHorizontal: 26,
        paddingVertical: 12,
        backgroundColor: "rgba(79,134,238,0.04)",
        borderRadius: 18
    },
    suggestIcon: {
        width: 18,
        height: 18,
    },
    suggestTag: {
        width: 58,
        height: 18,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(243,63,62,0.14)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    suggestTagText: {
        fontWeight: '400',
        fontSize: 12,
        color: '#F33F3E',
    },
    aiSuggest: {
        marginTop: 4,
        fontWeight: 400,
        fontSize: 12,
        color: "#999999"
    },
    mealSelector: {
        width: '100%',
    },
    mealOption: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        paddingBottom: 6,
    },
    mealOptionText: {
        fontWeight: '400',
        fontSize: 14,
        color: '#333333',
    },
    mealOptionTextActive: {
        fontWeight: '500',
        color: '#173F7D',
    },
    mealRowWrap: {
        position: 'relative',
        width: '100%',
        marginTop: 17,
    },
    mealArrowPointer: {
        position: 'absolute',
        top: -12,
        width: 22,
        height: 12,
        zIndex: 2,
    },
    mealTitle: {
        fontWeight: 500,
        fontSize: 18,
        color: "#333333",
        marginLeft: 14
    },
    mealValue: {
        fontWeight: 400,
        fontSize: 14,
        color: "#333333",
    },
    mealValueNum: {
        fontWeight: 400,
        fontSize: 14,
        color: "#173F7D",
    },
    mealRow: {
        paddingHorizontal: 21,
        paddingVertical: 15,
        backgroundColor: '#F1F6FF',
        borderRadius: 18,
    },
    mealIcon: {
        width: 32,
        height: 32,
        borderRadius: 10
    },
    mealCol: {
        marginLeft: 8,
        flex: 1
    },
    mealColTitle: {
        fontWeight: 400,
        fontSize: 14,
        color: "#333333"
    },
    mealColText: {
        marginTop: 4,
        fontWeight: 400,
        fontSize: 12,
        color: "#999999"
    },
    kllText: {
        fontWeight: 400,
        fontSize: 12,
        color: "#999999"
    },
    waterValue: {
        fontWeight: "bold",
        fontSize: 24,
        color: "#333333",
    },
    waterTarget: {
        marginTop: 10,
        fontWeight: 400,
        fontSize: 16,
        color: "#999999",
    },
    waterTextCol: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
    },
    waterRow: {
        marginTop: 16,
        marginBottom: 20
    },
    waterCupWrap: {
        alignItems: 'center',
    },

    rowBox: { marginTop: 13 },
    colImg: {
        width: 20,
        height: 20
    },
    colText: {
        marginLeft: 4,
        fontWeight: 500,
        fontSize: 14,
        color: "#999999"
    },
    mealTabContainer: {
        flex: 1,
    },
    mealScroll: {
        paddingHorizontal: 18,
        paddingTop: 0,
    },
    mealScrollContent: {
        paddingBottom: 85,
    },
    mealBottomBar: {
        position: 'absolute',
        left: 18,
        right: 18,
        bottom: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 27,
        shadowColor: '#173F7D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
        elevation: 4,
        paddingHorizontal: 20,
        paddingVertical: 8,
        alignItems: 'center',
        zIndex: 2,
    },
    bottomInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
        paddingVertical: 4,
    },
    dinnerInput: {
        flex: 1,
        height: 36,
        borderRadius: 18,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#333333',
    },
    btmIconBox: {
        width: 36,
        height: 36,
        backgroundColor: "rgba(79,134,238,0.14)",
        borderRadius: 18
    },
    btmIcon: {
        width: 20,
        height: 20
    },
})

export default styles

