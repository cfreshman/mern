const express = require('express');
const M = require('./model');

const R = express.Router();
R.get('/:hash', async (rq, res, next) => {
    console.log('[REDIRECT]', rq.params.hash)
    let { ly } = await M.get('', rq.params.hash)
    if (ly && ly.links.length === 1) {
        res.redirect('https://' + ly.links[0].replace('https://', ''))
    } else {
        next()
    }
});

module.exports = {
    routes: R,
    model: M,
}