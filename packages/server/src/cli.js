const createServer = require('./createServer')

const start = async () => {
  const server = await createServer()
  server.once('listening', () => {
    const { port } = server.address()
    console.log(`opened server on http://localhost:${port}/`)
  })

  server.listen({
    port: 4567
  })
}

start()
  .then(e => console.error('failed to start server', e))
