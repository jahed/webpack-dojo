const pino = require('pino')({
  level: 'info',
  prettyPrint: true,
  stream: process.stdout
})

module.exports = pino
