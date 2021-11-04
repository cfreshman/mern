import { useEffect } from 'react'
import { remove } from './util'
import api from './api'
import { useE, useF, useInterval, useTimeout } from './hooks'
import { auth } from './auth'
import { useHistory } from 'react-router-dom'
import { useUserSocket } from './io'

const Notification = ('Notification' in window) ? window.Notification : undefined

export function twitter(handle?) {
  return api.post(`notify/twitter`, { handle })
}

export function sub(page) {
  console.debug(Notification?.permission
    || 'notifications not supported')
  if (Notification && 'granted' !== Notification.permission) {
    Notification.requestPermission()
  }
  return api.put(`notify/sub/${page}`)
}
export function unsub(page) {
  return api.delete(`notify/sub/${page}`)
}
export function subbed(page) {
  return api.get(`notify/sub/${page}`)
}

const notifyFilters = []
export function useNotify(history) {
  useUserSocket('', {
    'notify:msg': (msg: { [key: string]: string[] }) => {
      console.debug('MSG', msg)
      Object.entries(msg).forEach(async entry => {
        if ('default' === Notification?.permission) {
          await Notification.requestPermission()
        }
        let [app, list] = entry
        list
        .filter(text => !notifyFilters.some(f => f(app, text)))
        .forEach(text => {
          let [body, link] = text.split(' – ')
          console.debug(body, link)
          let notif = new Notification(`/${app}`, {
            body,
            tag: link || app
          })
          notif.onclick = () => {
            history.push(link?.match('^freshman.dev') ? link.replace('freshman.dev', '') : `/${app}`)
          }
        })
      })
    }
  })
}
// export function useNotify(history) {
//   useInterval(() => {
//     auth.user && api.get('notify/msg').then(
//       ({msg}: {msg: { [key: string]: string[] }}) => {
//       // console.log(msg)
//       Object.entries(msg)
//         .forEach(async entry => {
//           if ('default' === Notification.permission) {
//             await Notification.requestPermission()
//           }
//           let [app, list] = entry
//           list
//           .filter(text => !notifyFilters.some(f => f(app, text)))
//           .forEach(text => {
//             let [body, link] = text.split(' – ')
//             console.log(body, link, history)
//             let notif = new Notification(`/${app}`, {
//               body,
//               tag: link
//             })
//             notif.onclick = () => {
//               history.push(link.replace('freshman.dev', ''))
//             }
//           })
//         })
//     })
//   }, 3000);
// }
export function useNotifyFilter(filter: (app: string, text: string) => boolean) {
  useE(() => {
    notifyFilters.push(filter)
    return () => {
      notifyFilters.splice(notifyFilters.indexOf(filter), 1)
    };
  })
}