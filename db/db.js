
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/appleseed');

module.exports = mongoose;