const fs = require('fs')
const util = require('util')
const path = require('path')
const writeFile = util.promisify(fs.writeFile)
const { runWebpack, expect } = require('@webpack-dojo/webpack-tester')
const config = require('./webpack.config')
const { stats, withStats } = runWebpack(config)

stats.then(stats => {
  writeFile(path.resolve(__dirname, 'dojo_files', 'test_output', 'stats.json'), JSON.stringify(stats, null, 2))
})

const title = (id, description) => JSON.stringify({ id, description })

test(title('1.1', 'Create a Webpack config that compiles.'), withStats(stats => {
  expect(stats).toBeInstanceOf(Object)
}))

test(title('1.2', 'Output a single index.js file.'), withStats(stats => {
  expect(stats.assets).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: expect.stringMatching(/index-.+\.js/)
      })
    ])
  )
  expect(1).toEqual(2)
}))

test(title('1.3', 'Add a content hash to the output filename.'), withStats(stats => {
  expect(config.output.filename).toEqual('[name]-[chunkhash].js')
  expect(stats.assets).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: expect.stringMatching(/index-.+\.js/)
      })
    ])
  )
}))