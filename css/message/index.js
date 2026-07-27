import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    scroll: { padding: 12, paddingTop: 0, paddingBottom: 40 },
    headerReadAll: {
        marginRight: 18,
    },
    headerReadAllText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#6D925E',
    },
    messageItem: {
        padding: 15,
        shadowColor: '#EAEAEA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 2,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginTop: 10,
    },
    messageItemIcon: {
        width: 22,
        height: 22,
        borderRadius: 9,
        shadowColor: '#EAEAEA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 2,
    },
    messageItemTitle: {
        fontWeight: "bold",
        fontSize: 15,
        color: "#333333",
        marginLeft: 10
    },
    messageItemTime: {
        fontWeight: 500,
        fontSize: 13,
        color: "#999999"
    },
    messageItemTag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: "rgba(238,156,68,0.06)",
        borderRadius: 4,
        borderWidth: 1,
        marginLeft: 8,
        borderColor: "rgba(238,156,68,0.3)"
    },
    messageItemTagText: {
        fontWeight: "bold",
        fontSize: 11,
        color: "#EE9C44"
    },
    readDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 8,
        backgroundColor: "#FB4550"
    },
    messageItemContent: {
        marginTop: 14,
        fontWeight: 500,
        fontSize: 13,
        lineHeight:20,
        color: '#333333',
    },
    messageItemDivider: {
        marginTop: 15,
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#EAEAEA',
    },
    messageItemDetail: {
        marginTop: 12,
        alignItems: 'center',
    },
    messageItemDetailText: {
        fontWeight: '500',
        fontSize: 14,
        color: '#666666',
    },
    messageItemDetailIcon: {
        width: 5,
        height: 9,
        marginLeft: 4,
    },
    emptyBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyListContent: {
        flexGrow: 1,
    },
    emptyText: {
        fontWeight: '500',
        fontSize: 14,
        color: '#999999',
    },
    footerLoading: {
        paddingVertical: 16,
        alignItems: 'center',
    },
});

export default styles;
