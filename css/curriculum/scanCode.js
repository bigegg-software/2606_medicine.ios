import { StyleSheet } from 'react-native';

export const FRAME_SIZE = 240;
/** 角标相对取景框外扩，避免贴边挤在一起 */
const FRAME_PAD = 18;
const OUTER_SIZE = FRAME_SIZE + FRAME_PAD * 2;
const CORNER = 28;
const CORNER_W = 3;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraWrap: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000000',
  },
  headerArea: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 44,
  },
  topBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  closeIcon: {
    width: 16,
    height: 16,
  },
  title: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  frameArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** 外框：相机居中，四角标锚在外圈 */
  frameOuter: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    position: 'relative',
  },
  cameraSquareBox: {
    position: 'absolute',
    top: FRAME_PAD,
    left: FRAME_PAD,
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#191926',
  },
  cameraPreview: {
    width: '100%',
    height: '100%',
  },
  loadingBox: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#191926',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  submittingMask: {
    position: 'absolute',
    top: FRAME_PAD,
    left: FRAME_PAD,
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  submittingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#FFFFFF',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#87B874',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderBottomRightRadius: 8,
  },
  tipArea: {
    minHeight: 110,
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 48,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  tipBelow: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  tipText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
    textAlign: 'center',
  },
  tipBtn: {
    marginTop: 20,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6D925E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default styles;
