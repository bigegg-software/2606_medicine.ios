import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { paddingHorizontal: 12, paddingTop: 2, paddingBottom: 14 },

    // allergies page
    sectionCard: {
        marginTop: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
    },
    sectionHeader: {
        marginBottom: 12,
    },
    allergySectionTitle: {
        marginLeft: 6,
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
    },
    allergySectionIcon: {
        width: 24,
        height: 24,
    },
    allergyListBox: { gap: 8 },
    allergyInfoBox: {
        backgroundColor: '#F6F8FB',
        borderRadius: 8,
        padding: 15,
    },
    allergyItemName: {
        flexShrink: 1,
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
    },
    allergyItemSubtitle: {
        marginTop: 10,
        fontWeight: '500',
        fontSize: 13,
        color: '#999999',
    },
    more: {
        width:20,
        height:20
    },
    delIcon: { width: 28, height: 28 },
    severityMildBox: {
        flexShrink: 0,
        marginLeft: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: 'rgba(86,162,216,0.06)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(86,162,216,0.3)',
    },
    severityMildText: {
        fontWeight: '700',
        fontSize: 11,
        color: '#56A2D8',
    },
    severityModerateBox: {
        flexShrink: 0,
        marginLeft: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: 'rgba(238,156,68,0.06)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(238,156,68,0.3)',
    },
    severityModerateText: {
        fontWeight: '700',
        fontSize: 11,
        color: '#EE9C44',
    },
    severitySevereBox: {
        flexShrink: 0,
        marginLeft: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: 'rgba(251,69,80,0.06)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(251,69,80,0.3)',
    },
    severitySevereText: {
        fontWeight: '700',
        fontSize: 11,
        color: '#FB4550',
    },
});

export default styles;
