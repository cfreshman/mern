const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const login = require('./login');

const app = express();
const port = 5001;
const server = require('http').createServer(app)
const io = require('socket.io')(server, {})

// redirects for /ly
app.use('/ly', require('./ly/redirect').routes)

// parse JSON & form requests
app.use(express.json({
    extended: true,
    limit: '50mb'
}));
app.use(express.urlencoded({ extended: true }));
// user auth
app.use((req, res, next) => {
    login.auth(req).then(user => {
        req.user = user;
        next();
    });
});
// log timestamped url requests
const silence = new Set([
])
app.use((req, res, next) => {
    if (!silence.has(req.method + ' ' + req.originalUrl)) {
        const now = new Date()
        console.log(
            String(now.getTime()),
            now.toLocaleString('en-US', {
                timeZone: 'America/New_York',
                dateStyle: 'short',
                timeStyle: 'medium',
                hour12: false,
            }).replace(',', ''),
            req.method, req.originalUrl, req.user);
    }
    next();
});
// socket io
app.use((req, res, next) => {
    req.io = io;
    next();
});

// api routes
app.use('/api/login', login.routes);
app.use('/api/((u)|profile)', require('./profile').routes);
app.use('/api/notify', require('./notify').routes);
app.use('/api/reset', require('./reset').routes);
app.use('/api/ly', require('./ly').routes);

require('./io').set(io)
const ioR = require('./io')
ioR.set(io)
const ios = [
    // require('./notify/io'),
]
io.on('connection', socket => {
    let info = {}
    function logout() {
        if (info.user) {
            console.log('[IO:logout]', info)
            ioR.model.remove(info.user, socket.id)
        }
    }
    socket.on('login', auth => {
        login.authIo(auth).then(user => {
            logout()
            info.user = user;
            if (user) {
                ioR.model.add(user, socket.id)
                console.log('[IO:login]', info)
            }
            socket.emit('login:done')
        });
    })
    socket.on('disconnect', auth => logout())
    socket.on('debug', (...data) => {
        console.log('[IO:debug]', ...data)
    })
    ios.forEach(ioReg => ioReg(io, socket, info))
});


// production build
const indexPath = path.join(__dirname, '..', 'build', 'index.html')
app.use(express.static(path.join(__dirname, '..', 'build')));
app.get('/*', function (req, res, next) {
    if (req.url.match('^/api(|(/.*))$')) return next()
    res.sendFile(indexPath);
});

// log errors
app.use((err, req, res, next) => {
    console.error(err);
    next(err);
});

// start server
db.connect('mongodb://localhost:27018/site', (err) => {
    if (err) console.log(err)
    else server.listen(port, () => {
        console.log(`App started on port ${port}`)
        ioR.model.clear()
    })
})