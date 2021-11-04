import { auth } from './auth';

type obj = {[key:string]:any}

const api: obj = {};
[
    { service: 'get', verb: 'GET', options: false },
    { service: 'post', verb: 'POST', options: true },
    { service: 'put', verb: 'PUT', options: true },
    { service: 'patch', verb: 'PATCH', options: true },
    { service: 'delete', verb: 'DELETE', options: false },

    // CRUD naming
    { service: 'create', verb: 'POST', options: true },
    { service: 'read', verb: 'GET', options: false },
    { service: 'update', verb: 'PUT', options: true },
    // delete
].forEach(({ service, verb, options }) => {
    api[service] = (path: string, body={}, extra: obj={}) => {
        let req: obj = {
            method: verb,
            headers: {
                'X-Freshman-Auth-User': auth.user,
                'X-Freshman-Auth-Token': auth.token,
            }
        }
        console.debug(path, auth.user)
        if (options) {
            req.headers['Content-Type'] = 'application/json';
            req.body = JSON.stringify(body);
        } else extra = body

        if (extra.ms) {
            const controller = new AbortController()
            setTimeout(() => controller.abort(), extra.ms)
            req.signal = controller.signal
        }

        return new Promise((resolve, reject) => {
            fetch('/api' + path.replace(/^\/api/, '').replace(/^\/*/, '/'), req)
                .then(async res => {
                    if (!res.headers.get('Content-Type')?.includes('application/json')) {
                        throw await res.text()
                    }
                    return res.json().then(data => {
                        if (data.error) {
                            console.debug('api error', data.error);
                            reject(data);
                        } else if (res.ok) {
                            if (data.error) {
                                console.debug('api error', data.error);
                                reject(data);
                            } else {
                                resolve(data);
                            }
                        } else {
                            let msg = `server error, failed ${service} ${path}: ${data.message}`
                            console.debug(msg); reject(msg);
                        }
                    })
                })
                .catch(err => {
                    let msg = 'connection error: ' + err.message;
                    console.debug(msg); reject(msg);
                });
        });
    }
})

export default api;