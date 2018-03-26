const promiseChain = (...fns) => (...values) => {
  return fns.reduce(
    (acc, next) => acc.then(next),
    Promise.resolve(...values)
  )
}

module.exports = promiseChain
