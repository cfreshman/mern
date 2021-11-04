const express = require('express');
const M = require('./model');
const { J, U, P } = require('../util.js');

const R = express.Router();
R.get('/', J(rq => M.get( U(rq) )));
R.post('/bio', J(rq => M.bio( U(rq), rq.body.bio)));
R.post('/checkin/:path', J(rq => M.checkin( U(rq), '/' + rq.params.path)));
R.get('/:id', J(rq => M.get(U(rq), rq.params.id)));
R.post('/:id/follow', J(rq => M.follow( U(rq), rq.params.id)));
R.post('/:id/unfollow', J(rq => M.unfollow( U(rq), rq.params.id)));

async function requireProfile(rq) {
    return (await M.get( U(rq))).profile
}

async function requireFriend(rq, param='user') {
    const other = P(rq, param)
    if (!other) throw `no friend specified`
    const profile = await requireProfile(rq)
    if (!profile) throw `user not logged in`
    if (![other, 'cyrus'].includes(profile.user) && !profile.friends.includes(other)) throw `${profile.user} not friends with ${other}`
    return profile.user
}

module.exports = {
    routes: R,
    model: M,
    requireProfile,
    requireFriend, F: requireFriend,
}