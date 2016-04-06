'use strict'

module.exports = {
  entry: './src/main.js',
  output: {
    filename: './public/bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader!postcss-loader'
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-3']
        }
      },
      {
        test: /\.jade$/,
        loader: 'jade-loader'
      }
    ]
  },
  postcss: [
    require('autoprefixer'),
    require('precss'),
    require('postcss-clearfix'),
    require('postcss-calc')
  ]
}
