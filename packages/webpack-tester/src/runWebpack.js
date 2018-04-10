const callGuard = require('./callGuard')
const createCompiler = require('./createCompiler')
const runCompiler = require('./runCompiler')
const promiseChain = require('./promiseChain')

const runWebpack = config => {
  const stats = promiseChain(
    createCompiler,
    runCompiler
  )(config)

  return {
    stats,
    withStats: expectations => () => stats.then(stats => expectations(stats))
  }
}

module.exports = callGuard(
  ({ count }) => {
    if (count > 1) {
      throw new Error('Webpack can only be called once in a session. Otherwise some assets do not emit')
    }
  }
)(runWebpack)
