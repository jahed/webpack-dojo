const express = require('express')
const handlebars = require('handlebars')
const fs = require('fs')
const path = require('path')
const util = require('util')
const http = require('http')
const socketIO = require('socket.io')
const getAssetPath = require('./getAssetPath')
const exercises = require('./exercises')
const AnsiToHTML = require('ansi-to-html')
const ansiToHTML = new AnsiToHTML()
const logger = require('./logger')
const watchFile = require('./watchFile')
const { exec } = require('child_process')
const readFile = util.promisify(fs.readFile)

const createServer = async () => {
  const layoutFile = await readFile(path.resolve(__dirname, 'layout.html.hbs'))
  const layout = handlebars.compile(layoutFile.toString())

  const app = express()
  const server = http.Server(app)
  const io = socketIO(server)

  app.use((req, res, next) => {
    logger.debug(req, 'request received')
    next()
  })

  app.get('/assets/:type/:scriptId', (req, res) => {
    const assetPath = getAssetPath(req.params.type, req.params.scriptId)

    if (!assetPath) {
      res.status(404).send(layout({ content: 'Not found.' }))
      return
    }

    res.sendFile(assetPath)
  })

  app.get('/', async (req, res) => {
    const contentFile = await readFile(path.resolve(__dirname, '_home.html.hbs'))
    const content = handlebars.compile(contentFile.toString())

    res.send(layout({
      title: 'Webpack Dojo',
      content: content({
        exercises: Object.keys(exercises).map(id => exercises[id])
      })
    }))
  })

  app.get('/exercises/:exerciseId', async (req, res) => {
    const exercise = exercises[req.params.exerciseId]
    if (!exercise) {
      res.status(404).send(layout({ content: 'Not found.' }))
      return
    }

    const contentFile = await readFile(exercise.documentPath)
    const content = handlebars.compile(contentFile.toString())

    const exerciseFile = await readFile(path.resolve(__dirname, '_exercise.html.hbs'))
    const exerciseTemplate = handlebars.compile(exerciseFile.toString())

    res.send(layout({
      title: [exercise.title, 'Webpack Dojo'].join(' - '),
      content: exerciseTemplate({
        exercise: exercise,
        content: content()
      })
    }))
  })

  io.on('connection', socket => {
    const socketLogger = logger.child({ socketId: socket.id })
    socketLogger.debug('a user connected')

    socket.on('EXERCISE_REQUEST', payload => {
      const exerciseRequest = async ({ exerciseId }) => {
        const exerciseLogger = socketLogger.child({ exerciseId })
        const exercise = exercises[exerciseId]

        if (!exercise) {
          throw new Error('exercise does not exist')
        }

        exerciseLogger.info({ exercise }, 'exercise found')

        const sendResults = async resultsPath => {
          const resultsFile = await readFile(resultsPath)
          const results = JSON.parse(resultsFile.toString())
          results.testResults.forEach(r1 => {
            r1.failureMessage = r1.failureMessage ? ansiToHTML.toHtml(r1.failureMessage) : undefined
            r1.testResults.forEach(r2 => {
              r2.failureMessages = r2.failureMessages ? r2.failureMessages.map(f => ansiToHTML.toHtml(f)) : undefined
            })
          })

          socket.emit('EXERCISE_RESULTS', { results })
        }

        const sendStats = async (statsPath) => {
          const statsFile = await readFile(statsPath)
          const stats = JSON.parse(statsFile.toString())
          socket.emit('EXERCISE_STATS', { stats })
        }

        const runTestWatcher = () => {
          const testProcess = exec(exercise.testCommand)

          testProcess.on('error', (error) => {
            exerciseLogger.error(error, 'test watcher emitted an error')
          })

          testProcess.on('close', (code) => {
            exerciseLogger.info({ code }, 'testWatcher exited')
          })

          return testProcess
        }

        try {
          await Promise.all([
            sendResults(exercise.resultsPath),
            sendStats(exercise.statsPath)
          ])
        } catch (e) {
          exerciseLogger.debug(e, 'ignoring initial parse error')
        }

        exerciseLogger.info('watching results')
        const resultsWatcher = await watchFile({
          path: exercise.resultsPath,
          onChange: async ({ filename, stats }) => {
            try {
              if (stats.size === 0) {
                // Jest empties file before writing.
                return
              }

              await sendResults(filename)
            } catch (e) {
              exerciseLogger.error(e, { filename, stats }, 'failed to send results')
            }
          }
        })

        exerciseLogger.info('watching stats')
        const statsWatcher = await watchFile({
          path: exercise.statsPath,
          onChange: async ({ filename, stats: fileStats }) => {
            try {
              await sendStats(filename)
            } catch (e) {
              exerciseLogger.error(e, 'failed to send stats')
            }
          }
        })

        const testWatcher = runTestWatcher()

        socket.on('disconnect', () => {
          exerciseLogger.info('closing exercise')
          testWatcher.kill('SIGINT')
          resultsWatcher.close()
          statsWatcher.close()
        })
      }

      const exerciseLogger = socketLogger.child({ exerciseId: payload.exerciseId })
      const action = { type: 'EXERCISE_REQUEST', payload }
      exerciseLogger.info(action, 'message received')

      exerciseRequest(payload)
        .catch(e => exerciseLogger.error(e, 'message response failed'))
    })
  })

  return server
}

module.exports = createServer
