const callGuard = errorThrower => {
  return fn => {
    let state = {
      count: 0
    }

    return (...args) => {
      state = {
        count: state.count + 1
      }

      errorThrower(state)

      return fn(...args)
    }
  }
}

module.exports = callGuard
