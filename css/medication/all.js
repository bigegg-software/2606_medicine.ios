import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { padding: 18, paddingTop: 2, paddingBottom: 40 },
    bodyEmpty: { flexGrow: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
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
        padding: 15,
    },
    medicationTitle: {
        flex: 1,
        marginRight: 12,
        fontWeight: 'bold',
        fontSize: 15,
        color: '#333333',
    },
    medicationTimeText: {
        fontWeight: '500',
        fontSize: 13,
        color: '#999999',
    },
    medicationDivider: {
        height: 1,
        backgroundColor: 'rgba(23,63,125,0.08)',
        marginVertical: 15,
    },
    medicationMetaLabel: {
        fontWeight: '500',
        fontSize: 13,
        color: '#999999',
        flexShrink: 0,
    },
    medicationMetaValue: {
        flex: 1,
        marginLeft: 16,
        fontWeight: '500',
        fontSize: 13,
        color: '#333333',
        textAlign: 'right',
    },
    medicationMetaRow: {
        marginTop: 12,
    },
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


    topText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333333',
    },




    navBox: {
        marginHorizontal: 18,
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDEEEF',
        borderRadius: 25,
        padding: 3,
    },
    navCol: {
        flex: 1,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 25,
    },
    navColActive: {
        backgroundColor: '#FFFFFF',
    },
    navText: {
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
    },
    activeNavText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333333',
    },

    rowLine: { height: 1, backgroundColor: "#E8DED2" },
    dayCard: {
        marginTop: 12,
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    dayCardExpanded: {
        paddingBottom: 0,
    },
    daySectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    daySectionTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: AppTheme.textPrimary,
    },
    daySectionToggleBtn: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    daySectionToggleIcon: {
        width: 14,
        height: 8,
    },
    colTitle: { fontWeight: 400, fontSize: 16, color: "#333333" },
    listBox: { marginTop: 4 },
    listItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(23,63,125,0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    listItemLast: {
        borderBottomWidth: 0,
    },
    listItemLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    listItemIcon: {
        width: 30,
        height: 30,
    },
    listItemContent: {
        flex: 1,
        marginLeft: 12,
    },
    listItemTitleWrap: {
        flex: 1,
        marginLeft: 6,
    },
    listItemTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333333',
    },
    listItemDose: {
        marginTop: 6,
        fontWeight: '500',
        fontSize: 13,
        color: '#999999',
    },
    listItemStatus: {
        marginLeft: 4,
        paddingHorizontal: 4,
        paddingVertical: 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        borderWidth: 1,
        flexShrink: 0,
    },
    listItemStatusTaken: {
        borderColor: '#6D925E',
    },
    listItemStatusMissed: {
        borderColor: '#EE9C44',
    },
    listItemStatusTextTaken: {
        fontWeight: 'bold',
        fontSize: 12,
        color: '#6D925E',
    },
    listItemStatusTextMissed: {
        fontWeight: 'bold',
        fontSize: 12,
        color: '#EE9C44',
    },
    listItemTime: {
        fontWeight: '500',
        fontSize: 14,
        color: '#999999',
        flexShrink: 0,
    },
    listItemText: {
        fontWeight: 400,
        fontSize: 14,
        color: AppTheme.textSecondary
    },
    listItemDw: {
        fontWeight: 400,
        fontSize: 14,
        marginTop: 2,
        marginBottom: 4,
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
        height: 26,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDEEEF',
        borderRadius: 25,
        padding: 2,
        position: 'relative',
    },
    sliderIndicator: {
        position: 'absolute',
        left: 2,
        top: 2,
        height: 22,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
    },
    sliderBtn: {
        minWidth: 44,
        height: 22,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 25,
        zIndex: 1,
    },
    sliderTextActive: {
        color: '#333333',
        fontSize: 11,
        fontWeight: '500',
    },
    sliderTextInactive: {
        color: '#333333',
        fontSize: 11,
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
        width: 103,
        height: 103,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightBox: {
        flex: 1,
        marginLeft: 21,
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
        fontWeight: "bold",
        fontSize: 18,
        color: '#333333',
    },
    barRow: {
        marginBottom: 12,
    },
    barLabelRow: {
        width: 200,
        marginBottom: 6,
    },
    barTrack: {
        width: 200,
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
