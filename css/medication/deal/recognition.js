import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: '#000000',
    },
    cameraWrap: {
        marginTop: '40%',
        width: 320,
        height: 320,
        borderRadius: 32,
        borderWidth: 4,
        overflow: 'hidden',
        borderColor: '#FFFFFF',
    },
    cameraPreview: {
        flex: 1,
    },
    shutterWrap: {
        position: 'absolute',
        bottom: 100,
        width: '100%',
    },
    shutterBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: '#FFFFFF',
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
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
        flex: 1,
        paddingTop: 96,
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
        width: 75,
        height: 75,
        borderRadius: 37.5,
        backgroundColor: '#D9D9D9',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    icon: {
        width: 75,
        height: 75,
        resizeMode: 'cover',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#333333',
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
