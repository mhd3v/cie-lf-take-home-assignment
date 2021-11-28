const router = require('express').Router();
const controller = require('./party.controller')

router
    .get('/party_plan', controller.getPartyPlan);

module.exports = router;
