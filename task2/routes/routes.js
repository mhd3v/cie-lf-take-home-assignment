const express = require('express');
const router = express.Router();

const partyRoutes = require("../api/party/party.index");

router
    .use('/', partyRoutes)

module.exports = router;
