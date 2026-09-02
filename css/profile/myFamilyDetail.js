import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 12,
        paddingTop: 6,
        paddingBottom: 14,
    },
    rowBox: {
        paddingHorizontal: 15,
        paddingVertical: 13,
        backgroundColor: '#FFFFFF',
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    permissionBox: {
        paddingVertical: 0,
        alignItems: 'stretch',
    },
    rowBoxIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    rowBoxContent: {
        marginLeft: 12,
    },
    rowBoxName: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333333',
    },
    rowBoxTextWrap: {
        marginTop: 8,
    },
    iconLj: {
        width: 15,
        height: 15,
    },
    rowBoxText: {
        marginLeft:4,
        fontWeight: '500',
        fontSize: 13,
        color: '#333333',
    },
    rightImg: {
        width: 80,
        height: 80,
    },
    rowBoxTextWrap2: {
        marginTop: 8,
    },
    rowBoxText2: {
        fontWeight: '500',
        fontSize: 12,
        color: '#6D925E',
    },
    rowBoxText3: {
        fontWeight: '500',
        fontSize: 12,
        color: '#999999',
    },
    rowBoxInfoText: {
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    rowBoxInfoItem: {
        height: 72,
        width: '100%',
    },
    rowBoxInfoItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#E7EAEB',
    },
    rowBoxInfoItemLeft: {
        flex: 1,
        minWidth: 0,
        marginRight: 12,
    },
    rowBoxInfoItemIcon: {
        width: 22,
        height: 22,
        flexShrink: 0,
    },
    rowBoxInfoItemText: {
        flex: 1,
        minWidth: 0,
        marginLeft: 10,
    },
    rowBoxInfoItemTitle: {
        fontWeight: '500',
        fontSize: 16,
        color: '#333333',
    },
    rowBoxInfoItemDesc: {
        marginTop: 4,
        fontWeight: '500',
        fontSize: 13,
        color: '#999999',
    },
    permissionSwitch: {
        width: 44,
        height: 22,
        flexShrink: 0,
    },
    dangerBtnRevoke: {
        height: 51,
        borderRadius: 29,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 15,
        elevation: 2,
    },
    dangerBtnRevokeIcon: { width: 18, height: 18, marginRight: 6 },
    dangerBtnRevokeText: {
        fontWeight: '500',
        fontSize: 16,
        color: '#333333',
    },
    dangerBtnDelete: {
        // marginTop: 12,
        height: 51,
        borderRadius: 29,
        backgroundColor: 'rgba(251,69,80,0.06)',
        borderWidth: 2,
        borderColor: 'rgba(251,69,80,0.16)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 15,
        elevation: 2,
    },
    dangerBtnDeleteText: {
        fontWeight: '500',
        fontSize: 16,
        color: '#FB4550',
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
        marginTop: 4,
        height: 50,
        backgroundColor: AppTheme.primaryColor,
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
        color: '#FFFFFF',
    },
});

export default styles;
