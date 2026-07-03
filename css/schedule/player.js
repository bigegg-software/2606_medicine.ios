import { StyleSheet } from 'react-native';
import { AppTheme } from '@/common/theme';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.backgroundColor },
  scroll: { padding: 12, paddingBottom: 40 },
  playerBox: { position: "relative", width: '100%', aspectRatio: 16 / 9, backgroundColor: "rgba(0,0,0,0.24)", borderRadius: 18, overflow: 'hidden' },
  playerVideo: { flex: 1, width: '100%', height: '100%' },
  playerCover: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  progressBox: { marginTop: 24, width: '100%', height: 10, backgroundColor: "rgba(5,58,147,0.14)", borderRadius: 10, overflow: 'hidden' },
  progressBar: { minWidth: 0, height: 10, paddingRight: 2, backgroundColor: '#4F86EE', borderRadius: 10, },
  progressBarInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF', },
  timeBox: { marginTop: 10, paddingHorizontal: 22, },
  timeText: { fontWeight: 500, fontSize: 14, color: '#4F86EE', },
  timeAllText: { fontWeight: 500, fontSize: 14, color: '#333333', },
  btnBox: { marginTop: 18, },
  btnImg: { width: 54, height: 54 },
  btnImgBox: { width: 54, height: 54, marginHorizontal: 32, },
  btnIcon: { width: 28, height: 28, },
  btnIconDisabled: { opacity: 0.35 },
})

export default styles
