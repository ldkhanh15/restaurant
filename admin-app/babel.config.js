module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/api': './src/api',
            '@/hooks': './src/hooks',
            '@/store': './src/store',
            '@/theme': './src/theme',
            '@/utils': './src/utils',
            '@/navigation': './src/navigation',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};