const mongoose      = require('mongoose');
const bluebird      = require('bluebird');
const express       = require('express');
const bodyParser    = require('body-parser');
const uuidV4        = require('uuid/v4');
const moment        = require('moment');
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

// OLD DB
// mongoose.connect('mongodb://localhost/new_twitter_db');

// NEW DB
mongoose.connect('mongodb://localhost/master_twitter_db');

// OLD MODELS
// const User = mongoose.model('User', {
//   _id: { type: String, required: true, unique: true},
//   password: { type: String, required: true},
//   following: [String],
//   followers: [String]
// });
//
// const Tweet = mongoose.model('Tweet', {
//   tweet: { type: String, required: true},
//   date: Date,
//   username: String
// });

// come back to redirect
// app.get('/', function(request, response) {
//   response.redirect('http://google.com');
// })

// UPDATED MODELS
const User = mongoose.model('User', {
  _id: { type: String, required: true, unique: true},
  firstName: { type: String, required: true, unique: true},
  lastName: { type: String, required: true, unique: true},
  password: { type: String, required: true},
  email: { type: String, required: true},
  joined: String,
  following: [String],
  followers: [String],
  likes: [ObjectId],
  avatar: [String],
  token: String
});

const Tweet = mongoose.model('Tweet', {
  tweet: { type: String, required: true},
  date: String,
  username: String
});

const AuthToken = mongoose.model('AuthToken', {
  _id: { type: String, required: true, unique: true},
  expires: { type: Date, required: true }
});

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
    date: moment().format('MMMM Do YYYY'),
    username: userTweet
  })

  addNewTweet.save();

  return response.json({
    tweet: newTweet
  });

});

app.post('/api/signup', function(request, response) {
  console.log('NEW SINGUP PPL:', request.body);
  var username = request.body.username;
  var password = request.body.password;
  var firstName = request.body.firstName;
  var lastName = request.body.lastName;
  var email = request.body.email;

  bcrypt.genSalt(saltRounds)
    .then(function(salt) {
      return bcrypt.hash(password, salt);
    })
    .then(function(hash) {
      var newUser = new User({
        _id: username,
        firstName: firstName,
        lastName: lastName,
        password: hash,
        email: email,
        joined: moment().format('MMMM Do YYYY'),
        following: [],
        followers: [],
        likes: [],
        avatar: "",
        token: ""
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

app.delete('/api/logout/:tokenid', function(request, response) {

  var tokenId = request.params.tokenid;
  console.log('you requested token::', tokenId);

  // refactor this soon!!!!
  AuthToken.remove({ _id: tokenId })
    .then(function(updatedToken) {
      // console.log('updated the token?', updatedToken);
      return User.update({
        token: tokenId
      }, {
        $set: {
          token: ""
        }
      })
    })
    .then(function(updatedUser) {
      console.log('updated the user?', updatedUser);
      response.json({
        message: 'SUCCESS deleting token'
      });
    })
    .catch(function(err) {
      console.log('error deleting auth token');
    });

});

app.put('/api/login', function(request, response) {

  var username = request.body.username;
  var password = request.body.password;
  console.log('REQUESTED::', request.body);

  User.find({ _id: username })
    .then(function(userInfo) {
      var hash = userInfo[0].password;
      return bcrypt.compare(password, hash);
    })
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

      var addThirty = moment().add(30, 'days').format('MM-DD-YYYY')
      console.log('ADD 30 days', addThirty);

      // insert new entry in AuthToken model
      var newToken = new AuthToken({
        _id: randomToken,
        expires: moment().add(30, 'days').format('MM-DD-YYYY')
      })

      return newToken.save();
    })
    .then(function(token) {
      // console.log('saved token', token);
      // update user model to include token
      return [ User.update({
          _id: username
        }, {
          $set: {
            token: token._id
          }
        }), User.findOne({ _id: username }), token.expires, token._id];
      // return [
      //   User.update({
      //     _id: username
      //   }, {
      //     $set: {
      //       token: randomToken
      //     }
      //   }),
      //   username,
      //   randomToken
      // ]
      // response.json({
      //   // pass in request.body which is an Object
      //   // storing username and password
      //   username: username,
      //   token: randomToken
      // })
    })
    .spread(function(updated, userInfo, expires, token) {
      // console.log('i was updated i think', updated);
      // console.log('i was updated i think', userInfo);
      // console.log('i was updated i think', expires);
      // console.log('i was updated i think', token);
      response.json({
        username: username,
        userInfo: userInfo,
        token: {
          token: token,
          expires: expires
        }
      });
      // response.send('ok');
    })
    // .spread(function(updated, username, randomToken) {
    //   console.log('updated: ', updated);
    //   console.log('username: ', username);
    //   console.log('randomToken: ', randomToken);
    //
    //   response.json({
    //     // pass in request.body which is an Object
    //     // storing username and password
    //     username: username,
    //     token: randomToken
    //   })
    // })
    .catch(function(err) {
      console.log('Error checking login info:', err.message);
      response.send({ error: err.message });
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

app.put('/api/edit/likes', function(request, response) {

  console.log('data from likes::', request.body);
  var data = request.body;
  var isLiked = data.isLiked;
  var userId = data.username;
  var tweetId = data.tweetId;

  // first, use userId to find the userInfo
  // we want to grab his likes array
  User.findOne({ _id: userId})
    .then(function(userInfo) {
      var likesArr = userInfo.likes;

      if (isLiked) {
        console.log('HMMMM', likesArr);
        likesArr.push(tweetId)
      } else {
        var removeIndex = likesArr.indexOf(tweetId);
        likesArr.splice(removeIndex, 1);
      }

      console.log('LIKE OR NOT:', likesArr);

      return [ User.update({
        _id: userId
      }, {
        $set: {
          likes: likesArr
        }
      }), likesArr ];
    })
    .spread(function(message, likesArr) {
      console.log('sucess updating likes!!!', message);
      response.json({
        likes: likesArr
      })
    })
    .catch(function(err) {
      console.log('error liking...', err.message);
    });

  // User.update({
  //   _id: userId
  // }, {
  //   $set: {
  //     likes
  //   }
  // })
  //   .then(function(userInf))

  console.log('catching the LIKES', data);

});

app.get('/api/retweet/:retweetid', function(request, response) {

  var retweetId = request.params.retweetid;

  console.log('retweet ID!', retweetId);

  return response.json({
    message: 'success retweeting!!'
  })
});

app.get('/api/search/:keyword', function(request, response) {
  // var search = request.params.keyword;

  // hardcode the search value as win until gaining understanding of regex

  User.find({ _id: /.*win.*/ })
    .then(function(results) {
      console.log('found results for :::', results);
      var allUsers = [];
      results.forEach(function(result) {
        allUsers.push(result._id);
      });
      console.log('all users found::', allUsers);
      return response.json({
        allUsers: allUsers
      })
    })
    .catch(function(err) {
      console.log('encountered errors searching', err.message);
    });

});


app.listen(3000, function() {
  console.log('The server has started to listen........');
});
