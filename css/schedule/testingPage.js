import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F7F7F9" },
    page: { flex: 1 },
    body: { flex: 1 },
    scroll: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 18 },
    /** 测试记录列表页：收紧顶部间距 */
    recordScroll: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 18 },
    scrollEmpty: { flexGrow: 1 },
    rowBox: { position: "relative", backgroundColor: "#FFF", marginTop: 10, padding: 10, borderRadius: 15, shadowColor: '#B4C9FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 4, elevation: 3 },
    rowTitle: { fontWeight: 800, fontSize: 15, color: "#333333" },
    rowImg: { width: 13, height: 13, marginRight: 4 },
    rowImgDown: { transform: [{ rotate: '180deg' }] },
    rowText: { fontWeight: 800, fontSize: 13, color: "#6D925E" },
    rowTextDown: { color: "#E85D4C" },
    rightBox: { borderTopRightRadius: 15, position: "absolute", right: 0, top: 0, height: 30, backgroundColor: "#6D925E", paddingRight: 15 },
    rightImg: { width: 20, height: 30, position: "absolute", left: -20, top: 0 },
    rightTime: { width: 12, height: 12, marginRight: 6 },
    rightText: { fontWeight: 500, fontSize: 13, color: "#FFFFFF" },
    gaugeBox: { alignItems: 'center', minWidth: 150, marginTop: 15 },
    gaugeWrap: { width: 150, height: 75, overflow: 'visible' },
    gaugeDot: { position: 'absolute', width: 30, height: 30 },
    gaugeTopCenter: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
    gaugeTopCenterBox: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center" },
    gaugeTopCenterValue: { fontWeight: "bold", fontSize: 22, color: "#333333", textAlign: "center" },
    gaugeTopCenterText: { marginTop: 4, marginBottom: -4, fontWeight: 500, fontSize: 13, color: "#666666", textAlign: "center" },
    gaugeTitleBox: { flex: 1 },
    gaugeValue: { marginTop: 26, fontWeight: "bold", fontSize: 22, color: "#333333", textAlign: "center" },
    gaugeText: { marginTop: 8, fontWeight: 500, fontSize: 13, color: "#666666", textAlign: "center" },
    gaugeUpBox: {
        marginTop: 10,
        alignSelf: 'center',
        backgroundColor: "#FFFFFF",
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#6D925E",
        paddingHorizontal: 8,
        paddingVertical: 4
    },
    gaugeUpImg: { width: 8, height: 8 },
    gaugeUpText: { fontWeight: "bold", fontSize: 11, color: "#6D925E", marginLeft: 4 },
    jointRomList: { marginTop: 8 },
    jointRomItem: { marginTop: 18 },
    jointRomCard: {
        marginTop: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        shadowColor: '#B4C9FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 4,
        elevation: 3,
    },
    jointRomTitleWrap: {
        flex: 1,
        flexShrink: 1,
        minWidth: 0,
        paddingRight: 8,
    },
    jointRomTitle: {
        flexShrink: 1,
        fontWeight: '500',
        fontSize: 15,
        color: '#333333',
    },
    jointRomStatus: {
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#6D925E',
        paddingHorizontal: 8,
        paddingVertical: 5,
    },
    jointRomStatusWarn: { borderColor: '#EE9C44' },
    jointRomStatusMuted: { borderColor: '#CCCCCC' },
    jointRomStatusText: { fontWeight: 'bold', fontSize: 11, color: '#6D925E' },
    jointRomStatusTextWarn: { color: '#EE9C44' },
    jointRomStatusTextMuted: { color: '#999999' },
    jointRomMetrics: { marginTop: 4 },
    jointRomMetricBox: { flex: 1, alignItems: 'center' },
    jointRomMetricValue: {
        marginTop: 10,
        fontWeight: 'bold',
        fontSize: 22,
        color: '#333333',
        textAlign: 'center',
    },
    jointRomMetricLabel: {
        marginTop: 8,
        fontWeight: '500',
        fontSize: 13,
        color: '#666666',
        textAlign: 'center',
    },
    infoBox: { backgroundColor: "#FEFFFF", marginTop: 10, padding: 15, borderRadius: 12, shadowColor: '#B4C9FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 4, elevation: 3 },
    infoTitle: { fontWeight: "bold", fontSize: 16, color: "#333333" },
    infoItem: { position: 'relative', marginTop: 15, padding: 15, backgroundColor: "#F6F8FB", borderRadius: 8 },
    infoItemText: { fontWeight: 500, fontSize: 14, color: "#333333", lineHeight: 24 },
    infoItemNumBox: {
        marginTop: 2,
        width: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F6F8FB',
        borderRadius: 9,
        backgroundColor: "#dbe3dc"
    },
    infoItemNum: {
        fontWeight: "bold",
        fontSize: 12,
        color: "#6D925E"
    },
    infoStepLineCol: {
        width: 18,
        alignItems: 'center',
        marginRight: 6,
        zIndex: 1,
    },
    infoStepDashLine: {
        position: 'absolute',
        width: 1,
        zIndex: 0,
    },
    infoStepRowGap: {
        marginTop: 12,
    },
    infoStepText: {
        flex: 1,
        fontWeight: 500,
        fontSize: 14,
        color: '#333333',
        lineHeight: 24,
    },
    leftBor: {
        width: 6,
        height: 6,
        marginRight: 6,
        backgroundColor: "#EE9C44",
        borderRadius: 10,
    },
    infoItemImg: {
        width: 36,
        height: 36,
    },
    infoAllText: {
        fontWeight: 500,
        fontSize: 13,
        color: "#666666",
        marginRight: 6
    },
    infoAllImg: {
        width: 5,
        height: 9,
    },
    infoRecordBox: {
        marginTop: 9
    },
    infoRecordBoxOnPage: {
        marginTop: 0,
    },
    infoRecordBoxEmpty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 0,
    },
    infoRecordEmpty: {
        paddingVertical: 24,
    },
    infoRecordItem: {
        marginTop: 6,
        backgroundColor: "#F6F8FB",
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 18
    },
    /** 测试记录列表页数据卡片背景（仅 record 使用） */
    infoRecordItemOnPage: {
        backgroundColor: '#FEFFFF',
    },
    infoRecordText: {
        fontWeight: "bold",
        fontSize: 14,
        color: "#333333",
        marginRight: 6
    },
    infoRecordStatus: {
        alignSelf: 'flex-start',
        backgroundColor: "#FFFFFF",
        borderRadius: 4,
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderColor: "#6D925E",
    },
    infoRecordStatusText: {
        fontWeight: "bold",
        fontSize: 11,
        color: "#6D925E",
    },
    infoRecordTime: {
        fontWeight: 500,
        fontSize: 12,
        color: "#666666",
    },
    infoRecordImg: {
        width: 50,
        height: 50,
        marginRight: 12
    },
    jointRomRecordCard: {
        backgroundColor: '#FEFFFF',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#B4C9FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 4,
        elevation: 3,
    },
    jointRomRecordCardCompact: {
        shadowOpacity: 0,
        elevation: 0,
        shadowRadius: 0,
        backgroundColor: 'transparent',
        padding: 0,
        borderRadius: 0,
    },
    jointRomRecordCardTitle: {
        flexShrink: 1,
        fontWeight: '500',
        fontSize: 16,
        color: '#333333',
        paddingRight: 8,
    },
    jointRomRecordCardDate: {
        flexShrink: 0,
        fontWeight: '400',
        fontSize: 13,
        color: '#666666',
    },
    jointRomRecordCardDateLeft: {
        fontWeight: '400',
        fontSize: 13,
        marginTop: 10,
        color: '#666666',
        textAlign: 'left',
    },
    jointRomRecordInnerList: {
        marginTop: 12,
    },
    jointRomRecordInner: {
        backgroundColor: '#F6F8FB',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderWidth: 0,
    },
    jointRomRecordInnerFlat: {
        // compact：保留灰底，去掉描边/外框感
        borderWidth: 0,
        borderColor: 'transparent',
    },
    jointRomRecordInnerFirst: {
        marginTop: 0,
    },
    jointRomRecordInnerSpacing: {
        marginTop: 6,
    },
    jointRomRecordLabel: {
        flex: 1.1,
        flexShrink: 1,
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
        paddingRight: 6,
    },
    jointRomRecordStatus: {
        flex: 1,
        flexShrink: 1,
        textAlign: 'center',
        fontWeight: '500',
        fontSize: 12,
        color: '#6D925E',
        paddingHorizontal: 4,
    },
    jointRomRecordStatusWarn: {
        color: '#EE9C44',
    },
    jointRomRecordValueWrap: {
        flex: 0.9,
        justifyContent: 'flex-end',
    },
    jointRomRecordTrendIcon: {
        width: 12,
        height: 12,
        marginRight: 4,
    },
    jointRomRecordValue: {
        fontWeight: '500',
        fontSize: 16,
        color: '#333333',
    },
    infoRecordUpImg: {
        width: 12,
        height: 12,
        marginRight: 6
    },
    bottomBar: {
        width: '100%',
        paddingHorizontal: 15,
        paddingTop: 18,
        backgroundColor: '#FEFEFE',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        shadowColor: '#B4C9FF',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.14,
        shadowRadius: 4,
        elevation: 3,
    },
    bottomBarButtonLeft: {
        height: 50,
        width: '48%',
        backgroundColor: '#6D925E',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#6D925E',
    },
    bottomBarButtonRight: {
        height: 50,
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#6D925E',
    },
    bottomBarButtonImg: {
        width: 20,
        height: 20,
        marginRight: 4,
    },
    bottomBarButtonTextLeft: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    bottomBarButtonTextRight: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#6D925E',
    },
    pgBox: {
        marginTop: 24,
        marginBottom: 12
    },
    pgText: {
        marginTop: 18,
        marginLeft: 5,
        marginRight: 12,
        fontWeight: "bold",
        fontSize: 13,
        color: "#333333"
    },
    pgColorBarContainer: {
        flex: 1,
        marginRight: 6,
    },
    pgColorBarRow: {
        gap: 2,
    },
    pgColorBarSegment: {
        flex: 1,
    },
    pgColorBarFirst: {
        height: 6,
        backgroundColor: '#C2C2C2',
        borderTopLeftRadius: 5,
        borderBottomLeftRadius: 5,
    },
    pgColorBarSecond: {
        height: 6,
        backgroundColor: '#72A1C5',
    },
    pgColorBarThird: {
        height: 6,
        backgroundColor: '#6D925E',
        borderTopRightRadius: 5,
        borderBottomRightRadius: 5,
    },
    pgBarText: {
        marginTop: 4,
        textAlign: 'center',
        fontWeight: 500,
        fontSize: 12,
        color: '#999999',
    },
    pgBarLabelsRow: {
        marginTop: 4,
    },
    pgIndicatorArea: {
        height: 23,
        marginBottom: 2,
        position: 'relative',
    },
    pgIndicatorWrap: {
        position: 'absolute',
        bottom: 0,
        width: 33,
        alignItems: 'center',
        zIndex: 1,
    },
    pgIndicatorTriangle: {
        width: 0,
        height: 0,
        borderLeftWidth: 2.5,
        borderRightWidth: 2.5,
        borderTopWidth: 5,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
    pgIndicatorBox: {
        width: 33,
        borderRadius: 20,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pgIndicatorText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
});

export default styles;
