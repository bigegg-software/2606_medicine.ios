import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { padding: 18, paddingTop: 2, paddingBottom: 40 },
    bodyEmpty: { flexGrow: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyWrap: { flex: 1, justifyContent: 'center', paddingTop: 40 },
    sectionTitle: { marginLeft: 14, marginTop: 16, fontWeight: 500, fontSize: 18, color: AppTheme.textPrimary },
    pageBody: { flex: 1 },

    medicationBox: {
        marginTop: 12,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    medicationTitle: { fontWeight: 500, fontSize: 16, color: AppTheme.textPrimary, },
    medicationTimeText: { fontWeight: 400, fontSize: 12, color: AppTheme.textSecondary },
    medicationUsageText: { marginTop: 12, fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary },
    medicationTime: { width: 24, height: 24, marginRight: 6 },
    medicationText: { fontWeight: 400, fontSize: 14, color: "#000" },

    medicationCF: { height: 20, backgroundColor: "rgba(5,58,147,0.14)", borderRadius: 7, paddingHorizontal: 7, marginLeft: 11 },
    medicationCFText: { fontWeight: 500, fontSize: 12, color: "#053A93" },
    medicationGR: { height: 20, backgroundColor: "rgba(52,182,159,0.12)", borderRadius: 7, paddingHorizontal: 7, marginLeft: 11 },
    medicationGRText: { fontWeight: 400, fontSize: 12, color: "#34B69F" },

    swipeRow: {
        marginTop: 12,
        borderRadius: 18,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    swipeAction: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 72, zIndex: 0 },
    swipeForeground: { width: '100%', zIndex: 1, backgroundColor: '#FFFFFF', borderRadius: 18 },
    swipeDeleteBtn: { flex: 1, width: 72, justifyContent: 'center', alignItems: 'center' },
    swipeDeleteIcon: { width: 24, height: 24 },
    medicationBoxInSwipe: {
        shadowColor: 'transparent',
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        marginTop: 0,
    },



    topImg: {
        width: 24,
        height: 24,
        marginRight: 6
    },
    topText: {
        fontWeight: 500,
        fontSize: 16,
        color: "#333333"
    },





    navBox: { marginTop: 16, marginLeft: 8, paddingHorizontal: 18, paddingBottom: 0 },
    navCol: { paddingHorizontal: 8, marginHorizontal: 10 },
    navItemWrap: { position: 'relative', alignItems: 'center', paddingBottom: 12 },
    navText: { fontWeight: 400, fontSize: 16, color: "#999999", lineHeight: 22 },
    activeNavText: { color: AppTheme.primaryColor, fontWeight: 500, fontSize: 18, lineHeight: 24 },
    navIndicatorWrap: { position: 'absolute', left: 0, right: 0, bottom: 6, alignItems: 'center' },
    navIndicator: { width: 34, height: 10 },

    rowLine: { height: 1, backgroundColor: "#E8DED2" },
    colTitle: { fontWeight: 400, fontSize: 16, color: "#333333" },
    listBox: { marginTop: 12 },
    listItem: { marginBottom: 8 },
    listItemText: {
        fontWeight: 400,
        fontSize: 14,
        color: AppTheme.textSecondary
    },
    listItemDw: {
        fontWeight: 400,
        fontSize: 14,
        marginTop:2,
        marginBottom:4,
        color: AppTheme.textSecondary
    },
    leftText: {
        fontWeight: 400,
        fontSize: 14,
        color: AppTheme.textSecondary,
    },
    historyStatusPaused: {
        height: 24,
        backgroundColor: 'rgba(255,139,7,0.14)',
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    historyStatusPausedText: {
        fontWeight: 500,
        fontSize: 12,
        color: '#FF8B07',
    },
    historyStatusEnded: {
        height: 24,
        backgroundColor: 'rgba(23,63,125,0.08)',
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    historyStatusEndedText: {
        fontWeight: 500,
        fontSize: 12,
        color: AppTheme.primaryColor,
    },
    historyStopReason: {
        marginTop: 6,
        fontWeight: 400,
        fontSize: 12,
        color: '#FF8B07',
    },

    sliderContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(79,134,238,0.14)',
        borderRadius: 45,
        padding: 4,
        position: 'relative',
    },
    sliderIndicator: {
        position: 'absolute',
        width: 48,
        height: 23,
        borderRadius: 45,
        backgroundColor: '#173F7D',
        top: 4,
    },
    sliderBtn: {
        width: 48,
        height: 23,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 45,
    },
    sliderTextActive: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    sliderTextInactive: {
        color: "rgba(23,63,125,0.6)",
        fontSize: 14,
        fontWeight: '500',
    },

    chartCard: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingVertical: 24,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    chartSvgWrap: {
        width: "50%",
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightBox: {
        width: "50%",
        justifyContent: 'center',
    },
    chartLabelWrap: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartLabel: {
        fontWeight: '500',
        fontSize: 12,
        color: '#999999',
    },
    chartValue: {
        marginTop: 2,
        fontWeight: '500',
        fontSize: 18,
        color: '#4F86EE',
    },

    barRow: {
        marginBottom: 12,
    },
    barLabelRow: {
        width: 110,
        marginBottom: 6,
    },
    barTrack: {
        width: 110,
        height: 8,
        backgroundColor: '#EFEFEF',
        borderRadius: 17,
        overflow: 'hidden',
    },
    barFill: {
        height: 8,
        borderRadius: 17,
    },
    barLabel: {
        fontWeight: '500',
        fontSize: 14,
        color: '#666666',
    },
    barCount: {
        fontWeight: '500',
        fontSize: 14,
        color: '#666666',
    },
})

export default styles;
