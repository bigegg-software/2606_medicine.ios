import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    pageContent: { flex: 1, position: 'relative' },
    body: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 14 },
    textTip: { fontWeight: 500, fontSize: 12, color: AppTheme.primaryColor, marginTop: 15, marginBottom: 3 },
    rowBox: {
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'transparent',
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    iconSize: { width: 18, height: 18 },
    dragHandle: {
        width: 36,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    iconSize1: { width: 18, height: 18, marginLeft: 4 },
    textTitle: { fontWeight: "bold", fontSize: 16, color: AppTheme.textPrimary, marginLeft: 4 },
    rowWrap: { marginTop: 12 },
    statusWrap: {
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 52,
    },
    statusText: { fontWeight: 500, fontSize: 12 },
    bottomBar: {
        width: '100%',
        paddingHorizontal: 15,
        paddingTop: 18,
        backgroundColor: '#FEFEFE',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        shadowColor: '#B4C9FF',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.14,
        shadowRadius: 4,
        elevation: 3,
    },
    bottomBarButtonLeft: {
        height: 50,
        backgroundColor: '#6D925E',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#6D925E',
    },
    bottomBarButtonImg: {
        width: 20,
        height: 20,
        marginRight: 4,
    },
    bottomBarButtonTextLeft: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#FFFFFF',
    },
})

export default styles
