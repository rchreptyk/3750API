var express = require('express');
var router = express.Router();
var User = require('../db/User');

/* GET users listing. */
router.get('/', function(req, res) {
  res.send('respond with a resource');
});

module.exports = router;
