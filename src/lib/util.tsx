if (!window.location.origin.includes('localhost')) {
  console['_debug'] = console.debug
  console.debug = () => {}
}

export function remove(arr, item) {
  return arr.filter(x => x !== item);
}

const alphanum = 'qwertyuiopasdfghjklzxcvbnm1234567890QWERTYUIOPASDFGHJKLZXCVBNM';
export function randAlphanum(n: number, avoid?: string[]) {
  let str;
  do {
    str = ''
    for (let i = 0; i < n; i++) {
      str += alphanum[randi(alphanum.length)];
    }
  } while (avoid?.includes(str))
  return str;
}
window['randAlphanum'] = randAlphanum

export function sample(from: string | any[]) {
  return from[randi(from.length)]
}

export function toYearMonthDay(date: Date) {
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60 * 1000)).toISOString().slice(0, 10)
}

const iconTriggers = []
export function addIconTrigger(callback) {
  iconTriggers.push(callback);
}
export function removeIconTrigger(callback) {
  let index = iconTriggers.indexOf(callback);
  if (index > -1) iconTriggers.splice(index, 1);
}
export function setIcon(href='/icon.png', app?: string) {
  document.querySelector('head [rel=icon]')['href'] = href
  document.querySelector('head [rel=apple-touch-icon-precomposed]')['href'] = app ?? href
  iconTriggers.forEach(callback => callback(href))
}
export function setManifest(info='') {
  const manifest = document.querySelector('head [rel=manifest]') as HTMLLinkElement
  if (info) {
    const stringManifest = JSON.stringify(info);
    const blob = new Blob([stringManifest], {type: 'application/json'});
    manifest.href = URL.createObjectURL(blob)
  } else {
    manifest.href = ''
  }
}

/**
 * initArr: Initialize array of length n with index-based function for each i
 */
export const initArr = (n: number, func: (i:number)=>any) => Array.from({length: n}, (_, i) => func(i));

/**
 * randi: Random integer between [0, n)
 */
export const randi = (n: number) => Math.floor(Math.random() * n);

/**
 * randf: Random float between [0, n)
 */
export const randf = (n=1) => Math.random() * n;

/**
 * dist: euclidean distance
 */
 export const dist = (x1: number, y1: number, x2: number, y2: number) =>
 Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
