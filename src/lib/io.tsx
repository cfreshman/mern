import React, { useState } from "react"
import styled from 'styled-components';
import { io } from "socket.io-client"
import api from "../lib/api"
import { useE, useF, useAuth } from "../lib/hooks"

const ENDPOINT = window.origin.replace(':3000', ':5000')

let socket
let socketTriggers = []
export function addSocketTrigger(callback) {
  socketTriggers.push(callback);
}
export function removeSocketTrigger(callback) {
  let index = socketTriggers.indexOf(callback);
  if (index > -1) socketTriggers.splice(index, 1);
}
export function getSocket() {
  return socket;
}
export function setSocket(value) {
  socket = value
  socketTriggers.forEach(trigger => trigger(value))
}

const joinedRooms = []
export const useIo = () => {
  const auth = useAuth()

  const handle = {
    login: (local?) => {
      local = local || socket
      if (local) {
        local.emit('login', auth)
      }
    },
  }
  useE(() => {
    let local = io(ENDPOINT, {
      transports: ['websocket']
    })
    local.on('connect', () => {
      handle.login(local)
    })
    local.on('login:done', () => {
      local.emit('init')
      joinedRooms.forEach(room => local.emit(`${room}:join`))
      setSocket(local)
    })
    return () => {
      local.disconnect();
    }
  })
  useF(auth.user, handle.login)
}

export const useUserSocket = (
  roomToJoin='',
  ons?: { [key: string]: (...args)=>any },
  emits?: (socket)=>any) => {

  const [local, setLocal] = useState(socket);

  useE(() => {
    let callback = socket => setLocal(socket)
    addSocketTrigger(callback);
    return () => removeSocketTrigger(callback);
  });

  useE(local, () => {
    if (local) {
      ons && Object.keys(ons).forEach(evt => local.on(evt, ons[evt]))
      emits && emits(local)
      if (ons) return () => {
        Object.keys(ons).forEach(evt => local.off(evt, ons[evt]))
      }
    }
  })

  const [joined, setJoined] = useState(false)
  useE(local, () => {
    if (roomToJoin && local) {
      local.emit(`${roomToJoin}:join`)
      setJoined(true)
      joinedRooms.push(roomToJoin)
      return () => {
        local.emit(`${roomToJoin}:leave`)
        setJoined(false)
        joinedRooms.splice(joinedRooms.indexOf(roomToJoin), 1)
      }
    }
  })

  const auth = useAuth();
  useF(auth.user, () => {
    if (roomToJoin && joined) {
      local.emit(`${roomToJoin}:leave`)
      setTimeout(() => {
        local.emit(`${roomToJoin}:join`)
      })
    }
  })

  return local
}
