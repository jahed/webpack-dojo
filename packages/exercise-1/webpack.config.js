const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const inputPath = path.resolve(__dirname, 'src')
const outputPath = path.resolve(__dirname, 'dist')

module.exports = {
  target: 'web',
  context: inputPath,
  entry: {
    index: ['./index.js']
  },
  output: {
    path: outputPath,
    filename: '[name]-[chunkhash].js'
  },
  module: {
    rules: []
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './index.html.ejs'
    })
  ]
}
