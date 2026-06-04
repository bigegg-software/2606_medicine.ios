const ScaledText = require('../src/components/ScaledText').default;
const ScaledTextInput = require('../src/components/ScaledTextInput').default;
const RN = require('react-native-original');

module.exports = new Proxy(RN, {
  get(target, prop) {
    if (prop === 'Text') {
      return ScaledText;
    }
    if (prop === 'TextInput') {
      return ScaledTextInput;
    }
    return target[prop];
  },
});
