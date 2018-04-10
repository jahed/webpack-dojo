const initExercise = ({ exerciseId, socketIO, $ }) => {
  const listenFor = ({ socket, type, handler }) => {
    socket.on(type, payload => {
      console.log('res', { type, payload })
      return handler(payload)
    })
  }

  const sendTo = ({ socket, action }) => {
    console.log('req', action)
    socket.emit(action.type, action.payload)
  }

  $('[data-toggle="popover"]').popover()
  const socket = socketIO()

  const status = {
    passed: 'passed',
    failed: 'failed'
  }

  const alertType = {
    passed: 'light',
    failed: 'warning'
  }

  const alertBadgeType = {
    passed: 'outline-success',
    failed: 'danger'
  }

  const resultTemplate = ({ title, result, isFirstFailure }) => {
    const statusButton = result.status === status.failed
      ? (`
        <button class="btn btn-sm btn-${alertBadgeType[result.status]} float-right" type="button" data-toggle="collapse" data-target="#${title.id}-collapse">
          Fail
        </button>
      `)
      : `<button class="btn btn-sm btn-${alertBadgeType[result.status]} float-right" disabled>Pass</button>`

    const more = result.status === status.failed
      ? (`
        <div class="collapse ${isFirstFailure ? 'show' : ''}" id="${title.id}-collapse">
          <hr />
          <pre class="bg-dark text-light p-4">${result.failureMessages.join('\\n')}</pre>
        </div>
      `)
      : ''

    return `
      <div class="alert alert-${alertType[result.status]}" role="alert">
      <div class="d-flex justify-content-between align-items-center">
        ${title.id}. ${title.description}
        ${statusButton}
      </div>
      ${more}
      </div>
    `
  }

  listenFor({
    socket,
    type: 'EXERCISE_RESULTS',
    handler: payload => {
      document.querySelectorAll('.test-case').forEach(e => {
        e.innerHTML = ''
      })

      const { results } = payload
      const { testResults: fileResults } = results

      fileResults.forEach(fileResult => {
        const { testResults, failureMessage } = fileResult

        document.getElementById('totalFailure').innerHTML = testResults.length < 1 && failureMessage
          ? `<pre class="bg-dark text-light p-4">${failureMessage}</pre>`
          : ''

        let firstFailureRendered = false

        testResults.forEach(result => {
          try {
            const isFirstFailure = !firstFailureRendered && result.status === status.failed
            const title = JSON.parse(result.title)
            document.getElementById(title.id).innerHTML = resultTemplate({
              title,
              result,
              isFirstFailure
            })
            firstFailureRendered = firstFailureRendered || isFirstFailure
          } catch (e) {
            console.error(e)
          }
        })
      })
    }
  })

  listenFor({
    socket,
    type: 'EXERCISE_STATS',
    handler: payload => {
      const statsElement = document.getElementById('stats')
      statsElement.innerHTML = ''

      const { stats } = payload
    }
  })

  sendTo({
    socket,
    action: {
      type: 'EXERCISE_REQUEST',
      payload: { exerciseId }
    }
  })
}
