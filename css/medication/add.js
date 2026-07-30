import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const PRIMARY = AppTheme.primaryColor;
const PRIMARY_SOFT = 'rgba(109,146,94,0.12)';
const PRIMARY_SOFT_STRONG = 'rgba(109,146,94,0.14)';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    body: { padding: 18, paddingTop: 2, paddingBottom: 40 },
    sectionTitle: { marginTop: 16, fontWeight: 500, fontSize: 18, color: AppTheme.textPrimary },
    rowBox: {
        paddingHorizontal: 14,
        paddingVertical: 2,
        paddingBottom: 12,
        borderRadius: 8,
        marginTop: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
    },
    rowTitle: { marginTop: 12, marginBottom: 4, fontWeight: 400, fontSize: 16, color: AppTheme.textPrimary },
    rowLine: { height: 1, backgroundColor: 'rgba(109,146,94,0.12)' },
    inputBox: { height: 32, borderRadius: 24, backgroundColor: '#FFF', fontSize: 14, color: AppTheme.textPrimary },
    typeItem: {
        height: 32,
        width: '23%',
        marginBottom: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(102,102,102,0.29)',
    },
    typeItemActive: { backgroundColor: PRIMARY_SOFT, borderColor: PRIMARY },
    typeItemText: { fontWeight: 400, fontSize: 14, color: AppTheme.textPrimary },
    typeItemTextActive: { color: PRIMARY },
    inlineRow: { paddingBottom: 12 },
    numberInput: { width: 48, height: 32, textAlign: 'center', fontSize: 14, color: PRIMARY },
    stepperIcon: { width: 30, height: 30, },
    stepperBtn: {
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 44,
        minHeight: 44,
    },
    stepperValue: { minWidth: 32, marginHorizontal: 8, textAlign: 'center', fontWeight: 500, fontSize: 14, color: PRIMARY },
    inlineSuffix: { width: 40, textAlign: 'right', fontWeight: 400, fontSize: 14, color: AppTheme.textPrimary },
    doseUnitPicker: {
        marginLeft: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: PRIMARY_SOFT,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    doseUnitText: {
        flexShrink: 1,
        fontWeight: 500,
        fontSize: 14,
        color: AppTheme.textPrimary,
    },
    doseUnitArrowWrap: {
        width: 12,
        height: 7,
        marginLeft: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doseUnitArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 7,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: PRIMARY,
    },
    dateValue: { fontWeight: 400, fontSize: 14, color: AppTheme.textPrimary },
    calendarIcon: { width: 19, height: 19, marginLeft: 8, tintColor: PRIMARY },
    addBtn: { marginTop: 12, marginHorizontal: 18, height: 45, backgroundColor: PRIMARY, borderRadius: 8 },
    addText: { fontWeight: 500, fontSize: 16, color: '#FFFFFF' },
    switch: { width: 43, height: 21 },
    rowText: {
        marginTop: 12,
        fontWeight: 400,
        fontSize: 12,
        color: '#999999',
    },
    weekdayItem: {
        width: 33,
        height: 33,
        borderRadius: 16,
        backgroundColor: PRIMARY_SOFT_STRONG,
        justifyContent: 'center',
        alignItems: 'center',
    },
    weekdayItemActive: {
        backgroundColor: PRIMARY,
    },
    weekdayItemText: {
        fontWeight: 400,
        fontSize: 14,
        color: PRIMARY,
        lineHeight: 16,
    },
    weekdayItemTextActive: {
        color: '#FFFFFF',
    },
});

export default styles;
