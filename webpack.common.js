const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

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
      'process.env': JSON.stringify({
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
      })
    }),
    new Dotenv()
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            return `vendor.${packageName.replace('@', '')}`;
          },
        },
      },
    },
  }
}; 