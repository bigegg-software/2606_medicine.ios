module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: { '@': '.' },
        },
      ],
      ['import', { libraryName: '@ant-design/react-native' }],
      'react-native-worklets/plugin',
    ],
  };
};
