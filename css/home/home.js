import { StyleSheet } from 'react-native'
import { AppTheme } from '@/common/theme'

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F8FF' },
    scrollView: { flex: 1 },
    scroll: { paddingBottom: 40 },
    floatingHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        elevation: 20,
    },
    scrollTopMask: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 150,
        zIndex: 15,
        elevation: 15,
    },
    floatingHeaderInner: {
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
    },
    pd18: { paddingHorizontal: 18, paddingTop: 260, paddingBottom: 20 },
    miniLogo: { width: 99, height: 20 },
    topRight: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 40,
        minHeight: 40,
    },
    rightImg: {
        width: 20,
        height: 20,
    },
    redDot: {
        position: 'absolute',
        top: 2,
        right: -6,
        paddingHorizontal: 5,
        paddingVertical: 2,
        backgroundColor: "#FF0000",
        borderRadius: 13,
        minWidth: 18,
        alignItems: 'center',
    },
    redDotText: { fontWeight: "bold", fontSize: 10, color: "#FFFFFF" },
    blurViewShadow: {
        borderRadius: 12,
        shadowColor: '#D0E6FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 5,
        overflow: 'hidden',
        position: 'relative',

    },
    blurCardGradientFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    blurCardBlurFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    blurCardContent: { padding: 12, zIndex: 1 },
    blurCardHeader: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    blurViewBorderSvg: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    blurCardTitle: {
        marginLeft: 4,
        fontWeight: "bold",
        fontSize: 15,
        color: "#FFFFFF",
    },
    blurCardMore: {
        fontWeight: 500,
        fontSize: 13,
        color: "#FFFFFF"
    },
    blurCardMoreIcon: {
        width: 12,
        height: 12,
        marginLeft: 6,
        marginRight: 4
    },
    blurCardContentListBox: {
        marginTop: 10
    },
    blurCardContentList: {
        padding: 11,
        width: "31%",
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
    },
    blurCardListRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    blurCardListIcon: {
        width: 24,
        height: 24
    },
    blurCardListText: {
        fontWeight: "bold",
        fontSize: 11,
        color: "#333333",
        marginLeft: 4,
    },
    blurCardInfoIcon: {
        width: 9,
        height: 9,
        marginLeft: 3,
    },
    blurCardListMoreIcon: {
        width: 4,
        height: 5,
        marginLeft: 6,
    },
    blurCardValueCol: {
        marginTop: 8
    },
    blurCardValue: {
        fontWeight: "bold",
        fontSize: 20,
        color: "#333333"
    },
    blurCardUnit: {
        fontWeight: 400,
        fontSize: 10,
        marginBottom: 3,
        color: "#333333"
    },
    blurCardSparklineWrap: {
        marginTop: 4,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    blurCardProgressTrack: {
        width: 74,
        height: 5,
        backgroundColor: '#EFEFEF',
        borderRadius: 7,
        overflow: 'hidden',
    },
    blurCardProgressFill: {
        height: 5,
        backgroundColor: '#72A1C5',
        borderRadius: 7,
    },
    blurCardValueText: {
        marginTop: 5,
        fontWeight: 500,
        fontSize: 9,
        color: "#666666"
    },
    scheduleBoxShadow: {
        marginTop: 8,
        borderRadius: 12,
        shadowColor: '#D0E6FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    scheduleBox: {
        minHeight: 169,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        overflow: 'hidden',
    },
    scheduleBoxGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    scheduleBoxContent: {
        padding: 12,
    },
    cfIcon: { width: 20, height: 20 },
    cfIconText: { marginLeft: 4, fontWeight: "bold", fontSize: 15, color: "#131141", },
    cfMore: { fontWeight: 500, fontSize: 13, color: "#666666" },
    cfMoreIcon: { width: 12, height: 12, marginLeft: 6 },
    cfContent: { paddingHorizontal: 3, marginTop: 18 },
    cfEmpty: {
        alignItems: 'center',
        marginTop: 18,
        paddingBottom: 8,
    },
    cfEmptyIcon: { width: 50, height: 50 },
    cfEmptyText: {
        marginTop: 8,
        fontWeight: '500',
        fontSize: 12,
        color: '#999999',
        textAlign: 'center',
    },
    cfEmptyLink: {
        fontWeight: '500',
        fontSize: 12,
        color: AppTheme.primaryColor,
    },
    cfItem: { alignItems: 'center' },
    cfValue: { textAlign: 'center', fontWeight: "bold", fontSize: 18, color: '#333333', },
    cfText: { textAlign: 'center', marginTop: 8, fontWeight: 500, fontSize: 12, color: "#666666" },
    cfProgressTrack: {
        width: 70,
        height: 5,
        marginTop: 8,
        backgroundColor: '#ECF3FF',
        borderRadius: 6,
        overflow: 'hidden',
    },
    cfProgressFill: {
        height: 5,
        borderRadius: 6,
    },
    cfBottom: {
        marginTop: 18,
        backgroundColor: "#F6F8FB",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    btmText: { fontWeight: "bold", fontSize: 18, color: "#333333", paddingHorizontal: 4, },
    btm1: { fontWeight: 500, fontSize: 12, color: "#666666" },
    ydbBox: { backgroundColor: "rgba(109,146,94,0.16)", borderRadius: 4, paddingHorizontal: 19, height: 21, marginLeft: 12, },
    ydbText: { fontWeight: 500, fontSize: 12, color: "#6D925E" },
    yyContent: {
        marginTop: 11,
        paddingHorizontal: 6,
    },
    yyEmptyTip: {
        margin: 12,
        height: 39,
        backgroundColor: 'rgba(254,248,225,0.2)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(238,156,68,0.3)',
        paddingHorizontal: 12,
    },
    yyEmptyTipIcon: {
        width: 15,
        height: 15,
        marginRight: 6,
    },
    yyEmptyTipText: {
        flex: 1,
        flexShrink: 1,
        fontWeight: '500',
        fontSize: 12,
        color: '#C98A41',
    },
    yyEmptyTipLink: {
        marginLeft: 2,
        fontWeight: '500',
        fontSize: 12,
        color: AppTheme.primaryColor,
    },
    yyItem: {
        width: '33.33%',
    },
    yyItemRight: {
        flex: 1,
        minWidth: 0,
        marginLeft: 6,
    },
    yyValueRow: {
        alignItems: 'center',
    },
    yyValueScroll: {
        maxWidth: 36,
    },
    yyUnitScroll: {
        maxWidth: 44,
        flexShrink: 1,
    },
    yyTitle: {
        fontWeight: 500,
        fontSize: 12,
        marginTop: 4,
        color: "#333333",
    },
    yyValue: {
        fontWeight: "bold",
        fontSize: 13,
        color: "#333333",
    },
    yyUnit: {
        fontWeight: 500,
        fontSize: 12,
        color: "#999999",
    },
    ysBox: {
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 2,
    },
    ysIcon: {
        width: 22,
        height: 22,
    },
    ysText: {
        fontWeight: "bold",
        fontSize: 14,
        marginLeft: 12,
        color: "#333333"
    },
    wlrBox: {
        marginLeft: 8,
        height: 25,
        backgroundColor: "rgba(238,156,68,0.1)",
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#EE9C44",
        paddingHorizontal: 10
    },
    wlrBoxLogged: {
        backgroundColor: 'rgba(109,146,94,0.1)',
        borderColor: "#6D925E",
    },
    wlrText: {
        fontWeight: 400,
        fontSize: 12,
        color: "#EE9C44"
    },
    wlrTextLogged: {
        color: "#6D925E"
    },
    line: {
        height: 30,
        width: 2,
        marginHorizontal: 15,
        backgroundColor: "#F0F4F7"
    },
    foodChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: "rgba(153,153,153,0.08)",
        borderRadius: 7,
        justifyContent: 'center',
        flexShrink: 0,
    },
    foodChipShrink: {
        flex: 1,
        minWidth: 0,
        flexShrink: 1,
    },
    foodText: {
        fontWeight: 500,
        fontSize: 12,
        color: "#333333",
    },
    foodArea: {
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
    },
    foodList: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
        gap: 6,
    },
    foodEllipsis: {
        fontWeight: 500,
        fontSize: 12,
        color: "#333333",
        flexShrink: 0,
    },
    jyBox: {
        marginTop: 10,
        height: 25,
    },
    jyIcon: {
        width: 15,
        height: 15,
        marginRight: 5
    },
    jyText: {
        fontWeight: 500,
        fontSize: 12,
        color: "#6D925E",
    }

})

export default styles
