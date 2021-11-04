const express = require('express');
const M = require('./model');
const { J, U } = require('../util.js');

const R = express.Router();
R.post('/user', J(rq => M.user( U(rq), rq.body.pass )));
R.post('/request', J(rq => M.request( rq.body.user )));
R.post('/token', J(rq => M.token( rq.body.user, rq.body.token, rq.body.pass )));

module.exports = {
    routes: R,
    model: M,
}