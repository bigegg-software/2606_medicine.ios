import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    page: { flex: 1, },
    body: { flex: 1, paddingHorizontal: 18, paddingTop: 12, },
    scrollContent: { paddingBottom: 120 },
    medicationBox: {
        marginTop: 18,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        paddingHorizontal: 24,
        paddingVertical: 18,
    },
    btmLine: {
        marginTop: 4,
        height: 1,
        backgroundColor: "rgba(23,63,125,0.08)"
    },
    inputBox: {
        marginTop: 21,
    },
    fieldLabel: {
        fontWeight: '400',
        fontSize: 16,
        color: '#333333',
    },
    nameInput: {
        flex: 1,
        marginLeft: 16,
        textAlign: 'right',
        fontWeight: '500',
        fontSize: 14,
        color: '#173F7D',
        paddingVertical: 0,
    },
    btnSize: {
        width: 24,
        height: 24
    },
    btnText: {
        fontWeight: 500,
        fontSize: 14,
        paddingHorizontal: 14,
        color: "#333333"
    },
    btnUnit: {
        fontWeight: 400,
        marginLeft: 14,
        fontSize: 14,
        color: "#173F7D"
    },
    mainTitle: {
        fontWeight: 500,
        fontSize: 16,
        color: "#333333",
        marginBottom: 6,
    },
    mainContent: { marginTop: 12 },

    mainIcon: { width: 21, height: 21, marginRight: 4 },
    maiinIconText: { fontWeight: 500, fontSize: 14, color: '#333333' },
    mainValue: { fontWeight: 500, fontSize: 16, color: '#173F7D' },
    mainValueInput: {
        minWidth: 48,
        textAlign: 'right',
        fontWeight: '500',
        fontSize: 16,
        color: '#173F7D',
        paddingVertical: 0,
    },
    mainUnit: { width: 30, textAlign: 'right', marginLeft: 6, fontWeight: 400, fontSize: 12, color: '#999999' },
    delIcon: { width: 18, height: 18, marginLeft: 25 },
    addText: { fontWeight: 500, fontSize: 12, color: '#173F7D' },
    addButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginRight: -14,
        marginVertical: -10,
    },
    noteText: { fontWeight: 400, fontSize: 14, color: 'rgba(153,153,153,0.48)', textAlign: 'center', marginTop: 10 },
    addModal: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },
    addModalTitle: {
        fontWeight: '600',
        fontSize: 16,
        color: '#333333',
        marginBottom: 12,
        textAlign: 'center',
    },
    addModalItem: {
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(23,63,125,0.08)',
    },
    addModalItemText: {
        fontSize: 15,
        color: '#333333',
        textAlign: 'center',
    },
    customNameInput: {
        flex: 1,
        marginRight: 12,
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
        paddingVertical: 0,
    },
    errorText: {
        marginTop: 4,
        fontSize: 12,
        color: '#FF4D4F',
    },
});

export default styles;
