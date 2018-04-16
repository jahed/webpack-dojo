const createServer = require('./createServer')
const logger = require('./logger')

const start = async ({ port }) => {
  const server = await createServer()
  server.once('listening', () => {
    logger.info(`opened server on http://localhost:${port}/`)
  })

  server.listen({ port })
}

logger.info('starting server...')
start({ port: 4567 })
  .catch(e => logger.error(e, 'failed to start server'))
