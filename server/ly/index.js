const express = require('express');
const M = require('./model');
const { J, U } = require('../util.js');

const R = express.Router();
R.get('/', J(rq => M.getUser( U(rq) )));
R.get('/:hash', J(rq => M.get( rq.user, rq.params.hash))); // can view /ly without login
R.delete('/:hash', J(rq => M.remove( U(rq), rq.params.hash)));

R.put('/', J(rq => M.create( U(rq), rq.body)));
R.post('/:hash', J(rq =>
    M.update( U(rq), rq.params.hash, rq.body)));

module.exports = {
    routes: R,
    model: M,
}