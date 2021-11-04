const M = require('./model')


let _io
function set(io) {
   _io = io
}
function inst() {
   return _io
}

async function send(users, event, ...eventArgs) {
   let isSingle = typeof users === 'string'
   let results = await Promise.all((isSingle ? [users] : users).map(async user => {
      let { io } = user ? await M.get(user) : {}

      if (!io || !io.ids.length) return false

      delete io._id
      if (!['chat:typing'].includes(event)) console.log('[IO:send]', event, io)
      io.ids.forEach(socketId => {
         inst().to(socketId).emit(event, ...eventArgs)
      })
      return true
   }))
   return (isSingle) ? results[0] : results
}

module.exports = {
   set,
   inst,
   send,
   model: M,
}