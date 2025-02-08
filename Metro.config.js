const path = require('path');

module.exports = {
  transformer: {
    assetPlugins: ['react-native-webp'],
  },
  resolver: {
    /* Add custom resolver options here */
  },
  watchFolders: [
    path.resolve(__dirname, 'node_modules')
  ]
};