import React, { useRef } from 'react';
import { useHistory } from 'react-router-dom';
import api from './api';
import { getStored, setStored } from './store';
import { InfoStyles, InfoBody, InfoSearch } from '../components/base/Info'

export async function sha256(message: string) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

const authTriggers = [
    auth => auth.user && verify(auth.user, auth.token).then(res => {
        if (!res.ok) {
            logout();
        }
    })
];
export function addAuthTrigger(callback) {
    authTriggers.push(callback);
}
export function removeAuthTrigger(callback) {
    let index = authTriggers.indexOf(callback);
    if (index > -1) authTriggers.splice(index, 1);
}

const AUTH_COOKIE = 'loginAuth'
function setAuth(user, token, dropdown?) {
    Object.assign(auth, { user, token, dropdown });
    // console.log('auth', auth)
    setStored(AUTH_COOKIE, auth);
    authTriggers.forEach(callback => callback(auth));
}
export const auth = getStored(AUTH_COOKIE) || { user: undefined, token: undefined, dropdown: false };
setTimeout(() => setAuth(auth.user, auth.token), 500); // verify auth after api has loaded
setInterval(() => {
    let { user, token } = getStored(AUTH_COOKIE)
    if (user != auth.user) {
        setAuth(user, token)
    }
}, 500)

export function logout() {
    setAuth('', '');
}

export function openLogin() {
    setAuth(auth.user, auth.token, true);
}
window['openLogin'] = openLogin;

export function handleAuth(data) {
    // console.log(data);
    if (data.token) {
        setTimeout(() => setAuth(data.user, data.token));
    }
    return auth
}

function signin(path, user, pass) {
    return new Promise((resolve, reject) => {
        sha256(pass)
            .then(hash => api.post(path, {
                user,
                pass: hash,
            }))
            .then(data => resolve(handleAuth(data)))
            .catch(err => {
                console.debug('err', err);
                reject(err);
            });
    });
}

export function login(user, pass) {
    return signin('/login', user, pass);
}

export function signup(user, pass) {
    return signin('/login/signup', user, pass);
}

export function verify(user, token) {
    return api.post('/login/verify', {
        user,
        token,
    });
}

export const RequireMe = (content, alt?) => {
    let searchRef = useRef()
    let history = useHistory()

    return (
    auth.user === 'cyrus'
    ? content
    : alt || <InfoStyles>
        <InfoSearch {...{searchRef, placeholder: 'find a page', search: () => {
            let current = searchRef.current;
            if (current) {
                let search = (current as HTMLInputElement).value
                search && history.push(`/search#${search}`)
            }
        }}}/>
        <InfoBody className='personal'>
            you aren't an admin, sorry :/
        </InfoBody>
    </InfoStyles>)
}