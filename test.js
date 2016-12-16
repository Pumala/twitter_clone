const mongoose      = require('mongoose');
const bluebird      = require('bluebird');
const moment = require('moment');
mongoose.Promise    = bluebird;
mongoose.set('debug', true);
mongoose.connect('mongodb://localhost/master_twitter_db');

const AuthToken = mongoose.model('AuthToken', {
  _id: { type: String },
  expires: Date
});

var newToken = new AuthToken({
  _id: '23723732'
})

newToken.save()
  .then(function(t) {
    console.log(t);
  })
  .catch(function(err) {
    console.log(err.stack);
  });
