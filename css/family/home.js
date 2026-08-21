import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F8FF' },
    floatingHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        elevation: 20,
    },
    floatingHeaderInner: {
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
    },
    miniLogo: { width: 99, height: 20 },
    topRight: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 40,
        minHeight: 40,
    },
    rightImg: {
        width: 20,
        height: 20,
    },
    redDot: {
        position: 'absolute',
        top: 2,
        right: -6,
        paddingHorizontal: 5,
        paddingVertical: 2,
        backgroundColor: '#FF0000',
        borderRadius: 13,
        minWidth: 18,
        alignItems: 'center',
    },
    redDotText: { fontWeight: 'bold', fontSize: 10, color: '#FFFFFF' },
    developingWrap: {
        paddingHorizontal: 12,
    },
    topBox: {
        height: 110,
        overflow: "hidden",
    },
    topBoxTitle: {
        marginTop: 30,
        fontWeight: "bold",
        fontSize: 18,
        color: "#6D925E",
    },
    topBoxSubtitle: {
        marginTop: 8,
        fontWeight: 500,
        fontSize: 14,
        color: "#666666",
    },
    topBoxImg: {
        width: 111,
        height: 154,
        marginRight: 36,
    },
    todoCard: {
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        padding: 12,
        overflow: 'visible',
    },
    todoHeader: {
        position: 'relative',
        minHeight: 18,
        justifyContent: 'center',
    },
    todoRightHit: {
        position: 'absolute',
        top: -13,
        right: -13,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    todoBar: {
        width: 4,
        height: 13,
        backgroundColor: '#6D925E',
        borderRadius: 10,
        marginRight: 8,
    },
    todoTitle: {
        fontWeight: 'bold',
        fontSize: 15,
        color: '#333333',
    },
    todoRightIcon: {
        width: 18,
        height: 18,
    },
    todoItem: {
        marginTop: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
    },
    todoDot: {
        width: 8,
        height: 8,
        backgroundColor: '#FB4550',
        borderRadius: 4,
        marginRight: 12,
    },
    todoItemText: {
        flexShrink: 1,
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
    },
    todoTag: {
        marginLeft: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(109,146,94,0.1)',
        borderRadius: 3,
    },
    todoTagText: {
        fontWeight: '500',
        fontSize: 12,
        color: '#6D925E',
    },
    todoTitleWrap: {
        marginTop: 12,
        marginLeft: 12,
    },
    familyHealthWrap: {
        marginTop: 12
    },
    familyHealthItem: {
        padding: 12,
        paddingTop: 15,
        marginRight: 12,
        width: 109,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
    },
    familyHealthIcon: {
        width: 22,
        height: 22,
        borderRadius: 12,
    },
    familyHealthName: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333333',
        marginLeft: 6,
    },
    familyHealthRow: {
        marginTop: 8,
        width: '100%',
    },
    familyHealthRowFirst: {
        marginTop: 12,
    },
    familyHealthLabel: {
        fontWeight: '500',
        fontSize: 14,
        color: '#999999',
    },
    familyHealthValue: {
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
    },
    familyHealthValueWarn: {
        fontWeight: '500',
        fontSize: 14,
        color: '#FB4550',
    },
    familyHealthTrendIcon: {
        width: 15,
        height: 15,
        marginLeft: 2,
    },
    familyHealthTagDone: {
        paddingVertical: 4,
        paddingHorizontal: 6,
        backgroundColor: 'rgba(109,146,94,0.06)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(109,146,94,0.3)',
    },
    familyHealthTagDoneText: {
        fontWeight: 'bold',
        fontSize: 11,
        color: '#6D925E',
    },
    familyHealthTagMiss: {
        paddingVertical: 4,
        paddingHorizontal: 6,
        backgroundColor: 'rgba(251,69,80,0.06)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(251,69,80,0.3)',
    },
    familyHealthTagMissText: {
        fontWeight: 'bold',
        fontSize: 11,
        color: '#FB4550',
    },
    familyHealthAddIcon: {
        width: 40,
        height: 40
    },
    familyHealthAddText: {
        marginTop: 8,
        fontWeight: 500,
        fontSize: 14,
        color: '#333333',
    },
    familyHealthPendingText: {
        marginTop: 8,
        fontWeight: '400',
        fontSize: 14,
        color: '#999999',
    },
    focusCardWrap: {
        marginTop: 12,
        gap: 12,
    },
    focusCard: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFFFFF',
        alignItems: 'center',
    },
    focusCardIcon: {
        width: 30,
        height: 30,
    },
    focusCardTitle: {
        marginTop: 14,
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333333',
        textAlign: 'center',
    },
    focusCardSubtitle: {
        marginTop: 8,
        fontWeight: '500',
        fontSize: 13,
        color: '#666666',
        textAlign: 'center',
    },
    activityScroll: {
        marginTop: 12,
        paddingBottom: 24
    },
    activityCard: {
        width: 245,
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginRight: 12,
    },
    activityName: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333333',
    },
    activityPointsIcon: {
        width: 12,
        height: 12,
    },
    activityPoints: {
        marginLeft: 4,
        fontWeight: 'bold',
        fontSize: 15,
        color: '#333333',
    },
    activityProgressRow: {
        marginTop: 15,
    },
    activityProgressLabel: {
        fontWeight: '500',
        fontSize: 14,
        color: '#333333',
    },
    activityProgressValue: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#6D925E',
    },
    activityProgressTrack: {
        marginTop: 6,
        width: 221,
        height: 6,
        backgroundColor: '#ECEDF1',
        borderRadius: 25,
        overflow: 'hidden',
    },
    activityProgressFill: {
        height: 6,
        backgroundColor: '#6D925E',
        borderRadius: 25,
    },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    emptyIcon: {
        width: 80,
        height: 80,
    },
    emptyText: {
        marginTop: 25,
        fontWeight: '500',
        fontSize: 14,
        color: '#999999',
        textAlign: 'center',
    },
});

export default styles;
