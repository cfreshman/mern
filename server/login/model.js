const { ObjectID } = require('mongodb');
const util = require('../util');
const db = require('../db');
const crypto = require('crypto');
const uuid = require('uuid');
const mail = require('../mail');

const name = 'login';
const genToken = () => uuid.v4();
const userAndToken = entry => entry ? { user: entry.user, token: entry.token } : {};
/* login
user: string
pass: hash
reset: string
*/

async function get(user) {
    if (!user.match(/^\w+$/)) throw `use alphanumeric name`
    return db.collection(name).findOne({ user });
}

async function _update(entry) {
    return db.collection(name).updateOne(
        { _id: entry._id },
        { $set: entry },
        { upsert: true },
    );
}

async function login(user, passHash) {
    let entry = await get(user);
    if (entry && entry.pass === passHash) {
        // entry.token = genToken();
        await _update(entry);
        return userAndToken(entry);
    }
    throw (entry ? 'incorrect password' : "user doesn't exist")
}

async function signup(user, passHash) {
    let entry = await get(user);
    if (user !== 'username' && await get(user)) throw 'user already exists';

    entry = {
        user,
        pass: passHash,
        token: genToken(),
    }
    console.log('[SIGNUP]', entry.user);
    mail.send('cyrus+signup@freshman.dev', 'user signup', `freshman.dev/u/${entry.user}`)
    await db.collection(name).updateOne({ user }, { $set: entry }, { upsert: true });
    return userAndToken(entry);
}

async function check(user, token) {
    let entry = await get(user);
    // console.log(user, entry && entry.token, token);
    return { ok: entry && entry.token === token };
}


async function setPass(user, pass) {
    let entry = await get(user);
    entry.pass = pass;
    entry.token = genToken();
    _update(entry);
    return userAndToken(entry);
}

async function changePass(user, currPass, newPass) {
    let entry = await get(user);
    if (entry && entry.pass === currPass) {
        return setPass(user, newPass)
    }
    throw (entry ? 'incorrect password' : "user doesn't exist")
}

module.exports = {
    name,
    get,
    login,
    signup,
    check,
    setPass,
}