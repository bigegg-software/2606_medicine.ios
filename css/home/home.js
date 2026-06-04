import { StyleSheet } from 'react-native'
import { AppTheme } from '@/common/theme'

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F8FF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F8FF' },
    headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 310 },
    scrollView: { flex: 1 },
    scroll: { paddingHorizontal: 18, paddingBottom: 40 },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    topLeft: { flexDirection: 'row', alignItems: 'center' },
    miniLogo: { width: 149, height: 30 },
    topRight: { flexDirection: 'row', alignItems: 'center', position: "relative" },
    rightImg: { width: 26, height: 26 },
    redDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#D80010", position: "absolute", top: 6, right: 6 },
    nameBox: {
        marginTop: 24,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.31)',
    },
    glassBox: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        height: 43,
        paddingHorizontal: 21,
        overflow: "hidden",
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: "rgba(255,255,255,0.31)",
        shadowColor: '#053A93',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    greetingTime: {
        fontWeight: 400,
        fontSize: 14,
        color: "#333333",
        lineHeight: 19,
    },
    glassText: {
        paddingHorizontal: 21,
        paddingTop: 13,
        paddingBottom: 20,
        fontWeight: 400,
        fontSize: 14,
        color: "#012257",
        lineHeight: 19,
    },
    greeting: { fontSize: 16, fontWeight: '500', color: "#333", marginLeft: 8 },
    headBox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#053A93" },
    headImg: {
        width: 24, height: 24,
    },
    healthBox: {
        marginTop: 16,
        padding: 12,
        backgroundColor: "#FFF",
        borderRadius: 16,
        shadowColor: '#053A93',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    healthIcon: {
        width: 30, height: 30,
    },
    healthTitleBox: {
        marginLeft: 9,
    },
    healthTitle: {
        height: 24,
        fontWeight: 400,
        fontSize: 16,
        color: "#333333",
        lineHeight: 24,
    },
    healthTime: {
        height: 18,
        fontWeight: 400,
        fontSize: 12,
        color: "#999999",
        lineHeight: 18,
    },
    healthStatus: {
        fontWeight: 400,
        fontSize: 14,
        color: "#66CA98"
    },
    healthLine: {
        marginTop: 12,
        height: 1,
        backgroundColor: "#053A93",
        opacity: 0.06
    },
    healthSwiper: {
        height: 110,
        marginTop: 12,
    },
    healthSlide: {
        height: 86,
        paddingHorizontal: 12,
    },
    swiperIcon: {
        width: 18,
        height: 18
    },
    healthSlideLabel: {
        fontSize: 14,
        color: '#333333',
        lineHeight: 18,
        fontWeight: 500,
        marginLeft: 6,
    },
    healthSlideValue: {
        height: 22,
        fontWeight: 500,
        fontSize: 16,
        color: "#000000",
        marginTop: 5
    },
    healthSlideUnit: {
        height: 17,
        fontWeight: 400,
        fontSize: 12,
        marginTop: 2,
        color: "#999999",
    },
    healthSlideStatus: {
        marginTop: 4,
        height: 17,
        fontWeight: 500,
        fontSize: 12,
        color: "#FFBA1D",
    },
    swiperDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(5, 58, 147, 0.2)',
    },
    swiperDotActive: {
        width: 16,
        borderRadius: 3,
        backgroundColor: '#053A93',
    },
    sectionTitle: {
        marginTop: 16,
        fontWeight: 500,
        fontSize: 18,
        color: "#053A93",
    },
    nutritionBox: {
        marginTop: 14,
    },
    nutritionCard: {
        width: '47%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#053A93',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        paddingHorizontal: 10,
        paddingVertical: 24
    },
    nutritionIcon: {
        width: 36,
        height: 36
    },
    nutritionRadio: {
        width: 15,
        height: 15
    },
    nutritionTitle: {
        height: 21,
        fontWeight: 500,
        fontSize: 14,
        color: "#333333",
        lineHeight: 21,
    },
    nutritionSub: {
        height: 20,
        fontWeight: 400,
        fontSize: 12,
        color: "#999999",
        lineHeight: 18,
    },
    more: {
        height: 22,
        fontWeight: 400,
        fontSize: 14,
        color: 'rgba(5,58,147,0.66)',
        lineHeight: 22,
    },
    sportBox: {
        backgroundColor: "#FFF",
        borderRadius: 8,
        marginTop: 18,
        paddingHorizontal: 16,
        paddingBottom: 12,
        shadowColor: '#053A93',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    sportRow: {
        paddingTop: 14,
        width: "50%",
        paddingLeft: 19,
        paddingBottom: 12,
    },
    sportIcon: {
        width: 23,
        height: 23
    },
    sportTitle: {
        height: 23,
        marginLeft: 4,
        fontWeight: 400,
        fontSize: 16,
        color: "#000000",
        lineHeight: 23,
    },
    sportLineBox: {
        marginTop: 12,
        width: 95,
        height: 8,
        backgroundColor: '#F5F8FF',
        borderRadius: 6,
        marginLeft: 4,
        overflow: 'hidden',
    },
    sportProgressFill: {
        height: 8,
        borderRadius: 6,
    },
    sportText: {
        marginTop: 6,
        height: 20,
        fontWeight: 400,
        fontSize: 14,
        color: "#999999",
        lineHeight: 20,
    },
    mapBox: {
        marginTop: 14,
    },
    mapBoxItem: {
        marginBottom: 10,
        paddingHorizontal: 21,
        paddingVertical: 12,
        shadowColor: '#053A93',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        backgroundColor: "#FFF",
        borderRadius: 8
    },
    mapLeftBox: {
        paddingTop: 9
    },
    mapBoxItemTitle: {
        height: 22,
        fontWeight: 500,
        fontSize: 16,
        color: "#333333"
    },
    mapBoxItemImg: {
        width: 62,
        height: 62
    },
    mapIcon: {
        width: 14,
        height: 14,
    },
    mapText: {
        marginLeft: 2,
        marginRight: 7,
        height: 19,
        fontWeight: 400,
        fontSize: 14,
        color: "rgba(43,18,13,0.75)",
        lineHeight: 19,
    },







    hero: { borderRadius: 24, padding: 16, height: 176, justifyContent: 'space-between', marginBottom: 20 },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between' },
    heroTime: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
    healthPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
    greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', marginRight: 4 },
    healthPillText: { color: '#fff', fontSize: 12 },
    heroTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
    heroStats: { flexDirection: 'row', gap: 8 },
    heroStat: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    heroStatText: { color: '#fff', fontSize: 12 },
    sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    trainingRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    trainingCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: AppTheme.borderColor, padding: 16 },
    trainingIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    trainingTitle: { fontSize: 17, fontWeight: '700', color: AppTheme.textPrimary },
    trainingSub: { fontSize: 14, color: AppTheme.textSecondary, marginTop: 4 },
    statusCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: AppTheme.borderColor, padding: 16, marginBottom: 20 },
    statusTitle: { fontSize: 17, fontWeight: '600', color: AppTheme.textPrimary },
    statusSub: { fontSize: 14, color: AppTheme.textSecondary, marginTop: 4 },
    scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: AppTheme.borderColor },
    scheduleTime: { width: 56, fontWeight: '600', color: AppTheme.primaryColor },
    scheduleTitle: { flex: 1, fontSize: 16, color: AppTheme.textPrimary },
    emptyLine: { color: AppTheme.textSecondary, marginBottom: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    featureCell: { width: '47%', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: AppTheme.borderColor, padding: 16, alignItems: 'center' },
    featureDisabled: { opacity: 0.7 },
    featureIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: `${AppTheme.primaryColor}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    featureLabel: { fontSize: 15, fontWeight: '600', color: AppTheme.textPrimary },
    comingSoon: { fontSize: 12, color: AppTheme.textSecondary, marginTop: 4 },
    aiTip: { borderRadius: 16, padding: 16, flexDirection: 'row', marginBottom: 20 },
    aiTipTitle: { fontSize: 16, fontWeight: '700', color: '#9A3412' },
    aiTipBody: { fontSize: 14, color: '#C2410C', marginTop: 4, lineHeight: 20 },
    activityCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: AppTheme.borderColor, padding: 16, marginBottom: 8 },
    activityTitle: { fontSize: 17, fontWeight: '600', color: AppTheme.textPrimary },
    activitySub: { fontSize: 14, color: AppTheme.textSecondary, marginTop: 4 },
})

export default styles
