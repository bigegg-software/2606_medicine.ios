import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
    headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 310 },
    pageTitle: { height: 27, fontWeight: 500, fontSize: 18, color: AppTheme.textPrimary, lineHeight: 27, textAlign: "center" },
    pageLine: { marginTop: 18, height: 1, backgroundColor: "#053A93", opacity: 0.06 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 18, paddingTop: 8, paddingBottom: 40 },
    navBox: { marginTop: 16, paddingHorizontal: 18, paddingBottom: 10 },
    navCol: { paddingHorizontal: 8 },
    navItemWrap: {
        position: 'relative',
        alignItems: 'center',
        paddingBottom: 12,
    },
    navText: { fontWeight: 400, fontSize: 16, color: "#999999", lineHeight: 22 },
    activeNavText: { color: AppTheme.primaryColor, fontWeight: 500, fontSize: 18, lineHeight: 24 },
    navIndicatorWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 6,
        alignItems: 'center',
    },
    navIndicator: {
        width: 34,
        height: 10,
    },
    sectionTitle: {
        marginTop: 16,
        height: 24,
        fontWeight: 500,
        fontSize: 18,
        color: AppTheme.textPrimary,
    },
    mapBox: {
        marginTop: 14,
    },
    mapBoxItem: {
        marginBottom: 10,
        paddingHorizontal: 21,
        paddingVertical: 7,
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
        color: AppTheme.textPrimary,
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
        color: "#999",
        lineHeight: 19,
    },
    newDynamicBox: {
        marginTop: 14,
        backgroundColor: "#FFF",
        borderRadius: 8,
        shadowColor: '#053A93',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    newDynamicIcon: {
        height: 155,
        width: "100%",
        borderRadius: 8,
        overflow: "hidden"
    },
    newDynamicContent: {
        paddingHorizontal: 19,
        paddingVertical: 16
    },
    newDynamicContentText: {
        marginTop: 6,
        fontWeight: 400,
        fontSize: 14,
        color: "#999999",
        lineHeight: 19,
    },
    btmBox: {
        marginTop: 16
    },
    headBox: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 58,
        height: 30,
    },
    head1: {
        width: 30,
        height: 30,
        borderRadius: 15,
        zIndex: 1,
    },
    head2: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginLeft: -16,
        zIndex: 2,
    },
    head3: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginLeft: -16,
        zIndex: 3,
    },
    btmText: {
        fontWeight: 400,
        fontSize: 12,
        color: "#999999",
        marginLeft: 7,
        lineHeight: 30
    },
    btmBtn: {
        height: 26,
        borderRadius: 13,
        paddingHorizontal: 13,
        backgroundColor: "#053A93",
    },
    btmBtnText: {
        fontWeight: 500,
        fontSize: 12,
        color: "#FEFFFF",
    },
    timeText: {
        marginTop: 15,
        height: 19,
        fontWeight: 400,
        fontSize: 14,
        color: "#999999",
        lineHeight: 19,
        textAlign: "center",
    }
});

export default styles;
