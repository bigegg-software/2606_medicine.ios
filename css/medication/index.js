import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { padding: 18, paddingTop: 2, paddingBottom: 40 },
    sectionTitle: { marginTop: 16, fontWeight: 500, fontSize: 18, color: AppTheme.textPrimary },
    medicationBox: {
        marginTop: 12,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 17,
    },
    medicationTitle: { height: 19, fontWeight: 500, fontSize: 18, color: "#333333", lineHeight: 19 },
    medicationStatus1: { height: 20, backgroundColor: "rgba(0,201,80,0.12)", borderRadius: 10, paddingHorizontal: 7 },
    medicationStatusText1: { fontWeight: 400, fontSize: 12, color: "#00C950" },
    medicationStatus2: { height: 20, backgroundColor: "rgba(237,194,98,0.12)", borderRadius: 10, paddingHorizontal: 7 },
    medicationStatusText2: { fontWeight: 400, fontSize: 12, color: "#FFBA1D" },
    medicationInfo: { marginTop: 4 },
    medicationText: { marginTop: 8, fontWeight: 400, fontSize: 14, color: "#999999" },
    btnBox: { marginTop: 15, paddingHorizontal: 4, paddingBottom: 10 },
    btn: { width: 135, height: 41, backgroundColor: "#053A93", borderRadius: 8 },
    btnRight: { width: 135, height: 41, backgroundColor: "rgba(5,58,147,0.14)", borderRadius: 8 },
    btnText: { fontWeight: 500, fontSize: 14, color: AppTheme.onPrimaryColor },
    btnRightText: { fontWeight: 500, fontSize: 14, color: AppTheme.primaryColor },
    progressRing: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
    progressCanvas: { width: 48, height: 48, position: 'absolute' },
    progressText: { fontWeight: 500, fontSize: 12, color: '#FFBA1D', lineHeight: 14 },
    colTitle: { fontWeight: 400, fontSize: 16, color: "#333333" },
    rowLine: { height: 1, backgroundColor: "#E8DED2", marginBottom: 10 },
    typeItem: { height: 32, paddingHorizontal: 23, backgroundColor: "rgba(5,58,147,0.14)", borderRadius: 16 },
    typeItemActive: { backgroundColor: AppTheme.primaryColor },
    typeItemText: { fontWeight: 400, fontSize: 14, color: AppTheme.primaryColor },
    typeItemTextActive: { color: '#FFFFFF' },
    colIcon: { width: 14, height: 14 },
    colText: { marginLeft: 8, fontWeight: 400, fontSize: 16, color: "#333333" },
    more: { marginTop: 15, fontWeight: 400, fontSize: 14, color: AppTheme.primaryColor },
    listBox: { marginTop: 12 },
    listItem: { marginBottom: 8 },
    listItemText: {
        fontWeight: 400,
        fontSize: 14,
        color: AppTheme.textSecondary
    }
})

export default styles
