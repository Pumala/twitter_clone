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
// app.get('/', function(request, response) {
//   response.redirect('http://google.com');
// })

// ********************************
//          WORLD TIMELINE
// *******************************
app.get('/timeline', function(request, response) {
  Tweet.find().limit(20)
    .then(function(allTweets) {
      // console.log('ALLLLLALLL ALLLLL::', allTweets);
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

app.put('/api/unfollow', function(request, response) {

  var wasFollowing = request.body.wasFollowing;
  var user_id = request.body.user_id;

  bluebird.all([
    User.findOne({
    _id: user_id
  }),
  User.findOne({
    _id: wasFollowing
  })])
    .spread(function(userInfo, wasFollowingInfo) {
      console.log('user info::', userInfo.following);
      console.log('wasFollowing info::', wasFollowingInfo);

      // assign the array of who the user is following to a variable
      var following = userInfo.following;
      // assign the array of who were the followers of who the user was following to a variable
      var followers = wasFollowingInfo.followers;

      // remove user from the following array because he is no longer following the person
      var followingIndex = following.indexOf(wasFollowing);
      // console.log('index was::', removeIndex);

      // remove who he was following from the following array
      following.splice(followingIndex, 1);

      var followerIndex = followers.indexOf(user_id);

      // console.log('the followerindex', followerIndex);

      followers.splice(followerIndex, 1);

      // console.log('the followers::', followers);
      //
      // console.log('killed it the following', following);
      return [ User.update({
          _id: user_id
        }, {
          $set: {
            following
          }
        }),
        User.update({
          _id: wasFollowing
        }, {
          $set: {
            followers
          }
        })
      ]

    })
    .spread(function(updated) {
      console.log('updated?', updated);
      response.json({
        message: 'it was a success unfollowing!'
      })
    })
    .catch(function(err) {
      console.log('err trying to unfollow::', err);
    })
  // console.log('I was following him::', wasFollowing);



});

app.put('/api/follow', function(request, response) {

  var user_id = request.body.user_id;
  var whoUserFollows = request.body.whoUserFollows;

  // make a promise => grab 2 different values
  // 1) find current User info
  // 2) find the info of the user that the current User is following
  bluebird.all([ User.findOne({ _id: user_id}), User.findOne({ _id: whoUserFollows})])
    .spread(function(userInfo, followingInfo) {
      // console.log('USER INFO:', userInfo);
      // console.log('FOLLOWING INFO:', followingInfo);

      // modify the current User's following array to include the new user he is following
      var following = userInfo.following.concat([whoUserFollows]);
      // modify the user's (who the current User is following) followers
      // add the current user to his followers array
      var followers = followingInfo.followers.concat([user_id]);

      return [ User.update({
          _id: user_id
        }, {
          $set: {
            following
          }
        }), User.update({
          _id: whoUserFollows
        }, {
          $set: {
            followers
          }
        })
      ]
    })
    .spread(function(following, follower) {
      // console.log('it was a success!!');
      // console.log('FOLOWING:', following);
      // console.log('FOLOWerrrr:', follower);
      return response.json({
        message: 'it was a success following!!'
      })
    })
    .catch(function(err) {
      console.log('encountered err following!!!', err.message);
    });

})

app.delete('/api/remove/:tweetid', function(request, response) {

  var tweetId = request.params.tweetid;

  Tweet.remove({ _id: tweetId })
    .then(function(status) {
      console.log('SUCCESS DELETING TWEET');
      response.json({
        message: 'SUCCESS DELETING TWEET'
      })
    })
    .catch(function(err) {
      console.log('error deleting tweet', err.message);
    })

});


app.listen(3000, function() {
  console.log('The server has started to listen........');
});
