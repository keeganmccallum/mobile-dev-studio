module.exports = function(api) {
  api.cache(true);
  
  return {
    presets: [
      ['module:metro-react-native-babel-preset', {
        unstable_transformProfile: 'hermes-stable'
      }]
    ],
    plugins: [
      '@babel/plugin-transform-export-namespace-from',
      '@babel/plugin-proposal-export-default-from',
      ['@babel/plugin-transform-flow-strip-types', { 
        loose: true, 
        allowDeclareFields: true 
      }],
      '@babel/plugin-transform-typescript',
    ],
  };
};