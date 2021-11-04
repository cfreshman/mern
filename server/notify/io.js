const M = require('./model');
const { J, U } = require('../util.js');

module.exports = (io, socket, info) => {
  let notifInterval;
  const startNotifs = () => {
    if (!notifInterval) {
      notifInterval = setInterval(sendNotifs, 3000)
      console.log('[IO:NOTIFY:SUB]', info.user)
    }
  }
  const cancelNotifs = () => {
    if (notifInterval) {
      clearTimeout(notifInterval)
      notifInterval = undefined
      console.log('[IO:NOTIFY:UNSUB]', info.user)
    }
  }

  const sendNotifs = () => {
    if (info.user) {
      M.read(info.user).then(data => {
        let { msg } = data
        if (Object.keys(msg).length > 0) {
          console.log('[IO:NOTIFY:MSG]', msg)
          socket.emit("notify:msg", msg)
        }
      })
    }
  }

  socket.on('init', startNotifs)
  socket.on('connection', startNotifs)
  socket.on('disconnect', cancelNotifs)
}