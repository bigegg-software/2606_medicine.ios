import { StyleSheet } from 'react-native';
import { AppFonts } from '@/common/fonts';
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
    mapRightText: { fontWeight: 400, fontSize: 12, color: "#FFFFFF", paddingHorizontal: 7, },
    wbmBtn: { backgroundColor: "#0951AE", borderRadius: 4, },
    wbmText: { fontWeight: 400, fontSize: 12, color: "#FFFFFF", paddingHorizontal: 7, paddingVertical: 2 },
    activityStatusTag: {
        height: 22,
        paddingHorizontal: 8,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityStatusTagText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    mapIntro: { marginTop: 11, fontWeight: 400, fontSize: 14, lineHeight: 20, color: AppTheme.textSecondary }, mapBox: { marginTop: 14, },
    mapBoxItem: {
        marginBottom: 10, padding: 15, shadowColor: '#053A93', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 12, backgroundColor: "#FFF", borderRadius: 6
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
    sectionTitleRow: {
        marginLeft: 14,
        marginRight: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitleIcon: {
        width: 20,
        height: 20,
        marginRight: 6,
    },
    sectionTitleText: {
        fontWeight: '500',
        fontSize: 18,
        color: AppTheme.textPrimary,
    },
    mapIcon: { width: 15, height: 15 },
    mapText: { marginLeft: 2, marginRight: 7, fontWeight: 500, fontSize: 14, color: "#999999" },
    mapMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    mapMetaItem: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
    mapMetaLocation: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0, marginHorizontal: 6 },
    mapMetaLocationText: { flex: 1, minWidth: 0, marginLeft: 2, marginRight: 0 },
    newDynamicBox: {
        marginTop: 14, backgroundColor: "#FFF", borderRadius: 8, shadowColor: '#053A93', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 12,
    },
    newDynamicContent: { paddingHorizontal: 19, paddingVertical: 16 },
    newDynamicContentText: { marginTop: 6, fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary, lineHeight: 19, },
    timeText: { marginTop: 15, height: 19, fontWeight: 400, fontSize: 14, color: AppTheme.textSecondary, lineHeight: 19, textAlign: "center", },

    // live
    liveTopScroll: {
        marginTop: 8,
        overflow: 'visible',
    },
    liveTopScrollContent: {
        paddingTop: 4,
        paddingBottom: 16,
        paddingRight: 8,
    },
    liveTopBox: {
        width: 156,
        marginRight: 12,
        borderRadius: 8,
        backgroundColor: '#FFF',
        shadowColor: '#053A93',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
    },
    liveTopInfo: { padding: 8, },
    liveTopText: { fontWeight: "bold", fontSize: 14, color: "#333333", marginTop: 2 },
    liveTopIntro: { marginTop: 6, fontWeight: 400, fontSize: 12, color: AppTheme.textSecondary, lineHeight: 20 },
    liveTopImgWrap: { position: 'relative', width: '100%', aspectRatio: 1, borderTopLeftRadius: 8, borderTopRightRadius: 8, overflow: 'hidden', },
    liveTopImg: { width: '100%', height: '100%', },
    liveTopCategoryTag: {

        position: 'absolute', top: 0, right: 0, height: 24, paddingHorizontal: 15, backgroundColor: '#B4D0FF', borderTopRightRadius: 8,
        borderBottomLeftRadius: 8
    },
    liveTopCategoryText: { fontWeight: 500, fontSize: 12, color: '#053A93', },
    liveTopLiveTag: {
        position: 'absolute', right: 6, bottom: 6, height: 16, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 3, backgroundColor: 'rgba(0, 0, 0, 0.62)', borderRadius: 4,
    },
    liveTopLiveDot: { width: 12, height: 12, marginRight: 2 },
    liveTopLiveText: { fontWeight: '400', fontSize: 10, color: '#FFFFFF', lineHeight: 12, },
    liveImg: { width: 85, height: 85, borderRadius: 6, },
    liveImgWrap: {
        position: 'relative',
        width: 85,
        height: 85,
        borderRadius: 6,
        overflow: 'hidden',
    },
    livePreviewTag: {
        position: 'absolute',
        right: 4,
        bottom: 4,
        height: 16,
        paddingHorizontal: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.62)',
        borderRadius: 4,
    },
    livePreviewTagIcon: { width: 12, height: 12, marginRight: 2 },
    livePreviewTagText: { fontWeight: '400', fontSize: 10, color: '#FFFFFF', lineHeight: 12 },
    liveMapBox: { marginLeft: 15, flex: 1 },


    // Course
    courseBox: { marginBottom: 12, backgroundColor: "#FEFFFF", borderRadius: 8, shadowColor: '#053A93', shadowOffset: { width: 0, height: 4 }, },
    courseImgWrap: { position: 'relative', width: '100%', overflow: 'hidden', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
    courseImg: { width: '100%', height: 155, borderTopLeftRadius: 8, borderTopRightRadius: 8, },
    courseImgGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 50,
        zIndex: 1,
        justifyContent: 'flex-end',
        paddingLeft: 8,
        paddingBottom: 8,
    },
    courseCategoryTag: {
        backgroundColor: "#D5E6F6",
        borderBottomLeftRadius: 8,
        position: 'absolute', top: 0, right: 0, paddingVertical: 5, paddingHorizontal: 10,
        borderTopRightRadius: 8, overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
    },
    courseBoxInfo: { padding: 18 },
    courseTitle: { fontWeight: 'bold', fontSize: 16, color: "#333333" },
    courseText: { fontWeight: 500, marginTop: 8, fontSize: 14, color: "#999999" },
    gkrsIcon: {
        width: 12,
        height: 12,
        marginRight: 4,
    },
    gkrsText: { fontWeight: 400, fontSize: 12, color: "#FFFFFF" },
    coursePlayWrap: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 46,
        height: 46,
        marginLeft: -23,
        marginTop: -23,
        borderRadius: 23,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.18)',
        zIndex: 2,
    },
    coursePlayBlur: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    coursePlayBlurFallback: {
        backgroundColor: 'rgba(255,255,255,0.28)',
    },
    coursePlayIcon: { width: 23, height: 23 },
    courseIcon: { width: 15, height: 15, marginRight: 4 },
    courseBtmText: { fontWeight: 500, fontSize: 14, color: "#999999" },
    courseTabBox: {
        marginBottom: 16,
        paddingHorizontal: 14,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    courseTabItem: {
        paddingHorizontal: 14,
        height: 30,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    courseTabItemActive: {
        backgroundColor: '#6D925E',
        borderColor: '#6D925E',
    },
    courseTabText: {
        fontWeight: '500',
        fontSize: 13,
        color: '#333333',
    },
    courseTabTextActive: {
        color: '#FFFFFF',
    },

    //ranking
    rankingBpx: {
        paddingTop: 27,
        alignItems: 'flex-end',
        marginBottom: -10
    },
    podiumWrap: {
        width: 106,
        position: 'relative',
        overflow: 'hidden',
    },
    podiumWrapFirst: {
        width: 111,
        marginBottom: 4,
    },
    podiumBg: {
        position: "absolute",
        width: "100%",
        height: 138,
        ...StyleSheet.absoluteFillObject,
    },
    podiumInner: {},
    headImg: { width: 48, height: 48, borderRadius: 24, marginTop: 4, zIndex: 1 },
    headImgFirst: { width: 59, height: 59, borderRadius: 30, marginTop: 4 },
    headBg: { width: "100%", height: 123, marginTop: -2, position: "relative" },
    headBgContent: { position: "absolute", top: 52, width: "100%" },
    headBgFirst: { width: "100%", height: 152, marginTop: -4 },
    rankingItemText: { fontWeight: 500, width: "100%", fontSize: 16, color: AppTheme.textPrimary, zIndex: 1 },
    rankingItemTextFirst: { fontSize: 17, fontWeight: '600', maxWidth: 108, color: "#AE761B" },
    avatarIcon: { width: 18, height: 18 },
    avatarValue: { fontWeight: 500, fontSize: 14, color: "#999999" },
    rankingItemBox: {
        marginTop: 12,
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
    rankNumWrap: {
        width: 48,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    rankNumWrapUnlisted: {
        width: 52,
        height: 42,
        marginLeft: -20,
        marginRight: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankNumText: {
        width: 40,
        fontFamily: AppFonts.puHuiTiBold,
        fontSize: 22,
        lineHeight: 28,
        color: '#A4A4A4',
        textAlign: 'left',
        fontStyle: 'italic',
        transform: [{ skewX: '-12deg' }],
    },
    rankNumTextUnlisted: {
        width: '100%',
        fontSize: 12,
        lineHeight: 16,
        textAlign: 'center',
        fontStyle: 'normal',
        fontWeight: '500',
        transform: [],
    },
    rankingItemText2: {
        marginTop:4,
        fontWeight: 500,
        fontSize: 13,
        lineHeight:20,
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
        textAlign: 'center',
        marginTop: 10,
        fontWeight: '400',
        fontSize: 12,
        color: '#999999',
    },
    listImg: { width: 42, height: 42, borderRadius: 22 },
    tabBox: {
        marginTop: 13,
        margin: "auto",
        width: 236,
        height: 40,
        padding: 3,
        backgroundColor: "rgba(109,146,94,0.12)",
        borderRadius: 25
    },
    tabItem: {
        flex: 1,
        height: 34,
        borderRadius: 50,
    },
    tabItemActive: {
        backgroundColor: '#FFFFFF',
        borderRadius: 50,
    },
    tabItemIcon: {
        width: 18,
        height: 18,
        marginRight: 3
    },
    tabItemText: {
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
    },
    tabItemTextActive: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333333',
    },
    rankingItemText3: {
        fontWeight: 500,
        fontSize: 12,
        color: "#999999",
        marginTop: 4,
        textAlign: "center"
    },
    rankingItemText4: {
        fontWeight: 500,
        fontSize: 12,
        marginTop: 4,
        color: "#999999",
        textAlign: "center"

    }













})

export default styles;
