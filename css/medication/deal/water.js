import { Dimensions, StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CUP_HEIGHT = 209;
const CUP_SCENE_EXTRA = 88;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppTheme.backgroundColor,
    },
    pageBody: {
        flex: 1,
    },
    body: {
        paddingTop: 2,
        paddingBottom: 40,
        width: '100%',
        overflow: 'visible',
    },
    waterCalendar: {
        marginTop: 16,
        marginHorizontal: 41,
        alignSelf: 'stretch',
        overflow: 'hidden',
    },
    weekHead: {
        flexDirection: 'row',
        width: '100%',
    },
    weekCell: {
        width: '14.28%',
        height: 21,
        justifyContent: 'center',
        alignItems: 'center',
    },
    weekCellText: {
        fontWeight: 400,
        fontSize: 14,
        color: AppTheme.textPrimary,
        lineHeight: 21,
        textAlign: 'center',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        marginBottom: 8,
        overflow: 'hidden',
    },
    dash: {
        width: 5,
        height: 1,
        backgroundColor: 'rgba(153,153,153,0.17)',
    },
    weekGrid: {
        flexDirection: 'row',
        width: '100%',
    },
    dayCell: {
        width: '14.28%',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayInner: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    daySelected: {
        backgroundColor: '#053A93',
        borderRadius: 20,
    },
    dayText: {
        fontWeight: 400,
        fontSize: 14,
        color: AppTheme.textPrimary,
        lineHeight: 21,
        textAlign: 'center',
    },
    dayTextSelected: {
        fontWeight: 400,
        fontSize: 14,
        color: '#FFFFFF',
        textAlign: 'center',
    },
    recordTime: {
        marginTop: 20,
        marginHorizontal: 41,
    },
    recordTimeTitle: {
        fontWeight: 400,
        fontSize: 16,
        color: "#333333",
    },
    recordTimeValue: {
        fontWeight: 500,
        fontSize: 14,
        color: "#173F7D"
    },
    recordImg: {
        width: 17,
        height: 17,
        marginLeft: 6
    },
    waterInputBoxContainer: {
        marginTop: 40,
        height: 55,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    waterInputBox: {
        width: 160,
        height: 55,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    waterInput: {
        width: '100%',
        fontWeight: 'bold',
        fontSize: 42,
        color: '#000000',
        textAlign: 'center',
        padding: 0,
    },
    waterInputUnitWrap: {
        position: 'absolute',
        left: '50%',
        marginLeft: 85,
        height: 55,
        paddingBottom: 8,
        justifyContent: 'flex-end',
    },
    waterInputUnit: {
        fontWeight: 400,
        fontSize: 18,
        color: '#000000',
    },
    lineBoxWrap: {
        marginTop: 14,
    },
    lineBoxText: {
        fontWeight: 400,
        fontSize: 14,
        color: "#666666"
    },
    lineBox: {
        width: 1,
        height: 17,
        marginHorizontal: 11,
        backgroundColor: '#666666',
    },
    cupScene: {
        width: '100%',
        height: CUP_HEIGHT + CUP_SCENE_EXTRA,
        marginTop: 36,
        position: 'relative',
        alignItems: 'center',
        overflow: 'visible',
    },
    cupBackgroundWrap: {
        position: 'absolute',
        top: 83,
        width: SCREEN_WIDTH,
        height: 290,
        left: '50%',
        marginLeft: -SCREEN_WIDTH / 2,
        alignItems: 'center',
        zIndex: 0,
    },
    cupBackground: {
        width: 637,
        height: 290,
    },
    cupForeground: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        height: CUP_HEIGHT,
    },
    cupAdjustBtnLeft: {
        width: 51,
        height: 51,
        marginRight: 33,
    },
    cupAdjustBtnRight: {
        width: 51,
        height: 51,
        marginLeft: 33,
    },
    cupAdjustBtnImg: {
        width: 51,
        height: 51,
    },
    quickAddText: {
        marginLeft: 32,
        fontWeight: 500,
        fontSize: 16,
        color: "#000000"
    },
    quickAddItem: {
        width: 66,
        height: 60,
        marginTop: 18,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: 'rgba(23,63,125,0.06)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
    },
    quickAddItemFirst: {
        marginLeft: 32,
    },
    quickAddItemGap: {
        marginRight: 14,
    },
    quickAddItemLast: {
        marginRight: 32,
    },
    quickAddItemText: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#000000',
        textAlign: 'center',
    },
    quickAddUnit: {
        fontWeight: 500,
        fontSize: 14,
        color: '#999999',
        textAlign: 'center',
    },
})

export default styles;
