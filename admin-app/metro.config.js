const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .cjs extension support for socket.io-client
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;