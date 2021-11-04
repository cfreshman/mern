const db = require('../db');
const { entryMap } = require('../util');

const names = {
    io: 'io',
        // user: string
        // ids: string[]
}
const C = entryMap(names, name => () => db.collection(name));

async function get(user) {
    let io = await C.io().findOne({ user })
    return { io }
}
async function put(io) {
    await C.io().updateOne({ user: io.user }, { $set: io }, { upsert: true });
    return { io };
}

async function add(user, socketId) {
   let io = (await get(user)).io || {
      user,
      ids: []
   }
   if (user) {
      io.ids.push(socketId)
   } else io.ids = []
   return await put(io)
}
async function remove(user, socketId) {
   let { io } = await get(user)
   if (io) {
      io.ids = io.ids.filter(s => s !== socketId)
      if (io.ids.length === 0) {
         C.io().deleteOne({ user })
      } else {
         put(io)
      }
      delete io['_id']
   }
   return { io }
}
async function clear() {
   console.log('[IO:clear]')
   C.io().deleteMany({})
}

module.exports = {
    names,
    get,
    add,
    remove,
    clear,
}