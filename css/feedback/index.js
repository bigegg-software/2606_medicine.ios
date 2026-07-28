import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    scroll: { padding: 12, paddingTop: 0, paddingBottom: 40 },

    topBox: {
        marginTop: 16,
        alignItems: 'center',
    },
    topLeft: {
        flex: 1,
        justifyContent: 'center',
        marginRight: 12,
    },
    feedbackTitle: {
        height: 30,
        aspectRatio: 491 / 92,
    },
    feedbackDesc: {
        fontWeight: 500,
        color: '#666666',
        fontSize: 14,
        marginTop: 4,
    },
    feedbackImg: {
        width: 95,
        height: 75,
    },
    infoBox: {
        marginTop: 12,
        padding: 15,

        borderRadius: 12,
        backgroundColor: '#FEFFFF',
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    infoTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333333',
        marginBottom: 4,
    },
    faqItem: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(23,63,125,0.08)',
    },
    faqItemLast: {
        borderBottomWidth: 0,
    },
    faqHeader: {
        height: 55,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    faqTitle: {
        flex: 1,
        marginRight: 12,
        fontWeight: '500',
        fontSize: 15,
        color: '#333333',
    },
    faqIcon: {
        width: 15,
        height: 15,
        flexShrink: 0,
    },
    faqAnswer: {
        marginTop: 10,
        marginBottom: 30,
        fontWeight: '500',
        fontSize: 14,
        color: '#666666',
        lineHeight: 22,
    },
    faqAnswerAboveTable: {
        marginTop: 10,
        marginBottom: 4,
        fontWeight: '500',
        fontSize: 14,
        color: '#666666',
        lineHeight: 22,
    },
    pointsWrap: {
        marginTop: 4,
        marginBottom: 20,
    },
    pointsLoading: {
        marginTop: 12,
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    pointsSection: {
        marginTop: 10,
    },
    pointsSectionTitle: {
        fontWeight: '600',
        fontSize: 14,
        color: '#333333',
        marginBottom: 8,
    },
    pointsTable: {
        borderRadius: 8,
        backgroundColor: '#F6F8FB',
        overflow: 'hidden',
    },
    pointsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.06)',
    },
    pointsHeaderRow: {
        borderTopWidth: 0,
        backgroundColor: 'rgba(109,146,94,0.08)',
    },
    pointsCell: {
        fontWeight: '500',
        fontSize: 13,
        color: '#666666',
        lineHeight: 18,
    },
    pointsHeaderText: {
        fontWeight: '600',
        color: '#333333',
    },
    pointsName: {
        flex: 1.4,
        paddingRight: 6,
        color: '#333333',
    },
    pointsValue: {
        flex: 0.7,
        textAlign: 'center',
    },
    pointsReward: {
        fontWeight: '600',
        color: '#6D925E',
    },
    pointsLimit: {
        flex: 1,
        textAlign: 'right',
    },
    feedbackTextarea: {
        marginTop: 12,
        height: 90,
        backgroundColor: '#F6F8FB',
        borderRadius: 8,
        padding: 15,
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
        textAlignVertical: 'top',
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
