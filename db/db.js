/*
Connect to the mongo db and return a handle
*/

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/appleseed');

module.exports = mongoose;