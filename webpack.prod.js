const path = require('path');

module.exports = {
  entry: './src/FrameChannel.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: 'FrameChannel.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'FrameChannel',
    libraryTarget: 'umd'
  },
};