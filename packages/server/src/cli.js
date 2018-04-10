const createServer = require('./createServer')

const start = async () => {
  const app = await createServer()
  app.listen(4567)
}

start()
