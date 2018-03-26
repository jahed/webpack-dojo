const { runWebpack, expect } = require('@webpack-dojo/webpack-tester')
const { withStats } = runWebpack(require('./webpack.config'))

describe('webpack.config.js', () => {
  it('compiles without errors', withStats(stats => {
    expect(stats).to.be.an('object')
  }))

  it('contains an index asset', withStats(stats => {
    expect(stats).to.deep.equal([])
  }))
})
