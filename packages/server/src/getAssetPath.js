const path = require('path')

const assets = {
  'js': {
    'socket.io': require.resolve('socket.io-client/dist/socket.io.js'),
    'handlebars': require.resolve('handlebars/dist/handlebars.js'),
    'exercise': path.resolve(__dirname, 'exercise.web.js'),
    'bootstrap': require.resolve('bootstrap/dist/js/bootstrap.bundle.js'),
    'jquery': require.resolve('jquery/dist/jquery.slim.js'),
    'highlight': path.resolve(__dirname, 'highlight.js')
  },
  'css': {
    'bootstrap': require.resolve('bootstrap/dist/css/bootstrap.css'),
    'highlight': require.resolve('highlight.js/styles/tomorrow-night.css')
  }
}

module.exports = (type, id) => assets[type] && assets[type][id]
