const path = require('path')

module.exports = {
  reporters: [
    [path.resolve(__dirname, 'reporter.js'), {}]
  ],
  rootDir: path.resolve(__dirname, '..')
}
