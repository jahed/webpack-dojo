const chokidar = require('chokidar')

const watchFile = ({ path, onChange }) => {
  const handler = (filename, stats) => {
    if (stats.isFile()) {
      onChange({ filename, stats })
    }
  }

  const watcher = chokidar.watch(path)
  watcher.on('add', handler)
  watcher.on('change', handler)
  return watcher
}

module.exports = watchFile
