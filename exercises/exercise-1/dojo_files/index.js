const path = require('path')

module.exports = {
  id: 'exercise-1',
  title: '1. Getting Started',
  documentPath: path.resolve(__dirname, 'exercise.html'),
  statsPath: path.resolve(__dirname, 'test_output', 'stats.json'),
  resultsPath: path.resolve(__dirname, 'test_output', 'results.json')
}
