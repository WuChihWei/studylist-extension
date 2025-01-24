const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    popup: path.resolve('src/pages/popup/index.tsx'),
    background: path.resolve('src/background/index.ts'),
    content: path.resolve('src/content/index.ts'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve('src/manifest.json'), to: path.resolve('dist') },
        { from: path.resolve('public'), to: path.resolve('dist') },
      ]
    }),
    new HtmlPlugin({
      template: path.resolve('src/pages/popup/index.html'),
      filename: 'popup.html',
      chunks: ['popup'],
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  }
}; 