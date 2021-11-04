const db = require('../db');
const { entryMap, remove } = require('../util');
const login = require('../login').model;
const mail = require('../mail');
const { randAlphanum } = require('../rand');
const ioM = require('../io')

const names = {
    notify: 'notify',
        // email: string
        // verify: string
        // verified: string[]
        // emailThread: string
        // apps: string[] (deprecated, use !unsub so true by default)
        // unsub: string[]
        // msg: { [app]: string[] }
}
const C = entryMap(names, name => () => db.collection(name));

const alwaysAllowed = 'verify u profile reset'.split(' ')

async function _chain(notify, app, text) {
    if (notify.emailThread) {
        console.log('[CHAIN]', notify.user, app, text)
        mail.chain(notify.emailThread, text)
    } else {
        console.log('[EMAIL]', notify.user, app, text)
        mail.send(notify.email, 'notification', text)
            .then(res => {
                console.log('[THREAD]', notify.user, res.data.id)
                update(notify.user, { emailThread: res.data.id })
            })
            .catch(console.log)
    }
}

async function get(user) {
    let notify = await C.notify().findOne({ user });
    if (!notify) {
        if (await login.get(user)) {
            notify = { user, email: '', apps: [], msg: [], };
            C.notify().insertOne(notify);
        }
    }
    return { notify }
}
async function update(user, props) {
    if (props.user && user !== props.user) throw `${props.user} can't update ${user}`
    let { notify } = await get(user);
    Object.assign(notify, props);
    C.notify().updateOne({ user }, { $set: props });
    return { notify };
}

async function email(user, email=false, source='freshman.dev') {
    let { notify } = await get(user)
    let verified = notify.verified || (notify.verify ? [] : [notify.email])
    let verify = (email && !verified.includes(email)) ? randAlphanum(7) : false
    // let verify = undefined
    let emailThread = email === notify.email ? notify.emailThread : undefined
    notify = (await update(user, { email, verified, verify, emailThread })).notify
    verify && _chain(notify, 'notify', `click to verify email – `
    + `<a href="https://${source}/notify#${verify}">${source}/notify#${verify}</a>`)
    // verify && _chain(notify, 'notify', `click to verify email – `
    //     + `${source}/notify#${verify}`)
    return { notify }
}
async function verify(token) {
    let notify = await C.notify().findOne({ verify: token });
    if (notify) {
        notify = (await update(notify.user, {
            verify: undefined,
            verified: [notify.email].concat(notify.verified)
        })).notify
    }
    return { notify }
}

async function sub(user, app, _set) {
    let { notify } = await get(user)
    let set
    if (_set !== undefined) {
        set = _set
        let unsub = _set
            ? remove(notify.unsub || [], app)
            : [app].concat(notify.unsub || [])
        notify = update(user, { unsub })
    } else {
        set = !!(notify.email && !(notify.unsub || []).includes(app))
    }
    return { user, set }
}

async function read(user, _app) {
    let { notify } = await get(user)
    let { msg } = notify
    let clearedMsg = {}
    if (_app !== undefined) {
        clearedMsg = Object.assign({}, msg)
        msg = { [_app]: msg[_app] }
        delete clearedMsg[_app]
    }
    update(user, { msg: clearedMsg })
    return { msg }
}

async function send(users, app, text, link='') {
    text = `${text} – ${link || `freshman.dev/${app}`}`
    let isSingle = typeof users === 'string'
    let results = await Promise.all((isSingle ? [users] : users || []).map(async user => {
        let { notify, notify: { msg, domain } } = await get(user)

        const userText = text
            .replaceAll('freshman.dev', domain || 'freshman.dev')
            .replaceAll('wordbase.app/wordbase', 'wordbase.app')
        msg[app] = (msg[app] || []).concat(userText)

        let ioSuccess = await ioM.send([user], "notify:msg", msg)
        if (!ioSuccess[0]) {
            update(user, { msg })

            console.log('[NOTIFY:send]', user, app, userText)
            // will notify if not read & cleared within 10s
            let unsub = notify.unsub || []
            if (notify.email && !unsub.includes(app)) {
            // if (notify.email && !notify.verify && !unsub.includes(app)) {
                setTimeout(async () => {
                    let { notify, notify: { msg } } = await get(user)

                    let appMsg = msg[app] || []
                    if (appMsg.includes(userText)) {
                        msg[app] = remove(appMsg, userText)
                        update(user, { msg })
                        _chain(notify, app, userText)
                    }
                }, 10000)
            }
        }
        return { msg }
    }))

    return isSingle ? results[0] : results;
}
async function soft(users, app, text, link='') {
    text = `${text} – ${link || `freshman.dev/${app}`}`
    let msg = {
        [app]: [text]
    }
    let results = await ioM.send(isSingle ? [users] : users, "notify:msg", msg)

    return isSingle ? results[0] : results;
}

async function domain(user, domain) {
    let notify = await C.notify().findOne({ user });
    if (notify) {
        notify = (await update(notify.user, {
            domain
        })).notify
    }
    return { notify }
}


module.exports = {
    names,
    get,
    email,
    verify,

    sub,
    read,
    send,
    soft,

    domain,
}