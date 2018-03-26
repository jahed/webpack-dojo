const promisify = (context, functionName) => (...args) => {
  return new Promise((resolve, reject) => {
    args.push((err, result) => {
      if (err) {
        reject(err)
        return
      }

      resolve(result)
    })

    context[functionName](...args)
  })
}

module.exports = promisify
