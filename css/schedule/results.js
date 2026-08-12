import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFFFFF" },
    page: { flex: 1, paddingHorizontal: 15, borderTopWidth: 1, borderColor: '#E9E9E9', alignItems: 'center', paddingTop: 40 },
    pageContent: { flex: 1, width: '100%', alignItems: 'center' },
    headerCloseIcon: { width: 18, height: 18 },
    ringWrap: {
        marginTop: 100,
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: '#F7F8FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringCenter: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countdownText: {
        textAlign: 'center',
        fontWeight: 500,
        fontSize: 14,
        color: "#666666"
    },
    countdownTime: {
        marginTop: 10,
        textAlign: 'center',
        fontWeight: 500,
        fontSize: 45,
        color: "#333333"
    },
    countdownTextWrap: {
        marginTop: 30,
        paddingHorizontal: 23,
        paddingVertical: 15,
        width: "100%",
        backgroundColor: '#F6F8FB',
        borderRadius: 8,
    },

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
    bottomBarSxImg: {
        width: 50,
        height: 50,
    },
    bottomBarButtonStart: {
        flex: 1,
        marginLeft: 12,
        height: 50,
        backgroundColor: '#6D925E',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#6D925E',
    },
    bottomBarButtonEnd: {
        flex: 1,
        marginLeft: 12,
        height: 50,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#6D925E',
    },
    bottomBarButtonEndText: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#6D925E',
    },
    bottomBarButtonFull: {
        width: '100%',
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
    bottomBarButtonText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    recordModalBox: {
        width: '100%',
        minHeight: 139,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    recordModalContent: {
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        paddingTop: 15,
        paddingBottom: 20,
        paddingHorizontal: 15,
        backgroundColor: '#F3F6FA',

    },
    recordModalHeader: {
        position: 'relative',
        minHeight: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordModalTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#242424',
        textAlign: 'center',
    },
    recordModalClose: {
        position: 'absolute',
        right: 0,
        top: 0,
        padding: 4,
    },
    recordModalCloseIcon: {
        width: 15,
        height: 15,
    },
    recordModalInput: {
        flex: 1,
        minWidth: 40,
        marginHorizontal: 8,
        padding: 0,
        borderWidth: 0,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333333',
        textAlign: 'center',
        backgroundColor: 'transparent',
    },
    recordModalConfirm: {
        width: "100%",
        marginTop: 18,
        height: 50,
        borderRadius: 12,
        backgroundColor: 'rgba(109,146,94,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordModalConfirmEnabled: {
        backgroundColor: '#6D925E',
    },
    recordModalConfirmText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    inputWrap: {
        marginTop: 12,
        paddingHorizontal: 15,
        height: 58,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
    inputLabel: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#242424',
        maxWidth: 110,
    },
    inputUnit: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#242424',
    },
    btnBox: {
        paddingHorizontal: 15,
        backgroundColor: "#FFF"
    }
});

export default styles
