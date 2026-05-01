/** @type {import('@babel/core').ConfigFunction} */
// eslint-disable-next-line no-undef
module.exports = api => {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['react-native-unistyles/plugin', {
        root: 'src',
      }],
    ],
  }
}
