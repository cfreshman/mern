export function fetchCookie(name) {
    let namedCookie = document.cookie
        .split(';').reverse()
        .find(cookie => cookie.startsWith(name));
    let cookieJson = namedCookie?.split('=')[1]
    return cookieJson ? JSON.parse(cookieJson) : undefined;
}
export function saveCookie(name, value) {
    // save cookie for ten years
    document.cookie = `${name}=${JSON.stringify(value)};expires=${60*60*24*365*10}`;
    fetchCookie(name);
}

export function fetchCookies(names) {
    return {...names.map(name => ({ [name]: fetchCookie(name) }))}
}
export function saveCookies(object) {
    Object.entries(object).map(entry => saveCookie(...entry));
}

export function getStored(key) {
    let str = window.localStorage.getItem(key);
    return str ? JSON.parse(str) : fetchCookie(key)
}
export function setStored(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value))
    return getStored(key)
}
export function clearStored(key) {
    window.localStorage.removeItem(key)
    document.cookie = `${key}=;expires=0`;
}

export function getSession(key) {
    let str = window.sessionStorage.getItem(key);
    return str ? JSON.parse(str) : undefined
}
export function setSession(key, value) {
    window.sessionStorage.setItem(key, JSON.stringify(value))
    return getSession(key)
}
export function clearSession(key) {
    window.sessionStorage.removeItem(key)
}