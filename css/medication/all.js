import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { padding: 18, paddingTop: 2, paddingBottom: 40 },
    bodyEmpty: { flexGrow: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyWrap: { flex: 1, justifyContent: 'center', paddingTop: 40 },
    sectionTitle: { marginLeft: 14, marginTop: 16, fontWeight: 500, fontSize: 18, color: AppTheme.textPrimary },
    pageBody: { flex: 1 },

    medicationBox: {
        marginTop: 12,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    medicationTitle: { fontWeight: 500, fontSize: 16, color: AppTheme.textPrimary, },
    medicationTimeText: { fontWeight: 400, fontSize: 12, color: AppTheme.textSecondary },
    medicationUsageText: { marginTop: 12, fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary },
    medicationTime: { width: 24, height: 24, marginRight: 6 },
    medicationText: { fontWeight: 400, fontSize: 14, color: "#000" },

    medicationCF: { height: 20, backgroundColor: "rgba(5,58,147,0.14)", borderRadius: 10, paddingHorizontal: 7, marginLeft: 11 },
    medicationCFText: { fontWeight: 500, fontSize: 12, color: "#053A93" },
    medicationGR: { height: 20, backgroundColor: "rgba(52,182,159,0.12)", borderRadius: 10, paddingHorizontal: 7, marginLeft: 11 },
    medicationGRText: { fontWeight: 400, fontSize: 12, color: "#34B69F" },

    swipeRow: {
        marginTop: 12,
        borderRadius: 18,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    swipeAction: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 72, zIndex: 0 },
    swipeForeground: { width: '100%', zIndex: 1, backgroundColor: '#FFFFFF', borderRadius: 18 },
    swipeDeleteBtn: { flex: 1, width: 72, justifyContent: 'center', alignItems: 'center' },
    swipeDeleteIcon: { width: 24, height: 24 },
    medicationBoxInSwipe: {
        shadowColor: 'transparent',
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        marginTop: 0,
    },
})

export default styles;
