import { StyleSheet, Dimensions } from 'react-native';
import { AppTheme } from '@/common/theme';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191926',
  },
  notice: {
    backgroundColor: '#252534',
    paddingVertical: 8,
  },
  noticeText: {
    color: '#FFF',
    fontSize: 12,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  noPerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  noPerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  noPerIntro: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  controlButton: {
    position: 'absolute',
    bottom: 30,
    width: 70,
    height: 70,
    left: '15%',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
  bottomPanel: {
    height: 180,
    backgroundColor: '#191926',
    padding: 10,
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  thumbnail: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#404040',
    position: 'relative',
  },
  thumbnailRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    backgroundColor: AppTheme.primaryColor,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  btnBox: {
    height: 50,
    marginBottom: 10,
  },
  sort: {
    fontSize: 13,
    color: '#A1A1AA',
  },
  disabledButton: {
    opacity: 0.6,
  },
  imageContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    padding: 2,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  selectionNumber: {
    position: 'absolute',
    right: 5,
    top: 5,
    backgroundColor: AppTheme.primaryColor,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    color: '#FFF',
    fontSize: 12,
  },
});

export default styles;
