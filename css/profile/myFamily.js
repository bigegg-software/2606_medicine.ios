import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { paddingTop: 6, paddingBottom: 14 },
    rowBox: {
        marginHorizontal: 12,
        paddingTop: 15,
        paddingLeft: 15,
        paddingRight: 13,
        backgroundColor: '#FFFFFF',
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderRadius: 8,
        alignItems: 'flex-start',
    },
    rowBoxTextWrap: {
        flex: 1,
        flexShrink: 1,
        marginRight: 10,
    },
    rowBoxText: {
        marginTop: 5,
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 24,
        color: '#333333',
    },
    rowBoxTextHighlight: {
        fontWeight: "bold",
        color: AppTheme.primaryColor,
    },
    familyIcon: {
        width: 135,
        height: 100,
        flexShrink: 0,
    },
    backImage1: { width: "100%", height: 50, marginTop: 12 },
    backImage1Text: { fontWeight: "bold", fontSize: 16, color: "#333333" },
    familyList: {
        marginHorizontal: 12,
    },
    familyItem: {
        marginBottom: 12,
        width: "100%",
        backgroundColor: "#FFFFFF",
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 20,
    },
    familyItemIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    familyItemWrap: {
        flex: 1,
        marginLeft: 12,
    },
    familyItemName: {
        fontWeight: "bold",
        fontSize: 14,
        color: "#333333"
    },
    familyItemRelation: {
        marginLeft: 5,
        backgroundColor: "rgba(109,146,94,0.12)",
        borderRadius: 4,
        fontWeight: "bold",
        fontSize: 12,
        paddingHorizontal: 4,
        paddingVertical: 2,
        color: AppTheme.primaryColor
    },
    familyItemStatusBox: {
        width: 6,
        height: 6,
        backgroundColor: AppTheme.primaryColor,
        borderRadius: 3
    },
    familyItemStatus: {
        marginLeft: 6,
        fontWeight: "bold",
        fontSize: 12,
        color: AppTheme.primaryColor
    },
    familyItemStatusBox1: {
        width: 6,
        height: 6,
        backgroundColor: AppTheme.textSecondary,
        borderRadius: 3
    },
    familyItemStatus1: {
        marginLeft: 6,
        fontWeight: "bold",
        fontSize: 12,
        color: AppTheme.textSecondary
    },
    familyItemPhoneWrap: {
        marginTop: 6,
    },
    familyItemSubtitleWrap: {
        flex: 1,
        minWidth: 0,
        marginRight: 8,
    },
    phoneNumber: {
        fontWeight: 500,
        fontSize: 13,
        color: AppTheme.textSecondary
    },
    familyItemStatusText: {
        marginTop: 4,
        fontWeight: 500,
        fontSize: 13,
        color: AppTheme.textSecondary
    },
    familyItemRightIcon: {
        width: 8,
        height: 13,
        flexShrink: 0,
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
})

export default styles
