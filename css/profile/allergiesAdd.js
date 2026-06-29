import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    body: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 14, },
    sectionBox: { marginTop: 12 },
    sectionTitle: { marginLeft: 6, fontWeight: 500, fontSize: 18, color: "#333333" },
    more: { height: 20, fontWeight: 400, fontSize: 14, color: AppTheme.primaryColor, lineHeight: 20 },
    delIcon: { width: 24, height: 24 },
    imgItem: { width: 20, height: 20 },
    listBox: { marginTop: 8 },
    infoBox: {
        marginTop: 4,
        shadowColor: AppTheme.primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        backgroundColor: "#FEFFFF",
        borderRadius: 8,
        paddingLeft: 24,
        paddingRight: 16,
        paddingTop: 16,
        paddingBottom: 14,
    },
    mapItemName: { maxWidth: "80%", fontWeight: 400, fontSize: 16, color: AppTheme.textPrimary, lineHeight: 19 },
    mapItemValueBox: { marginLeft: 7, paddingHorizontal: 6, height: 19, backgroundColor: "rgba(216,0,16,0.13)", borderRadius: 4 },
    mapItemValue: { fontWeight: 400, fontSize: 12, color: '#D80010' },
    severityMildBox: { marginLeft: 7, paddingHorizontal: 6, height: 19, backgroundColor: 'rgba(247,210,102,0.13)', borderRadius: 4 },
    severityMildText: { fontWeight: 400, fontSize: 12, color: '#CF9A00' },
    severityModerateBox: { marginLeft: 7, paddingHorizontal: 6, height: 19, backgroundColor: 'rgba(245,113,50,0.13)', borderRadius: 4 },
    severityModerateText: { fontWeight: 400, fontSize: 12, color: '#F57132' },
    mapItemSubtitle: { marginTop: 2, fontWeight: 400, fontSize: 12, color: '#999999', lineHeight: 19 },
    addBtn: { marginTop: 12, marginHorizontal: 18, height: 45, backgroundColor: "#053A93", borderRadius: 8 },
    addText: { height: 19, fontWeight: 500, fontSize: 16, color: "#FFFFFF" },
    jzBox: { height: 19, backgroundColor: "rgba(102,202,152,0.13)", borderRadius: 4, paddingHorizontal: 9, marginLeft: 10 },
    jzText: { fontWeight: 500, fontSize: 12, color: "#66CA98" },
    ygBox: { height: 19, backgroundColor: "rgba(153,153,153,0.13)", borderRadius: 4, paddingHorizontal: 9, marginLeft: 10 },
    ygText: { fontWeight: 500, fontSize: 12, color: AppTheme.textSecondary },


    rowBox: { paddingHorizontal: 14, paddingVertical: 2, borderRadius: 8, marginTop: 12, backgroundColor: "#FFFFFF", shadowColor: AppTheme.primaryColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, paddingBottom: 12 },
    rowTitle: { marginTop: 12, height: 19, fontWeight: 400, fontSize: 16, color: AppTheme.textPrimary, lineHeight: 19 },
    switch: { width: 43, height: 21, marginTop: 12 },
    inputBox: { height: 32, borderRadius: 24, backgroundColor: "#FFF", fontSize: 14, color: AppTheme.textPrimary },
    rowLine: { height: 1, backgroundColor: "#E8DED2" },
    yzBox: { marginTop: 10, height: 33, paddingHorizontal: 30, backgroundColor: "rgba(5,58,147,0.14)", borderRadius: 8 },
    yzBoxActive: { backgroundColor: "#053A93" },
    yzText: { fontWeight: 500, fontSize: 14, color: "#053A93" },
    yzTextActive: { color: "#FFFFFF" },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
    chipItem: { width: '31%', marginRight: '3.5%', paddingHorizontal: 0, alignItems: 'center', justifyContent: 'center' },
    chipItemLastInRow: { marginRight: 0 },

})

export default styles
