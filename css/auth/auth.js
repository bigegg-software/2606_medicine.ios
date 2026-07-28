import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    page: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 24 },
    content: {
        flexGrow: 1,
        paddingHorizontal: 12,
    },
    topImgBox: {
        paddingHorizontal: 8,
        marginTop: 12,
        overflow: 'hidden',
    },
    authContent: {
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginTop: 12,
        shadowColor: '#053A93',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    authContentTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333333',
    },
    authContentSubtitle: {
        marginTop: 14,
        fontWeight: '500',
        fontSize: 13,
        color: '#999999',
    },
    authContentImgBox: {
        marginTop: 15,
    },
    authContentImgItem: {
        width: 150,
        borderRadius: 6,
        overflow: 'hidden',
    },
    authContentImgItemImg: {
        width: 150,
        height: 100,
    },
    formFields: {
        marginTop: 4,
    },
    formRow: {
        height: 58,
    },
    formLabel: {
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
        flexShrink: 0,
    },
    formInput: {
        flex: 1,
        marginLeft: 12,
        padding: 0,
        textAlign: 'right',
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
    },
    formInputIcon: {
        width: 8,
        height: 13,
        marginLeft: 6,
    },
    formValueWrap: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'flex-end',
    },
    formValueText: {
        flexShrink: 1,
        textAlign: 'right',
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
    },
    formPlaceholder: {
        color: '#999999',
    },
    formDivider: {
        height: 1,
        backgroundColor: 'rgba(23,63,125,0.08)',
    },
    bottomBar: {
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: 40,
        backgroundColor: '#FEFEFE',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 12,
    },
    primaryBtn: {
        marginTop: 4,
        height: 50,
        borderRadius: 12,
        backgroundColor: AppTheme.primaryColor,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryBtnIcon: {
        width: 20,
        height: 20,
        marginRight: 4,
    },
    primaryBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    sourceSheet: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 28,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    sourceSheetTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333333',
        textAlign: 'center',
    },
    sourceSheetRow: {
        marginTop: 20,
        justifyContent: 'center',
        gap: 24,
    },
    sourceSheetItem: {
        width: 99,
        height: 100,
    },
    sourceSheetDash: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderStyle: 'dashed',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    sourceSheetIcon: {
        width: 44,
        height: 44,
    },
    sourceSheetItemTitle: {
        marginTop: 10,
        fontWeight: '500',
        fontSize: 13,
        color: '#333333',
    },
    sourceSheetCancel: {
        marginTop: 20,
        height: 48,
        borderRadius: 12,
        backgroundColor: AppTheme.primaryColor,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sourceSheetCancelText: {
        fontWeight: '600',
        fontSize: 15,
        color: '#FFFFFF',
    },
});

export default styles;
