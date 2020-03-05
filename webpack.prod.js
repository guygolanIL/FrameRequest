const path = require('path');

module.exports = {
  entry: './src/FrameRequest.ts',
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
    filename: 'FrameRequest.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'FrameRequest',
    libraryTarget: 'umd'
  },
};