const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: {
    popup: path.join(__dirname, 'src/pages/popup/index.tsx'),
    content: path.join(__dirname, 'src/content/index.ts'),
    background: path.join(__dirname, 'src/background/index.ts'),
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: 'vendor'
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { 
          from: path.resolve('src/manifest.json'),
          to: path.resolve('dist'),
          transform(content) {
            return content
              .toString()
              .replace('${FIREBASE_CLIENT_ID}', process.env.FIREBASE_CLIENT_ID);
          },
        },
        { from: path.resolve('public'), to: path.resolve('dist') },
      ]
    }),
    new HtmlPlugin({
      template: path.resolve('src/pages/popup/index.html'),
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
    }),
    new Dotenv()
  ],
}; 