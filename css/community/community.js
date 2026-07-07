import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 310 },
    topNavBox: {
        flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginTop: 8, paddingHorizontal: 4
    },
    topNavItem: { alignItems: 'center', justifyContent: 'center', minHeight: 36, },
    topNavItemBg: { minHeight: 36, alignItems: 'center', justifyContent: 'center', },
    topNavItemText: { paddingHorizontal: 19, fontWeight: '400', fontSize: 16, color: '#999999' },
    topNavItemTextActive: { paddingHorizontal: 19, fontWeight: '500', fontSize: 18, color: '#053A93' },

    mapBoxItemImg: { width: 68, height: 68, borderRadius: 6, },
    mapRightBox: { marginLeft: 17, flex: 1 },
    mapBoxItemTitle: { fontWeight: 500, fontSize: 16, color: AppTheme.textPrimary, },
    mapRightBtn: { height: 19, backgroundColor: "#00C950", borderRadius: 16, },
    mapRightText: { fontWeight: 400, fontSize: 12, color: "#FFFFFF", lineHeight: 19, paddingHorizontal: 7, },
    wbmBtn: { height: 19, backgroundColor: "#053A93", borderRadius: 16, },
    wbmText: { fontWeight: 400, fontSize: 12, color: "#FFFFFF", lineHeight: 19, paddingHorizontal: 7, },
    mapIntro: { marginTop: 11, fontWeight: 400, fontSize: 14, lineHeight: 20, color: AppTheme.textSecondary }, mapBox: { marginTop: 14, },
    mapBoxItem: {
        marginBottom: 10, paddingHorizontal: 19, paddingVertical: 12, paddingBottom: 17, shadowColor: '#053A93', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 12, backgroundColor: "#FFF", borderRadius: 8
    },
    pageTitle: { height: 27, fontWeight: 500, fontSize: 18, color: AppTheme.textPrimary, lineHeight: 27, textAlign: "center" },
    pageLine: { marginTop: 18, height: 1, backgroundColor: "#053A93", opacity: 0.06 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    pageContent: { flex: 1 },
    scroll: { padding: 18, paddingTop: 8, paddingBottom: 40 },
    navBox: { marginTop: 14, paddingHorizontal: 14, paddingBottom: 0 },
    navCol: { paddingHorizontal: 18 },
    navItemWrap: { position: 'relative', alignItems: 'center', paddingBottom: 12, },
    navText: { fontWeight: 400, fontSize: 16, color: AppTheme.textPrimary, lineHeight: 22 },
    activeNavText: { color: AppTheme.primaryColor, fontWeight: 500, fontSize: 18, lineHeight: 24 },
    navIndicatorWrap: { position: 'absolute', left: 0, right: 0, bottom: 6, alignItems: 'center', },
    navIndicator: { width: 34, height: 10, },
    sectionTitle: { marginTop: 16, fontWeight: 500, fontSize: 18, marginLeft: 14, color: AppTheme.textPrimary, },
    mapIcon: { width: 14, height: 14, },
    mapText: { marginLeft: 2, marginRight: 7, height: 19, fontWeight: 400, fontSize: 14, color: "rgba(43,18,13,0.75)", lineHeight: 19, },
    newDynamicBox: {
        marginTop: 14, backgroundColor: "#FFF", borderRadius: 8, shadowColor: '#053A93', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 12,
    },
    newDynamicContent: { paddingHorizontal: 19, paddingVertical: 16 },
    newDynamicContentText: { marginTop: 6, fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary, lineHeight: 19, },
    timeText: { marginTop: 15, height: 19, fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary, lineHeight: 19, textAlign: "center", },

    // live
    liveTopRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 12, },
    liveTopBox: {
        width: '48%', borderRadius: 18, backgroundColor: "#FFF", shadowColor: '#053A93', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 14,
    },
    liveTopInfo: { padding: 16, },
    liveTopText: { fontWeight: 400, fontSize: 14, color: "#000000", marginTop: 2 },
    liveTopIntro: { marginTop: 6, fontWeight: 400, fontSize: 12, color: AppTheme.textSecondary, },
    liveTopImgWrap: { position: 'relative', width: '100%', aspectRatio: 1, borderTopLeftRadius: 14, borderTopRightRadius: 14, overflow: 'hidden', },
    liveTopImg: { width: '100%', height: '100%', },
    liveTopCategoryTag: {
        position: 'absolute', top: 0, right: 0, height: 24, paddingHorizontal: 15, backgroundColor: '#B4D0FF', borderTopRightRadius: 14,
        borderBottomLeftRadius: 36
    },
    liveTopCategoryText: { fontWeight: 500, fontSize: 12, color: '#053A93', },
    liveTopLiveTag: {
        position: 'absolute', right: 6, bottom: 6, height: 16, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 3, backgroundColor: 'rgba(0, 0, 0, 0.62)', borderRadius: 8,
    },
    liveTopLiveDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#34C759', },
    liveTopLiveText: { fontWeight: '400', fontSize: 10, color: '#FFFFFF', lineHeight: 12, },
    liveImg: { width: 85, height: 85, borderRadius: 18, },
    liveMapBox: { marginLeft: 10, flex: 1 },


    // Course
    courseBox: { marginTop: 12, backgroundColor: "#FEFFFF", borderRadius: 8, shadowColor: '#053A93', shadowOffset: { width: 0, height: 4 }, },
    courseImgWrap: { position: 'relative', width: '100%' },
    courseImg: { width: '100%', height: 155, borderTopLeftRadius: 18, borderTopRightRadius: 18, },
    courseCategoryTag: {
        position: 'absolute', top: 0, right: 0, paddingVertical: 5, paddingHorizontal: 16,
        borderTopRightRadius: 18, borderBottomLeftRadius: 50, overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
    },
    courseBoxInfo: { padding: 18 },
    courseTitle: { fontWeight: 500, fontSize: 16, color: "#333333" },
    courseText: { fontWeight: 400, marginTop: 10, fontSize: 14, color: "#999999" },
    gkrsText: { position: 'absolute', zIndex: 1, bottom: 5, left: 10, fontWeight: 400, fontSize: 12, color: "#FFFFFF" },
    coursePlayIcon: { position: 'absolute', top: '50%', left: '50%', width: 38, height: 38, transform: [{ translateX: -19 }, { translateY: -19 }], },
    courseIcon: { width: 19, height: 19, marginLeft: 21 },


    //ranking
    rankingBpx: {
        paddingTop: 10,
        alignItems: 'flex-end',
    },
    podiumWrap: {
        width: "32%",
        position: 'relative',
        overflow: 'hidden',
        borderTopLeftRadius: 95,
        borderTopRightRadius: 95,
    },
    podiumWrapFirst: {
        marginBottom: 18,
    },
    podiumBg: {
        position: "absolute",
        width: "100%",
        height: 138,
        ...StyleSheet.absoluteFillObject,
    },
    podiumInner: {
        paddingBottom: 16,
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    headImg: { width: 54, height: 54, borderRadius: 27, marginTop: 4 },
    headBg: { width: "85%", height: 36, marginTop: 20 },
    headBgFirst: { width: "85%", height: 50, marginTop: 16 },
    rankingItemText: { marginTop: 7, fontWeight: 500, fontSize: 16, color: AppTheme.textPrimary },
    rankingItemTextFirst: { fontSize: 17, fontWeight: '600', maxWidth: 108 },
    avatarIcon: { width: 18, height: 18 },
    avatarValue: { marginLeft: 5, fontWeight: 400, fontSize: 14 },
    rankingItemBox: {
        marginTop: 12,
        height: 70,
        paddingHorizontal: 24,
        paddingVertical: 14,
        backgroundColor: "#FEFFFF",
        shadowColor: '#053A93', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 12,
        borderRadius: 12,
    },
    numBox: {
        width: 40,
        textAlign: "left",
        fontWeight: 400,
        fontSize: 20,
        color: "#A4A4A4",
    },
    rankingItemText2: {
        fontWeight: 400,
        fontSize: 14,
        color: "#999999"
    },
    rankingPage: { flex: 1 },
    rankingScroll: { flex: 1 },
    rankingScrollContent: { paddingHorizontal: 18, paddingBottom: 86 },
    rankingListInfo: { flex: 1, marginLeft: 17 },
    rankingScoreRow: { marginTop: 7 },
    rankingMeBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    rankingMeItemBox: {
        height: 70,
        paddingHorizontal: 42,
        paddingVertical: 14,
        backgroundColor: "#FEFFFF",
        shadowColor: '#053A93',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    rankingUpdateHint: {
        alignSelf: 'flex-end',
        marginTop: 10,
        fontWeight: '400',
        fontSize: 12,
        color: '#999999',
    },
    listImg: { width: 42, height: 42, borderRadius: 22 }














})

export default styles;
