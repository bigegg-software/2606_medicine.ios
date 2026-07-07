const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const scaledRnPath = path.resolve(projectRoot, 'common/react-native-scaled.js');
const nativeRnPath = path.resolve(projectRoot, 'node_modules/react-native/index.js');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'punycode') {
    return {
      filePath: path.resolve(projectRoot, 'node_modules/punycode/punycode.js'),
      type: 'sourceFile',
    };
  }

  if (moduleName === 'tslib') {
    return {
      filePath: path.resolve(projectRoot, 'node_modules/tslib/tslib.es6.js'),
      type: 'sourceFile',
    };
  }

  // Always resolve to the real react-native package (avoid circular proxy).
  if (moduleName === 'react-native-original') {
    return { filePath: nativeRnPath, type: 'sourceFile' };
  }

  if (moduleName === 'react-native') {
    const origin = context.originModulePath || '';
    const inNodeModules = origin.includes(`${path.sep}node_modules${path.sep}`);
    const isScaledProxy = origin.includes(`${path.sep}common${path.sep}react-native-scaled`);

    if (!inNodeModules && !isScaledProxy) {
      return { filePath: scaledRnPath, type: 'sourceFile' };
    }
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
