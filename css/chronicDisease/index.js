import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 14 },
    sectionBox: { marginTop: 12 },
    sectionTitle: { fontWeight: 500, fontSize: 18, color: AppTheme.textPrimary },
    infoBox: {
        marginTop: 12,
        marginBottom: 4,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 15
    },
    rowBox: {
        marginTop: 12,
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#F6F8FB',
    },
    uploadTimeBox: {
        marginTop: 7
    },
    imgSize: {
        width: 12,
        height: 12, marginRight: 4
    },
    uploadTime: {
        fontWeight: 500,
        fontSize: 12,
        color: "#999999"
    },
    infoTitle: { fontWeight: "bold", fontSize: 15, color: "#333333" },
    infoStatusBox: {
        height: 22,
        paddingHorizontal: 6,
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#6D925E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoStatusText: { fontWeight: 'bold', fontSize: 12, color: '#6D925E', lineHeight: 20 },
    /* 需关注 */
    infoStatusBoxAttention: {
        height: 22,
        paddingHorizontal: 6,
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#EE9C44',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoStatusTextAttention: { fontWeight: 'bold', fontSize: 12, color: '#EE9C44', lineHeight: 20 },
    /* 高风险 */
    infoStatusBoxHighRisk: {
        height: 22,
        paddingHorizontal: 6,
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#D80010',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoStatusTextHighRisk: { fontWeight: 'bold', fontSize: 12, color: '#D80010', lineHeight: 20 },
    infoContent: {
        marginTop: 15,
        padding: 15,
        backgroundColor: "#FEFFFF",
        borderRadius: 6,
    },
    infoContentImage: { width: 24, height: 24, marginRight: 5 },
    infoContentText: { fontWeight: 'bold', fontSize: 12, color: "#333333" },
    pageLine: { marginTop: 14, marginBottom: 12, height: 1, backgroundColor: "#173F7D", opacity: 0.06 },
    infoContentTime: { fontWeight: 400, fontSize: 14, color: "#173F7D" }

})

export default styles
