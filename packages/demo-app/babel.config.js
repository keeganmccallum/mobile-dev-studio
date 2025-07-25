module.exports = function(api) {
  api.cache(true);
  
  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
      ['@babel/plugin-transform-private-methods', { loose: false }],
      ['@babel/plugin-transform-class-properties', { loose: false }],
      ['@babel/plugin-transform-private-property-in-object', { loose: false }],
      ['@babel/plugin-proposal-optional-chaining', { loose: false }],
      ['@babel/plugin-proposal-nullish-coalescing-operator', { loose: false }],
    ],
  };
};