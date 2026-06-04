import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 14 },
    sectionBox: { marginTop: 12 },
    sectionTitle: { marginLeft: 6, height: 19, fontWeight: 500, fontSize: 18, color: "#333333", lineHeight: 19 },
    more: { height: 20, fontWeight: 400, fontSize: 14, color: AppTheme.primaryColor, lineHeight: 20 },
    delIcon: { width: 24, height: 24 },
    imgItem: { width: 20, height: 20 },
    infoBox: {
        marginTop: 12,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        backgroundColor: "#FEFFFF",
        borderRadius: 8,
        paddingLeft: 18,
        paddingRight: 26,
        paddingTop: 3,
        paddingBottom: 15,
    },
    infoItem: { height: 43, borderBottomWidth: 1, borderBottomColor: AppTheme.borderRgbColor },
    infoLabel: { height: 19, fontWeight: 400, fontSize: 16, color: "#333333", lineHeight: 19 },
    infoValue: { height: 19, fontWeight: 400, fontSize: 14, color: "#999999", lineHeight: 19 },
    lineBox: { marginTop: 12, height: 8, backgroundColor: '#F5F8FF', borderRadius: 6 },
    line: { width: "10%", height: 8, backgroundColor: '#00C950', borderRadius: 6 },
    tipBox: {
        marginTop: 12,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: "#FEFFFF",
        borderRadius: 8,
    },
    tipTitle: { height: 19, fontWeight: 500, fontSize: 16, color: "#333333", lineHeight: 19, marginTop: 12, marginBottom: 8 },
    tipContent: { fontWeight: 400, fontSize: 14, color: "#999999", lineHeight: 19 },
})

export default styles
