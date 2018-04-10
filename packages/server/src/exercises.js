module.exports = Array.prototype.reduce.call(
  [
    require('@webpack-dojo/exercise-1')
  ],
  (acc, next) => {
    acc[next.id] = next
    return acc
  },
  {}
)
