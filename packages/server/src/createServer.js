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
const { exec } = require('child_process')
const readFile = util.promisify(fs.readFile)

const createServer = async () => {
  const layoutFile = await readFile(path.resolve(__dirname, 'layout.html.hbs'))
  const layout = handlebars.compile(layoutFile.toString())

  const app = express()
  const server = http.Server(app)
  const io = socketIO(server)

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
    console.log('a user connected')
    socket.on('EXERCISE_REQUEST', async ({ exerciseId }) => {
      const exercise = exercises[exerciseId]
      console.log('EXERCISE_REQUEST: ' + exerciseId)

      if (!exercise) {
        throw new Error('EXERCISE_REQUEST: does not exist')
      }

      console.log('Exercise', exercise)

      const sendResults = async (resultsPath) => {
        const resultsFile = await readFile(resultsPath)
        const results = JSON.parse(resultsFile.toString())
        results.testResults.forEach(r1 => {
          r1.failureMessage = r1.failureMessage ? ansiToHTML.toHtml(r1.failureMessage) : undefined
          r1.testResults.forEach(r2 => {
            r2.failureMessages = r2.failureMessages ? r2.failureMessages.map(f => ansiToHTML.toHtml(f)) : undefined
          })
        })

        socket.emit('EXERCISE_RESULTS', {
          results
        })
      }

      const sendStats = async (statsPath) => {
        const statsFile = await readFile(statsPath)
        const stats = JSON.parse(statsFile.toString())
        socket.emit('EXERCISE_STATS', {
          stats
        })
      }

      const runTestWatcher = () => {
        const testProcess = exec(exercise.testCommand)

        testProcess.stdout.on('data', (data) => {
          console.log(data)
        })

        testProcess.stderr.on('data', (data) => {
          console.log(data)
        })

        testProcess.on('error', (error) => {
          console.log(error)
        })

        testProcess.on('close', (code) => {
          console.log(`testWatcher exited with code ${code}`)
        })

        return testProcess
      }

      try {
        await Promise.all([
          sendResults(exercise.resultsPath),
          sendStats(exercise.statsPath)
        ])
      } catch (e) {
        console.warn('ignoring initial parse error', e)
      }

      console.log('watching', exercise.resultsPath)
      const resultsWatcher = fs.watch(exercise.resultsPath, async type => {
        if (type === 'change') {
          try {
            await sendResults(exercise.resultsPath)
          } catch (e) {
            console.warn('ignoring parse error', e)
          }
        }
      })

      console.log('watching', exercise.statsPath)
      const statsWatcher = fs.watch(exercise.statsPath, async type => {
        if (type === 'change') {
          try {
            await sendStats(exercise.statsPath)
          } catch (e) {
            console.warn('ignoring parse error', e)
          }
        }
      })

      const testWatcher = runTestWatcher()

      socket.on('disconnect', () => {
        console.log('closing', exercise.resultsPath)
        testWatcher.kill('SIGINT')
        resultsWatcher.close()
        statsWatcher.close()
      })
    })
  })

  return server
}

module.exports = createServer
