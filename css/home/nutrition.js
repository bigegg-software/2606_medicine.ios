import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    scroll: { padding: 18, paddingTop: 8, paddingBottom: 40 },
    navBox: { marginTop: 16, paddingHorizontal: 18 },
    navCol: { paddingHorizontal: 8 },
    navItemWrap: {
        position: 'relative',
        alignItems: 'center',
        // paddingBottom: 12,
    },
    navText: { fontWeight: 400, fontSize: 16, color: AppTheme.textSecondary, lineHeight: 22 },
    activeNavText: { color: AppTheme.primaryColor, fontWeight: 500, fontSize: 18, lineHeight: 24 },
    navIndicatorWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -6,
        alignItems: 'center',
    },
    navIndicator: {
        width: 34,
        height: 10,
    },
    dietBox: {
        marginTop: 12,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 17,
    },
    dietTitle: { height: 19, fontWeight: 500, fontSize: 16, color: AppTheme.textPrimary, lineHeight: 19 },
    addText: { fontWeight: 500, fontSize: 14, color: AppTheme.primaryColor },
    rowLine: { height: 1, backgroundColor: '#E8DED2',marginTop:10 },
    dietInfo: { marginTop: 6 },
    dietInfoItem: { marginTop: 10 },
    dietImgBox: { width: 32, height: 32, backgroundColor: "#EBF0FB", borderRadius: 16 },
    dietInfoTitle: { marginLeft: 12 },
    dietImg: { width: 20, height: 20 },
    dietTitleText: { fontWeight: 400, fontSize: 16, color: AppTheme.textPrimary, lineHeight: 19 },
    dietText: { fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary, lineHeight: 14, marginTop: 6 },
    dietTimeText: { fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary, lineHeight: 19 }
});

export default styles;
