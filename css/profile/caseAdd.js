import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { padding: 18, paddingTop: 2, paddingBottom: 40 },
    sectionTitle: { marginTop: 16, height: 19, fontWeight: 500, fontSize: 18, color: AppTheme.textPrimary, lineHeight: 19 },
    cameraBoxRow: { marginTop: 12, gap: 20 },
    cameraBox: { flex: 1, height: 90, backgroundColor: "#FFFFFF", shadowColor: AppTheme.primaryColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, borderRadius: 8 },
    cameraIcon: { width: 42, height: 42 },
    cameraBoxText: { height: 19, fontWeight: 400, fontSize: 12, color: AppTheme.textPrimary },
    addBtn: { marginTop: 12, marginHorizontal: 18, height: 45, backgroundColor: "#053A93", borderRadius: 8 },
    addText: { height: 19, fontWeight: 500, fontSize: 16, color: "#FFFFFF" },
    rowBox: { paddingHorizontal: 14, paddingVertical: 2, borderRadius: 8, marginTop: 12, backgroundColor: "#FFFFFF", shadowColor: AppTheme.primaryColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1 },
    rowTitle: { marginTop: 12, marginBottom: 10, height: 19, fontWeight: 400, fontSize: 16, color: AppTheme.textPrimary, lineHeight: 19 },
    rowContent: { height: 32, marginBottom: 12 },
    typeItem: { height: 32, paddingHorizontal: 18, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(102,102,102,0.29)' },
    typeItemActive: { backgroundColor: '#F5F8FF', borderColor: AppTheme.primaryColor },
    typeItemText: { fontWeight: 400, fontSize: 14, color: AppTheme.textPrimary },
    typeItemTextActive: { color: AppTheme.primaryColor },
    tqText: { height: 19, fontWeight: 400, fontSize: 14, color: "#999999", lineHeight: 19, },
    arrowIcon: { width: 18, height: 18, marginLeft: 16 },
    inputBox: { height: 32, borderRadius: 24, backgroundColor: "#FFF", fontSize: 14, color: AppTheme.textSecondary },
    ksList: { marginTop: 12 },
    ksItem: { marginRight: 12, paddingHorizontal: 13, height: 25, backgroundColor: 'rgba(5,58,147,0.13)', borderRadius: 16 },
    ksItemActive: { backgroundColor: AppTheme.primaryColor },
    ksItemText: { fontWeight: 400, fontSize: 12, color: "#053A93" },
    ksItemTextActive: { color: '#FFFFFF' },
    uploadIcon: { width: 60, height: 60, borderRadius: 8, borderWidth: 1, borderColor: "#DFE6F1", marginBottom: 12 },
    uploadHint: { fontSize: 14, color: AppTheme.textSecondary, marginBottom: 8 },
    dateInput: { minWidth: 120, textAlign: 'right', fontSize: 14, color: '#999999' },




    rowLine: { height: 1, backgroundColor: "#E8DED2" },
})

export default styles
