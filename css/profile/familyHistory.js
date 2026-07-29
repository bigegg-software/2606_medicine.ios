import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { paddingHorizontal: 12, paddingTop: 2, paddingBottom: 14 },
    bodyEmpty: {
        flexGrow: 1,
        paddingHorizontal: 18,
        paddingTop: 2,
        paddingBottom: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyImage: {
        width: 120,
        height: 80,
    },
    emptyText: {
        marginTop: 25,
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333333',
        textAlign: 'center',
    },
    sectionCard: {
        marginTop: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
    },
    sectionHeader: {
        marginBottom: 12,
    },
    sectionIcon: {
        width: 24,
        height: 24,
    },
    sectionTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333333',
        marginBottom: 12
    },
    more: {
        width: 20,
        height: 20,
    },
    listBox: { gap: 8 },
    infoBox: {
        backgroundColor: '#F6F8FB',
        borderRadius: 8,
        padding: 15,
    },
    itemImgBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        overflow: 'hidden',
    },
    itemImg: {
        width: 36,
        height: 36,
    },
    itemContent: {
        flex: 1,
        minWidth: 0,
    },
    itemName: {
        flexShrink: 1,
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
    },
    itemSubtitle: {
        marginTop: 4,
        fontWeight: '500',
        fontSize: 13,
        color: '#999999',
    },
    delIcon: { width: 28, height: 28, marginLeft: 8 },
    statusAliveBox: {
        flexShrink: 0,
        marginLeft: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: 'rgba(109,146,94,0.06)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(109,146,94,0.3)',
    },
    statusAliveText: {
        fontWeight: '700',
        fontSize: 11,
        color: '#6D925E',
    },
    statusDeceasedBox: {
        flexShrink: 0,
        marginLeft: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: 'rgba(153,153,153,0.06)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(153,153,153,0.3)',
    },
    statusDeceasedText: {
        fontWeight: '700',
        fontSize: 11,
        color: '#999999',
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
    bottomBarButton: {
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
    bottomBarButtonText: {
        fontWeight: '600',
        fontSize: 16,
        color: '#FFFFFF',
    },
});

export default styles;
