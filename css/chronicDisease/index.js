import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 14 },
    sectionBox: { marginTop: 12 },
    sectionTitle: { marginLeft: 14, fontWeight: 500, fontSize: 18, color: AppTheme.textPrimary },
    infoBox: {
        marginTop: 12,
        marginBottom: 4,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        paddingHorizontal: 24,
        paddingVertical: 17,
    },
    infoTitle: { fontWeight: 500, fontSize: 16, color: "#000000" },
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
    infoContent: { marginTop: 12, paddingHorizontal: 8 },
    infoContentImage: { width: 24, height: 24, marginRight: 5 },
    infoContentText: { fontWeight: 500, fontSize: 12, color: "#999999" },
    pageLine: { marginTop: 14, marginBottom: 12, height: 1, backgroundColor: "#173F7D", opacity: 0.06 },
    infoContentTime:{ fontWeight: 400, fontSize: 14, color: "#173F7D" }

})

export default styles
