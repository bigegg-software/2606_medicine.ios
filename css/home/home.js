import { StyleSheet } from 'react-native'
import { AppTheme } from '@/common/theme'

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F8FF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F8FF' },
    scrollView: { flex: 1 },
    scroll: { paddingBottom: 40 },
    pd18: { paddingHorizontal: 18 },
    banner: { marginTop: 18 },
    topLeft: { flexDirection: 'row', alignItems: 'center' },
    miniLogo: { width: 149, height: 30 },
    topRight: { flexDirection: 'row', alignItems: 'center', position: 'relative', marginRight: 18 },
    rightImg: { width: 26, height: 26 },
    redDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#D80010", position: "absolute", top: 6, right: 6 },
    colBoxes: { marginTop: 18 },
    colBox: { height: 76, padding: 10, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', },
    colBg: { borderRadius: 16, },
    imgIcon: { width: 26, height: 26, },
    colText: { marginTop: 2, fontWeight: 500, fontSize: 12, color: '#FFFFFF', },
    colValue: { marginTop: 4, fontWeight: 500, fontSize: 10, color: 'rgba(255,255,255,0.6)', },
    scheduleBox: {
        marginTop: 16,
        backgroundColor: '#FEFFFF',
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingTop: 20,
        paddingBottom: 18,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    cfIconBox: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#173F7D", },
    cfIcon: { width: 12, height: 12, },
    cfIconText: { marginLeft: 6, fontWeight: 500, fontSize: 14, color: '#333333', },
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
    },
    yyItem: {},
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
    ysBox: {
        marginTop: 12,
        paddingHorizontal: 21,
        paddingVertical: 16,
        backgroundColor: "rgba(79,134,238,0.04)",
        borderRadius: 12,
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
        backgroundColor: "#FF8B07",
        borderRadius: 12,
    },
    wlrText: {
        fontWeight: 400,
        fontSize: 12,
        color: "#FFF"
    },
    line: {
        marginHorizontal: 14,
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
        width: 56,
        height: 25,
        backgroundColor: "rgba(153,153,153,0.08)",
        borderRadius: 7,
    },
    foodText: {
        fontWeight: 500,
        fontSize: 12,
        color: "#333333",
    },
    jyBox: {
        marginTop: 6,
        height: 25,
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
    }

})

export default styles
