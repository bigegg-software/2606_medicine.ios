import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { paddingTop: 6, paddingBottom: 14 },
    rowBox: {
        marginHorizontal: 12,
        paddingHorizontal: 15,
        backgroundColor: '#FFFFFF',
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderRadius: 8,
    },
    formRow: {
        height: 54,
        borderTopWidth: 1,
        borderTopColor: 'rgba(23,63,125,0.08)',
    },
    formRowFirst: {
        borderTopWidth: 0,
    },
    formRowLast: {
        borderBottomWidth: 0,
    },
    formLabel: {
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
    },
    formInput: {
        flex: 1,
        marginLeft: 16,
        paddingVertical: 0,
        textAlign: 'right',
        textAlignVertical: 'center',
        includeFontPadding: false,
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
    },
    formValueWrap: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'flex-end',
    },
    formPlaceholder: {
        fontWeight: '500',
        fontSize: 14,
        color: '#999999',
        textAlign: 'right',
    },
    formValue: {
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
        textAlign: 'right',
    },
    formArrow: {
        width: 9,
        height: 5,
        marginLeft: 12,
    },
    rowTitle: {
        marginTop: 17,
        fontWeight: "bold",
        fontSize: 16,
        color: "#333333"
    },
    rowTitleDesc: {
        marginTop: 10,
        fontWeight: 500,
        fontSize: 13,
        color: "#999999"
    },
    qxBox: {
        marginVertical: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    qxItem: {
        width: '47%',
        flexGrow: 1,
        maxWidth: '48%',
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#F6F7FA',
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'transparent',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    qxItemActive: {
        backgroundColor: 'rgba(109,146,94,0.06)',
        borderColor: 'rgba(109,146,94,0.5)',
    },
    qxItemLeft: {
        flex: 1,
        alignItems: 'center',
        minWidth: 0,
    },
    qxItemIcon: {
        width: 15,
        height: 15,
    },
    qxCheckIcon: {
        width: 15,
        height: 15,
        marginLeft: 6,
        flexShrink: 0,
    },
    qxItemTitle: {
        flexShrink: 1,
        marginLeft: 6,
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
    },
    qxItemTitleActive: {
        color: '#6D925E',
    },
    bottomBar: {
        width: '100%',
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: 40,
        backgroundColor: '#FEFEFE',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#B4C9FF',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.14,
        shadowRadius: 4,
        elevation: 3,
    },
    bottomBarButtonLeft: {
        borderWidth: 1,
        borderColor: '#6D925E',
        marginTop: 4,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomBarButtonImg: {
        width: 20,
        height: 20,
        marginRight: 4,
    },
    bottomBarButtonTextLeft: {
        fontWeight: '600',
        fontSize: 16,
        color: '#6D925E',
    },
});

export default styles;
