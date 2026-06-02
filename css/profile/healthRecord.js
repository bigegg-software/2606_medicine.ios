import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { padding: 18, paddingTop: 2, paddingBottom: 40 },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: AppTheme.primaryColor, alignItems: 'center', justifyContent: 'center' },
    avatarImg: { width: 64, height: 64, borderRadius: 32, marginRight: 12 },
    avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
    name: { marginTop: 8, width: "100%", height: 27, fontWeight: 500, fontSize: 18, color: "#333333", lineHeight: 27, textAlign: "center" },
    sectionBox: { marginTop: 12 },
    sectionTitle: { height: 19, fontWeight: 500, fontSize: 18, color: "#333333", lineHeight: 19 },
    more: { height: 20, fontWeight: 400, fontSize: 14, color: AppTheme.primaryColor, lineHeight: 20 },
    editIcon: { width: 24, height: 24 },
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
        paddingBottom: 3,
    },
    infoItem: { height: 43, borderBottomWidth: 1, borderBottomColor: AppTheme.borderRgbColor },
    infoItemLabel: { height: 19, fontWeight: 400, fontSize: 16, color: "#333333", lineHeight: 19 },
    infoItemValue: { height: 19, fontWeight: 400, fontSize: 14, color: "#999999", lineHeight: 19 },
    familyItem: { paddingVertical: 14, borderBottomWidth: 1, borderColor: "rgba(5,58,147,0.06)" },
    imgBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EBF0FB" },
    imgItem: { width: 24, height: 24 },
    familyItemImg: { width: 44, height: 44, borderRadius: 22 },
    familyItemContent: { marginLeft: 14 },
    familyItemContent1: { marginLeft: 6 },
    familyItemName: { height: 19, fontWeight: 400, fontSize: 16, color: AppTheme.textPrimary, lineHeight: 19 },
    familyItemRelation: { marginTop: 2, height: 19, fontWeight: 400, fontSize: 12, color: "#999", lineHeight: 19 },
    familyItemRelation1: { marginTop: 2, height: 19, fontWeight: 400, fontSize: 14, color: "#999", lineHeight: 19 },
    addBtn: { height: 45, backgroundColor: "#053A93", marginHorizontal: 18, borderRadius: 8 },
    addText: { height: 19, fontWeight: 500, fontSize: 16, color: "#FFFFFF" },
    emergencyText: { marginTop: 12, fontWeight: 400, fontSize: 12, color: "#999999", lineHeight: 19 },



    // caseNotes
    topBox: { paddingHorizontal: 18, paddingTop: 19 },
    inputBox: {
        height: 32,
        borderRadius: 24,
        backgroundColor: "#FFF",
        paddingHorizontal: 20
    },
    inputIcon: {
        width: 22,
        height: 22
    },
    inputText: {
        flex: 1,
        marginLeft: 8,
        color: AppTheme.textPrimary
    },
    navBox: {
        marginTop: 16,
    },
    navCol: {
        paddingHorizontal: 8,
    },
    navItemWrap: {
        position: 'relative',
        alignItems: 'center',
        paddingBottom: 12,
    },
    navText: {
        fontWeight: 400,
        fontSize: 16,
        color: "#999999",
        lineHeight: 22,
    },
    activeNavText: {
        color: AppTheme.primaryColor,
        fontWeight: 500,
        fontSize: 18,
        lineHeight: 24,
    },
    navIndicatorWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 6,
        alignItems: 'center',
    },
    navIndicator: {
        width: 34,
        height: 10,
    },
    caseBox: {
        padding: 12,
        backgroundColor: "#FFF",
        borderRadius: 16,
        marginTop: 12,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    caseTopBox: {
        paddingTop: 3,
        paddingLeft: 6,
        paddingRight: 4,
        paddingBottom: 9,
    },
    caseTitle: {
        height: 19,
        fontWeight: 500,
        fontSize: 16,
        color: "#333333",
        lineHeight: 19,
    },
    caseTime: {
        height: 19,
        fontWeight: 400,
        fontSize: 14,
        color: "#999999",
        lineHeight: 19,
    },
    caseLine: { height: 1, backgroundColor: AppTheme.primaryColor, opacity: 0.06 },
    caseContentBox: { paddingTop: 4, paddingLeft: 6, paddingRight: 4, paddingBottom: 4 },
    caseContentText: { marginTop: 8, height: 19, fontWeight: 400, fontSize: 14, color: "#999999", lineHeight: 19, }
})

export default styles
