import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    pageBody: { flex: 1 },
    navBox: { marginTop: 16, marginLeft: 8, paddingBottom: 0 },
    navCol: { paddingHorizontal: 8 },
    navItemWrap: { position: 'relative', alignItems: 'center', paddingBottom: 12 },
    navText: { fontWeight: 400, fontSize: 16, color: "#999999", lineHeight: 22 },
    activeNavText: { color: AppTheme.primaryColor, fontWeight: 500, fontSize: 18, lineHeight: 24 },
    navIndicatorWrap: { position: 'absolute', left: 0, right: 0, bottom: 6, alignItems: 'center' },
    navIndicator: { width: 34, height: 10 },
    body: { padding: 18, paddingTop: 2, paddingBottom: 40 },
    headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 310 },

    sectionTitle: { fontWeight: 500, fontSize: 16, color: "#333333" },
    medicationAddIcon: { width: 16, height: 16 },
    medicationBox: {
        marginTop: 12,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        backgroundColor: "#FEFFFF",
        borderRadius: 12,
        padding: 15
    },
    contentModule: {
        marginTop: 15,
        borderRadius: 8,
    },
    reminderModule: {
        marginTop: 12,
        padding: 15,
        backgroundColor: '#F6F8FB',
        borderRadius: 8,
    },
    medicationTimelineRow: {
        marginTop: 18,
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    medicationAxisCol: {
        width: 8,
        alignItems: 'center',
        marginRight: 12,
    },
    medicationAxisPointWrap: {
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    medicationPoint: {
        width: 8,
        height: 8,
    },
    medicationAxisLine: {
        flex: 1,
        width: 1,
        marginTop: -11,
        marginBottom: -29,
        backgroundColor: 'rgba(19,17,65,0.1)',
    },
    medicationTimelineContent: {
        flex: 1,
        minWidth: 0,
    },
    medicationTitleBox: {
        height: 22,
        marginBottom: 12,
    },
    medicationTitle: { fontWeight: "bold", fontSize: 15, color: "#333333", lineHeight: 22 },
    medicationTimeText: { fontWeight: 500, fontSize: 12, color: "#999999", marginLeft: 4, lineHeight: 22 },
    medicationCF: { height: 20, backgroundColor: "rgba(5,58,147,0.14)", borderRadius: 7, paddingHorizontal: 7, marginLeft: 11 },
    medicationCFText: { fontWeight: 500, fontSize: 12, color: "#053A93" },
    medicationGR: { height: 20, backgroundColor: "rgba(52,182,159,0.12)", borderRadius: 7, paddingHorizontal: 7, marginLeft: 11 },
    medicationGRText: { fontWeight: 400, fontSize: 12, color: "#34B69F" },
    medicationInfo: { marginTop: 0 },
    medicationItemCard: {
        height: 70,
        backgroundColor: '#F6F8FB',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 15,
    },
    medicationItemIcon: {
        width: 30,
        height: 30,
        marginRight: 12,
    },
    medicationItemContent: {
        flex: 1,
        minWidth: 0,
    },
    medicationLeftBox: { flex: 1, minWidth: 0 },
    medicationLeftTitle: { fontWeight: "bold", fontSize: 14, color: "#333333" },
    medicationText: { marginTop: 2, fontWeight: 500, fontSize: 12, color: "#666666" },
    medicationActionBtn: {
        height: 29,
        paddingHorizontal: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
    },
    medicationSelectIcon: {
        width: 18,
        height: 18,
        marginRight: 4,
    },
    medicationActionText: {
        fontWeight: 'bold',
        fontSize: 13,
        color: '#6D925E',
    },
    colTitle: { fontWeight: 500, fontSize: 16, color: "#333333" },
    rowLine: { height: 1, backgroundColor: "#E8DED2" },
    typeItem: { height: 32, paddingHorizontal: 23, backgroundColor: "#FFF", borderRadius: 16 },
    typeItemActive: { backgroundColor: AppTheme.primaryColor },
    typeItemText: { fontWeight: 400, fontSize: 14, color: AppTheme.primaryColor },
    typeItemTextActive: { color: '#FFFFFF' },
    colIcon: { width: 14, height: 14 },
    tipCheckIcon: { width: 16, height: 16 },
    colText: { marginLeft: 8, fontWeight: 400, fontSize: 14, color: "#333333" },
    more: { fontWeight: 500, fontSize: 13, color: "#666666" },
    moreImg: { width: 5, height: 9, marginLeft: 6 },
    listBox: { marginTop: 12, backgroundColor: '#F6F8FB', padding: 15, paddingTop: 0, borderRadius: 8 },
    listItem: { marginTop: 15 },
    listItemText: {
        fontWeight: 400,
        fontSize: 14,
        color: AppTheme.textSecondary
    },
    leftText: {
        fontWeight: 400,
        fontSize: 14,
        color: AppTheme.textSecondary,
    },
    medicationProgressBox: {
        marginTop: 15,
    },
    medicationLeftText: {
        fontWeight: "bold",
        fontSize: 18,
        color: "#333333"
    },
    medicationRightText: {
        fontWeight: "bold",
        fontSize: 18,
        color: "#999999"
    },
    medicationProgressTrack: {
        marginTop: 12,
        height: 12,
        backgroundColor: '#ECEDF1',
        borderRadius: 6,
        overflow: 'hidden',
    },
    medicationProgressFill: {
        height: '100%',
        backgroundColor: '#6D925E',
        borderRadius: 6,
    },
})

export default styles
