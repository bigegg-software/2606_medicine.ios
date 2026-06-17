import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { padding: 18, paddingTop: 2, paddingBottom: 40 },
    infoBox: {
        marginTop: 12,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        paddingHorizontal: 24,
        paddingVertical: 14,
    },
    infoImage: { width: 24, height: 24, marginRight: 6 },
    rowTitle: { marginTop: 16, fontWeight: 500, fontSize: 16, color: AppTheme.textPrimary },

    infoStatusBox: { height: 25, backgroundColor: "rgba(52,182,159,0.14)", borderRadius: 12, paddingHorizontal: 15, },
    infoStatusIcon: { marginRight: 8, backgroundColor: "#34B69F", borderRadius: 50, width: 5, height: 5 },
    infoStatusText: { fontWeight: 500, fontSize: 12, color: "#34B69F" },
    /* 需关注 */
    infoStatusBoxAttention: { height: 25, backgroundColor: "rgba(255,139,7,0.14)", borderRadius: 12, paddingHorizontal: 15 },
    infoStatusIconAttention: { marginRight: 8, backgroundColor: "#FF8B07", borderRadius: 50, width: 5, height: 5 },
    infoStatusTextAttention: { fontWeight: 500, fontSize: 12, color: "#FF8B07" },
    /* 高风险 */
    infoStatusBoxHighRisk: { height: 25, backgroundColor: "rgba(216,0,16,0.13)", borderRadius: 12, paddingHorizontal: 15 },
    infoStatusIconHighRisk: { marginRight: 8, backgroundColor: "#D80010", borderRadius: 50, width: 5, height: 5 },
    infoStatusTextHighRisk: { fontWeight: 500, fontSize: 12, color: "#D80010" },
    pageLine: { marginTop: 14, marginBottom: 12, height: 1, backgroundColor: "#173F7D", opacity: 0.06 },
    chartBox: { marginTop: 12, width: '100%', height: 120, },
    chart: { width: '100%', height: 120, },
    detailColTitle: { fontWeight: 400, fontSize: 14, color: '#999999' },
    detailColText: { marginTop: 2, fontWeight: 500, fontSize: 20, color: '#333333' },
    sectionTitle: { marginLeft: 14, fontWeight: 500, fontSize: 18, color: AppTheme.textPrimary },
    more: { fontWeight: 500, fontSize: 14, color: '#173F7D', },

    medicationName: { fontWeight: 500, fontSize: 16, color: '#000000', },
    medicationTimeText: { fontWeight: 400, marginLeft: 10, fontSize: 14, color: "#999999" },
    yfy: { height: 20, backgroundColor: "rgba(52,182,159,0.12)", borderRadius: 10, paddingHorizontal: 7, marginLeft: 11 },
    yfyText: { fontWeight: 400, fontSize: 12, color: "#34B69F" },
    dfy: { height: 20, backgroundColor: "rgba(255,139,7,0.12)", borderRadius: 10, paddingHorizontal: 7, marginLeft: 11 },
    dfyText: { fontWeight: 400, fontSize: 12, color: "#FF8B07" },
    emptyText: { fontWeight: 400, fontSize: 14, color: '#999999', textAlign: 'center' },
    summaryText: { marginBottom: 8, fontWeight: 500, fontSize: 14, color: '#173F7D' },
    colImg: { width: 24, height: 24, marginRight: 6, },
    colItem: { marginTop: 16 },
    colTitle: { fontWeight: 400, fontSize: 14, color: '#000000' },
    colWarnText: { fontWeight: 400, fontSize: 14, color: '#FF8B07' },
    planBadgeCF: { marginLeft: 8, height: 20, backgroundColor: 'rgba(79,134,238,0.14)', borderRadius: 10, paddingHorizontal: 7 },
    planBadgeCFText: { fontWeight: 400, fontSize: 12, color: '#4F86EE' },
    planBadgeGR: { marginLeft: 8, height: 20, backgroundColor: 'rgba(52,182,159,0.12)', borderRadius: 10, paddingHorizontal: 7 },
    planBadgeGRText: { fontWeight: 400, fontSize: 12, color: '#34B69F' },
})

export default styles
