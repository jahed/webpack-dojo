const initExercise = ({ exerciseId, socketIO, $, hljs }) => {
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

  $(document).ready(() => {
    $('pre code').each((i, block) => {
      block.innerHTML = block.innerHTML.trim()
      hljs.highlightBlock(block)
    })
  })

  $('[data-toggle="popover"]').popover()
  const socket = socketIO()

  const status = {
    passed: 'passed',
    failed: 'failed',
    loading: 'loading'
  }

  const alertType = {
    passed: 'success',
    failed: 'warning',
    loading: 'secondary'
  }

  const alertBadgeType = {
    passed: 'success',
    failed: 'danger',
    loading: 'secondary'
  }

  const alertBadgeText = {
    passed: 'Pass',
    failed: 'Fail ',
    loading: 'Unknown'
  }

  const resultTemplate = ({ title, result }) => {
    const statusButton = result.status === status.failed
      ? (`
        <button class="btn btn-sm btn-${alertBadgeType[result.status]} float-right" type="button" data-toggle="collapse" data-target="#${title.id}-collapse">
          ${alertBadgeText[result.status]} <small>▼</small>
        </button>
      `)
      : (`
        <button class="btn btn-sm btn-${alertBadgeType[result.status]} float-right" disabled>
          ${alertBadgeText[result.status]}
        </button>
      `)

    const more = result.status === status.failed
      ? (`
        <div class="collapse" id="${title.id}-collapse">
          <hr />
          <pre class="bg-dark text-light p-4">${result.failureMessages.join('\\n')}</pre>
        </div>
      `)
      : ''

    return `
      <div class="alert alert-${alertType[result.status]}" role="alert">
      <div class="d-flex justify-content-between align-items-center">
        ${title.id ? `${title.id}. ` : ''}${title.description}
        ${statusButton}
      </div>
      ${more}
      </div>
    `
  }

  const progressTemplate = ({ total, passed }) => {
    const progressPerc = Math.floor((passed / (total || 1)) * 100)
    const progressText = `Completed ${passed} of ${total} Tasks${progressPerc === 100 ? '. Exercise Complete!' : ''}`
    const progressStatus = progressPerc === 100 ? status.passed : status.failed

    return `
      <div class="alert alert-${alertType[progressStatus]}">
        ${progressText}
        <div class="progress mt-3 mb-2">
          <div class="progress-bar bg-${alertBadgeType[progressStatus]}" role="progressbar" style="width: ${progressPerc}%;" aria-valuenow="${progressPerc}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
    `
  }

  listenFor({
    socket,
    type: 'EXERCISE_RESULTS',
    handler: payload => {
      const { results } = payload
      const { testResults: fileResults, numPassedTests, numTotalTests } = results
      const testCaseElements = document.querySelectorAll('.test-case')

      document.getElementById('testProgress').innerHTML = progressTemplate({
        total: numTotalTests || testCaseElements.length,
        passed: numPassedTests || 0
      })

      fileResults.forEach(fileResult => {
        const { testResults, failureMessage } = fileResult

        if (testResults.length < 1 && failureMessage) {
          testCaseElements.forEach(e => {
            e.innerHTML = resultTemplate({
              title: {
                id: e.id,
                description: 'Failed to parse code. Check the follow piece of code before continuing:'
              },
              result: {
                failureMessages: [
                  failureMessage
                ],
                status: 'failed'
              }
            })
          })
        } else {
          testCaseElements.forEach(e => {
            e.innerHTML = resultTemplate({
              title: {
                id: e.id,
                description: 'Exercise'
              },
              result: {
                status: 'loading'
              }
            })
          })

          testResults.forEach(result => {
            try {
              const title = JSON.parse(result.title)
              document.getElementById(title.id).innerHTML = resultTemplate({
                title,
                result
              })
            } catch (e) {
              console.error(e)
            }
          })
        }
      })
    }
  })

  listenFor({
    socket,
    type: 'EXERCISE_STATS',
    handler: payload => {
      const statsElement = document.getElementById('stats')
      statsElement.innerHTML = '<span class="text-muted">No output.</span>'

      const { stats } = payload
      statsElement.innerHTML = `<pre>${JSON.stringify(stats, null, 2)}</pre>`
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
