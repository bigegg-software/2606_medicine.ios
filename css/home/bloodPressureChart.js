import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    width: 172,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  highlightBar: {
    position: 'absolute',
    width: 138,
    height: 18,
    backgroundColor: 'rgba(238,156,68,0.1)',
    borderRadius: 25,
  },
  highlightBarGlucose: {
    position: 'absolute',
    width: 138,
    height: 18,
    backgroundColor: 'rgba(135,133,131,0.1)',
    borderRadius: 25,
  },
  highlightBarWeight: {
    position: 'absolute',
    width: 138,
    height: 18,
    backgroundColor: 'rgba(9,81,174,0.1)',
    borderRadius: 25,
  },
  highlightBarUricAcid: {
    position: 'absolute',
    width: 138,
    height: 18,
    backgroundColor: 'rgba(109,146,94,0.12)',
    borderRadius: 25,
  },
  chart: {
    width: 172,
    height: 60,
    backgroundColor: 'transparent',
  },
});

export default styles;
