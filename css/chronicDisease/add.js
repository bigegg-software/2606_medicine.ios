import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { padding: 18, paddingTop: 2, paddingBottom: 40 },
    sectionTitle: { marginLeft: 14, marginTop: 18, fontWeight: 500, fontSize: 18, color: AppTheme.textPrimary },
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
    rowTitle: { marginTop: 16, height: 19, fontWeight: 500, fontSize: 16, color: AppTheme.textPrimary, lineHeight: 19 },
    inpitBox: {
        marginTop: 12,
        paddingLeft: 24,
        paddingVertical: 10,
        paddingRight: 14,
        height: 39,
        backgroundColor: "rgba(79,134,238,0.14)",
        borderRadius: 18,
    },
    placeholderText: {
        fontWeight: 400,
        fontSize: 14,
        flex: 1,
        color: "#999999"
    },
    valueText: {
        color: AppTheme.textPrimary,
    },
    symptomInputBox: {
        height: 'auto',
        minHeight: 39,
    },
    symptomInput: {
        flex: 1,
        fontSize: 14,
        color: AppTheme.textPrimary,
        paddingVertical: 0,
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        gap: 8,
    },
    chipItem: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        backgroundColor: 'rgba(79,134,238,0.14)',
    },
    chipItemActive: {
        backgroundColor: AppTheme.primaryColor,
    },
    chipText: {
        fontSize: 14,
        color: AppTheme.textPrimary,
    },
    chipTextActive: {
        color: '#FFFFFF',
    },
    selectedHint: {
        marginTop: 10,
        fontSize: 12,
        color: AppTheme.textSecondary,
    },
    addBtn: { marginTop: 12, marginHorizontal: 18, height: 45, backgroundColor: '#173F7D', borderRadius: 30 },
    addText: { fontWeight: 500, fontSize: 16, color: '#FFFFFF' },
    cancelBtn: { marginTop: 12, marginBottom: 18, marginHorizontal: 18, height: 45, borderRadius: 30, backgroundColor: 'rgba(79,134,238,0.14)' },
    cancelText: { fontWeight: 500, fontSize: 16, color: '#173F7D' },
})

export default styles;
