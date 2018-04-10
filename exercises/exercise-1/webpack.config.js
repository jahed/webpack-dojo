const path = require('path')

const inputPath = path.resolve(__dirname, 'src')
const outputPath = path.resolve(__dirname, 'dist')

module.exports = {
  context: inputPath,
  entry: {
    index: './index.js'
  },
  // output: {
  //   path: outputPath,
  //   filename: '[name]-[chunkhash].js'
  // }
}
