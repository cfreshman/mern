const express = require('express');
const model = require('./model');
const { J } = require('../util.js');

const routes = express.Router();
routes.post('/', J(req => {
    let { user, pass } = req.body;
    // console.log(user, pass);
    return model.login(user, pass);
}));
routes.post('/signup', J(req => {
    let { user, pass } = req.body;
    // console.log(user, pass);
    return model.signup(user, pass);
}));
routes.post('/verify', J(req => {
    let { user, token } = req.body;
    return model.check(user, token);
}));

async function auth(req) {
    let user = req.header('X-Freshman-Auth-User');
    let token = req.header('X-Freshman-Auth-Token');
    if (user && token) {
        let result = await model.check(user, token);
        if (result.ok) return user;
    }
    return false;
}
async function authIo(data) {
    let { user, token } = data
    if (user && token) {
        let result = await model.check(user, token);
        if (result.ok) return user;
    }
    return false;
}

module.exports = {
    routes,
    model,
    auth,
    authIo,
}