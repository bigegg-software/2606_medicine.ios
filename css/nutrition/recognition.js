import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: '#000000',
    },
    cameraWrap: {
        flex: 1,
        width: '100%',
        position: 'relative',
        backgroundColor: '#000000',
        justifyContent: 'center',
    },
    // 正方形取景框，垂直居中
    cameraSquareBox: {
        marginTop: 140,
        width: '100%',
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
        alignSelf: 'center',
    },
    cameraPreview: {
        width: '100%',
        height: '100%',
    },
    topFade: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 147,
        zIndex: 2,
        paddingHorizontal: 16,
        paddingBottom: 20,
        justifyContent: 'flex-end',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    topBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeIcon: {
        width: 18,
        height: 18,
    },
    tipIconText: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    captureHint: {
        marginTop: 18,
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        alignSelf: 'center',
        width: '100%',
    },
    shutterWrap: {
        width: '100%',
        height: 147,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    shutterBtnWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutterBtn: {
        width: 70,
        height: 70,
    },
    albumBtn: {
        position: 'absolute',
        right: 60,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    albumIcon: {
        width: 30,
        height: 30,
    },
    shutterInner: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: '#FFFFFF',
    },
    loadingBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recognizingPage: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E9E9E9',
        flex: 1,
        paddingHorizontal: 27,
        paddingTop: 100,
        paddingBottom: 50,
        alignItems: 'center',
    },
    scanTextWrap: {
        marginTop: 28,
    },
    iconArea: {
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarRing: {
        position: 'absolute',
    },
    iconWrap: {
        width: 320,
        height: 320,
        borderRadius: 8,
        resizeMode: 'cover',
    },
    btmImg: {
        width: 176,
        height: 10,
    },
    recognizingBottom: {
        width: '100%',
        marginTop: 50,
        alignItems: 'center',
    },
    loadingTextWrap: {
        marginTop: 20,
        height: 12,
        backgroundColor: '#ECEDF1',
        borderRadius: 25,
        overflow: 'hidden',
        alignSelf: 'center',
    },
    loadingTextInner: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: 12,
        backgroundColor: '#6D925E',
        borderRadius: 25,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 14,
        color: '#999999',
        textAlign: 'center',
    },
    tipTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 12,
    },
    tipText: {
        fontSize: 14,
        color: '#666666',
        lineHeight: 22,
        marginBottom: 8,
    },
    tipBtn: {
        marginTop: 20,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#4F86EE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipBtnText: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

export default styles;
