const promisify = require('@webpack-dojo/helpers/src/promisify')
const parseStats = require('./parseStats')

const runCompiler = compiler => {
  const runCompiler = promisify(compiler, 'run')
  return runCompiler()
    .then(stats => parseStats(stats))
}

module.exports = runCompiler
