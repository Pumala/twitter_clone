const mongoose      = require('mongoose');
const bluebird      = require('bluebird');
const express       = require('express');
const bodyParser    = require('body-parser');
const uuidV4        = require('uuid/v4');
// BCRYPT
const bcrypt        = require('bcrypt-promise');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

const app           = express();
mongoose.Promise    = bluebird;
const ObjectId      = mongoose.Schema.ObjectId;

app.use(bodyParser.json());
app.use(express.static('public'));

mongoose.connect('mongodb://localhost/new_twitter_db');

const User = mongoose.model('User', {
  _id: { type: String, required: true, unique: true},
  password: { type: String, required: true},
  following: [String],
  followers: [String]
});

const Tweet = mongoose.model('Tweet', {
  tweet: { type: String, required: true},
  date: Date,
  username: String
});

// come back to redirect
app.get('/', function(request, response) {
  response.redirect('http://google.com');
})

// ********************************
//          WORLD TIMELINE
// *******************************
app.get('/timeline', function(request, response) {
  Tweet.find().limit(20)
    .then(function(allTweets) {
      console.log('ALLLLLALLL ALLLLL::', allTweets);
      return response.json({
        allTweets: allTweets
      })
    })
    .catch(function(err) {
      console.log('ran into error in world timeline::', err);
    });

});

// PRACTICE
// ********************************
//          USER TIMELINE/PROFILE
// *******************************
app.get('/profile/:username', function(request, response) {

  console.log('PROFILE:::', request.params);
  var user_id = request.params.username;

  User.findOne({ _id: user_id})
    .then(function(userInfo) {
      // console.log('USER INFO:::', userInfo);
      return [userInfo, Tweet.find({
        username: {
          $in: userInfo.following.concat([user_id])
        }
      })]
    })
    .spread(function(userInfo, allTweets) {
      var userId = userInfo._id;
      var numUserTweets = 0;
      allTweets.forEach(function(tweet) {
        var tweetUser = tweet.username;
        if (tweetUser === userId) {
          numUserTweets++;
        }
      });
      console.log('Num User TWEETS::', numUserTweets);

      return response.json({
        userInfo: userInfo,
        allTweets: allTweets,
        numUserTweets: numUserTweets
      })
    })
    .catch(function(err) {
      console.log('Error grabbing DOM and his following TWEETS::', err);
    });

});



// WORKS
// // ********************************
// //          USER TIMELINE/PROFILE
// // *******************************
// app.get('/profile', function(request, response) {
//
//   // hard code IAmDom's _id
//   var user_id = "IAmDom";
//
//   User.findOne({ _id: user_id})
//     .then(function(userInfo) {
//       console.log('USER INFO:::', userInfo);
//       return [userInfo, Tweet.find({
//         username: {
//           $in: userInfo.following.concat([user_id])
//         }
//       })]
//     })
//     .spread(function(userInfo, allTweets) {
//       console.log('userinfo HERE::', userInfo);
//       console.log('YOOHOO::', allTweets);
//       return response.json({
//         allTweets: allTweets
//       })
//     })
//     .catch(function(err) {
//       console.log('Error grabbing DOM and his following TWEETS::', err);
//     });
//
// });

// ********************************
//          USER TIMELINE/PROFILE
// *******************************
app.post('/newtweet', function(request, response) {

  var userTweet = request.body.username;
  var newTweet = request.body.newTweet;

  var addNewTweet = new Tweet({
    tweet: newTweet,
    date: Date.now(),
    username: userTweet
  })

  addNewTweet.save();

  return response.json({
    tweet: newTweet
  });

});

app.post('/api/signup', function(request, response) {

  var username = request.body.username;
  var password = request.body.password;

  bcrypt.genSalt(saltRounds)
    .then(function(salt) {
      return bcrypt.hash(password, salt);
    })
    .then(function(hash) {
      var newUser = new User({
        _id: username,
        password: hash,
        following: [],
        followers: []
      })
      newUser.save();
    })
    .catch(function(err) {
      console.log('error bcrypting!', err.message);
    })

  return response.json({
    message: 'YAY!'
  });

});

app.put('/api/login', function(request, response) {

  var username = request.body.username;
  var password = request.body.password;
  console.log('REQUESTED::', request.body);
  User.find({ _id: username })
    .then(function(userInfo) {
      var hash = userInfo[0].password;
      bcrypt.compare(password, hash)
        .then(function(results) {
          var message = "";
          // check if results is true
          if (results) {
            message = 'SUCESSS';
          } else {
            message = 'FAIL';
          }
          // generates a random token
          var randomToken = uuidV4();
          console.log('TOKEN::', randomToken);
          response.json({
            // pass in request.body which is an Object
            // storing username and password
            username: username,
            token: randomToken
          })
        })
    })
    .catch(function(err) {
      console.log('Error checking login info:', err.message);
    })

});

app.listen(3000, function() {
  console.log('The server has started to listen........');
});
