import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { padding: 18, paddingTop: 2, paddingBottom: 40 },
    sectionTitle: { marginTop: 18, height: 19, fontWeight: 500, fontSize: 18, color: AppTheme.textPrimary, lineHeight: 19 },
    sectionTitleInHeader: { marginTop: 0 },
    rowBox: {
        paddingHorizontal: 14,
        paddingTop: 2,
        paddingBottom: 2,
        borderRadius: 8,
        marginTop: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
    },
    sectionHeader: {
        minHeight: 48,
        paddingVertical: 10,
    },
    rowTitle: { marginTop: 12, height: 19, fontWeight: 400, fontSize: 16, color: AppTheme.textPrimary, lineHeight: 19 },
    rowLine: { height: 1, backgroundColor: '#E8DED2' },
    rowLineInHeader: { height: 1, backgroundColor: '#E8DED2', marginTop: 12 },
    inputBox: { height: 32, borderRadius: 24, backgroundColor: '#FFF', fontSize: 14, color: AppTheme.textPrimary },
    typeItem: { height: 32, paddingHorizontal: 18, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(102,102,102,0.29)' },
    typeItemActive: { backgroundColor: '#F5F8FF', borderColor: AppTheme.primaryColor },
    typeItemText: { fontWeight: 400, fontSize: 14, color: AppTheme.textPrimary },
    typeItemTextActive: { color: AppTheme.primaryColor },
    inlineRow: { paddingBottom: 12 },
    dateValue: { fontWeight: 400, fontSize: 14, color: AppTheme.textPrimary },
    calendarIcon: { width: 19, height: 19, marginLeft: 8 },
    addBtn: { marginTop: 12, marginHorizontal: 18, height: 45, backgroundColor: '#053A93', borderRadius: 8 },
    addText: { height: 19, fontWeight: 500, fontSize: 16, color: '#FFFFFF' },
    switch: { marginTop: 12 },
    toggleText: { fontWeight: 400, fontSize: 14, color: AppTheme.primaryColor },
});

export default styles;
