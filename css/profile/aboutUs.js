import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    scroll: { paddingHorizontal: 12, paddingTop: 2, paddingBottom: 14, },
    logoBox: {
        width: 75,
        height: 75,
        marginTop: 50,
        borderRadius: 20,
        overflow: 'hidden',
        margin: "auto"
    },
    logo: {
        width: 75,
        height: 75,
    },
    pageText: {
        textAlign: "center",
        marginTop: 12,
        fontWeight: "bold",
        fontSize: 16,
        color: "#000000",
    },
    urlBox: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingHorizontal: 15,
        marginTop: 48,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    urlBoxBtm: {
        borderBottomWidth: 1,
        borderColor: "#E7EAEB"
    },
    urlRow: {
        paddingVertical: 18
    },
    leftTitle: {
        fontWeight: 500,
        fontSize: 17,
        color: "#333333"
    },
    rightTitle: {
        fontWeight: 500,
        fontSize: 17,
        color: "#999999"
    },
})

export default styles
