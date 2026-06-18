import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 14 },
    navBox: { marginTop: 16, paddingHorizontal: 18, paddingBottom: 0 },
    navCol: { paddingHorizontal: 8 },
    navItemWrap: { position: 'relative', alignItems: 'center', paddingBottom: 12 },
    navText: { fontWeight: 400, fontSize: 16, color: "#999999", lineHeight: 22 },
    activeNavText: { color: AppTheme.primaryColor, fontWeight: 500, fontSize: 18, lineHeight: 24 },
    navIndicatorWrap: { position: 'absolute', left: 0, right: 0, bottom: 6, alignItems: 'center' },
    navIndicator: { width: 34, height: 10 },
    vCard: { marginTop: 12, padding: 18, borderRadius: 8, backgroundColor: '#FFF', shadowColor: AppTheme.primaryColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
    vIcon: { width: 24, height: 24 },
    vLabel: { fontSize: 16, color: AppTheme.textPrimary, fontWeight: 500, lineHeight: 19, marginLeft: 6 },
    vMore: { height: 20, fontWeight: 400, fontSize: 14, color: AppTheme.primaryColor, marginLeft: 12 },
    vValueBox: { marginTop: 20 },
    vValue1: { height: 50, fontWeight: 500, fontSize: 36, color: "#333333" },
    vValue: { fontWeight: 500, fontSize: 16, color: "#000000", marginTop: 5 },
    vUnit: { fontWeight: 400, fontSize: 12, marginTop: 2, color: "#999999", },
    vStatus: { marginTop: 4, height: 17, fontWeight: 500, fontSize: 12, color: "#FFBA1D", },
    vText: { height: 20, fontWeight: 500, fontSize: 14, marginTop: 8, color: "#FFBA1D", },
    vRightBox: { width: 180, backgroundColor: "#F5F8FB", borderRadius: 12, padding: 4 },
    vText1: { fontWeight: 400, fontSize: 12, color: "#999999", textAlign: "center", },
    vText2: { fontWeight: 400, fontSize: 18, lineHeight: 18, marginVertical: 4, color: "#333333", textAlign: "center", },
    icon1: { width: 5, height: 5, borderRadius: 5, backgroundColor: "rgba(5,58,147,0.4)" },
    icon2: { width: 5, height: 5, borderRadius: 5, backgroundColor: "rgba(5,58,147,0.6)" },
    icon3: { width: 5, height: 5, borderRadius: 5, backgroundColor: "rgba(5,58,147,0.8)" },
    icon4: { width: 5, height: 5, borderRadius: 5, backgroundColor: "#053A93" },
    sleepTitle: { marginLeft: 9, fontWeight: 400, fontSize: 12, color: AppTheme.textSecondary, },
    sleepText: { marginLeft: 5, fontWeight: 400, fontSize: 12, color: AppTheme.textPrimary },
    addBtn: { marginTop: 12, marginHorizontal: 18, height: 45, backgroundColor: '#053A93', borderRadius: 8 },
    addText: { fontWeight: 500, fontSize: 16, color: '#FFFFFF' },
    btmTitle: { marginTop: 14, fontWeight: 400, fontSize: 12, color: AppTheme.textPrimary, textAlign: 'center' },
    btmText: { fontWeight: 400, fontSize: 12, color: AppTheme.textSecondary, textAlign: 'center' },
    bjBox: { marginTop: 8, paddingHorizontal: 18, paddingVertical: 4, backgroundColor: '#F5F8FB', borderRadius: 12, },
    bjText: {
        fontWeight: 500,
        fontSize: 14,
        color: '#D80010',
    }
})

export default styles
