import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { padding: 18, paddingTop: 2, paddingBottom: 40 },
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
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
    detailImageBox: {
        width: 38,
        height: 38,
        backgroundColor: "rgba(79,134,238,0.14)",
        borderRadius: 11,
        marginRight: 14
    },
    detailHeaderMain: {
        flex: 1,
        paddingRight: 12,
    },
    statusPausedBadge: {
        height: 24,
        backgroundColor: 'rgba(255,139,7,0.14)',
        borderRadius: 8,
        paddingHorizontal: 10,
    },
    statusPausedText: {
        fontWeight: 500,
        fontSize: 12,
        color: '#FF8B07',
    },
    detailImage: {
        width: 24,
        height: 24,
    },
    detailTitle: {
        fontWeight: 500,
        fontSize: 16,
        color: '#333333',
    },
    detailSubtitle: {
        marginTop: 6,
        fontWeight: 400,
        fontSize: 14,
        color: '#999999',
    },
    timeBox: {
        marginTop: 7
    },
    iconImg: {
        width: 16,
        height: 16,
        marginRight: 4
    },
    timeText: {
        fontWeight: 400,
        fontSize: 14,
        color: '#333333',
    },
    stopReasonText: {
        marginTop: 7,
        fontWeight: 400,
        fontSize: 14,
        color: '#FF8B07',
    },
    pageTitle: {
        marginTop: 18,
        marginLeft: 14,
        fontWeight: 500,
        fontSize: 18,
        color: '#333333',
    },
    mapTitle: {
        marginTop: 16,
        fontWeight: 500,
        fontSize: 16,
        color: '#333333',
    },
    medicationContent: {
        marginTop: 7,
        padding: 16,
        height: 74,
        backgroundColor: "#F5F8FF",
        borderRadius: 14,
    },
    medicationTitle: {
        textAlign: "center",
        fontWeight: 400,
        fontSize: 14,
        color: '#333333',
    },

    medicationText: {
        marginTop: 6,
        textAlign: "center",
        fontWeight: 500,
        fontSize: 14,
        color: '#333333',
    },
    medicationRow: {
        marginTop: 14,
    },
    colTimeBox: {
        paddingHorizontal: 14,
        paddingVertical: 4,
        backgroundColor: "rgba(23,63,125,0.14)",
        borderRadius: 57,
    },
    colTime: {
        fontWeight: 400,
        fontSize: 14,
        color: '#173F7D',
    },
    leftTitle: {
        fontWeight: 400,
        fontSize: 14,
        color: '#333333',
    },
    rightText: {
        fontWeight: 400,
        fontSize: 14,
        color: '#999999',
    },
    rowLine: { height: 1, backgroundColor: "rgba(23,63,125,0.06)", marginTop: 14 },
    zyText: {
        fontWeight: 400,
        fontSize: 14,
        color: '#333333',
        lineHeight: 24
    }
})

export default styles;
