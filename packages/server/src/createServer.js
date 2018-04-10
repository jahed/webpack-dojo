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
      try {
        const exercise = exercises[exerciseId]
        console.log('EXERCISE_REQUEST: ' + exerciseId)

        if (!exercise) {
          throw new Error('EXERCISE_REQUEST: does not exist')
        }

        console.log('TODO start watchers here')

        const resultsFile = await readFile(exercises[exerciseId].resultsPath)
        const results = JSON.parse(resultsFile.toString())
        results.testResults.forEach(r1 => {
          r1.failureMessage = r1.failureMessage ? ansiToHTML.toHtml(r1.failureMessage) : undefined
          r1.testResults.forEach(r2 => {
            r2.failureMessages = r2.failureMessages ? r2.failureMessages.map(f => ansiToHTML.toHtml(f)) : undefined
          })
        })

        socket.emit('EXERCISE_RESPONSE', {
          results
        })
      } catch (e) {
        console.log(e)
      } finally {
        socket.on('disconnect', () => {
          console.log('TODO stop watchers here')
        })
      }
    })
  })

  return server
}

module.exports = createServer
