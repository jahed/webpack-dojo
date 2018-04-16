const assert = require('assert')

module.exports = Array.prototype.reduce.call(
  [
    require('@webpack-dojo/exercise-1')
  ],
  (acc, next) => {
    assert(!acc[next.id], `Exercise(${next.id}) already exists.`)
    acc[next.id] = next
    return acc
  },
  {}
)
