const MemoryFS = require('memory-fs')
const webpack = require('webpack')

const createCompiler = config => {
  const compiler = webpack(config)
  compiler.outputFileSystem = new MemoryFS()
  return compiler
}

module.exports = createCompiler
