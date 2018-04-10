const initExercise = ({ exerciseId, socketIO }) => {
  const listenFor = ({ socket, type, handler }) => socket.on(type, payload => {
    console.log('res', {
      type: 'EXERCISE_RESPONSE',
      payload
    })
    return handler(payload)
  })

  const sendTo = ({ socket, action }) => {
    console.log('req', action)
    socket.emit(action.type, action.payload)
  }

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

  const resultTemplate = ({ title, result }) => {
    const statusButton = result.status === status.failed
      ? (`
        <button class="btn btn-sm btn-${alertBadgeType[result.status]} float-right" type="button" data-toggle="collapse" data-target="#${title.id}-collapse">
          Fail
        </button>
      `)
      : `<button class="btn btn-sm btn-${alertBadgeType[result.status]} float-right" disabled>Pass</button>`

    const more = result.status === status.failed
      ? (`
        <div class="collapse show" id="${title.id}-collapse">
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
    type: 'EXERCISE_RESPONSE',
    handler: payload => {
      const { results } = payload
      const { testResults: fileResults } = results
      const { testResults } = fileResults[0]

      testResults.forEach(result => {
        try {
          const title = JSON.parse(result.title)
          document.getElementById(title.id).innerHTML = resultTemplate({ title, result })
        } catch (e) {
          console.error(e)
        }
      })
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
