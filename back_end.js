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
  retweets: [ObjectId],
  avatar: [String],
  token: String
});

const Tweet = mongoose.model('Tweet', {
  tweet: { type: String, required: true},
  date: String,
  username: String,
  likes: [String]
});

const AuthToken = mongoose.model('AuthToken', {
  _id: { type: String, required: true, unique: true},
  expires: { type: Date, required: true }
});

// ********************************
//          WORLD TIMELINE
// *******************************
app.get('/timeline', function(request, response) {

  bluebird.all([ Tweet.find().limit(20), User.find().limit(20)])
    .spread(function(allTweets, allUsers) {

      var allRetweetsArr = [];
      var allRetweetsIds = [];

      allUsers.forEach(function(user) {
        console.log('each for each::', user.retweets);
        if (user.retweets.length > 0) {
          allRetweetsArr.push({ user: user._id, retweetId: user.retweets});
          allRetweetsIds = allRetweetsIds.concat(user.retweets);
        }
      })

      return [ allTweets, allRetweetsArr, Tweet.find({
        _id: {
          $in: allRetweetsIds
        }
      })]

    })
    .spread(function(allTweets, allRetweetsArr, allRetweets) {

      var updatedArr = [];

      allRetweetsArr.forEach(function(retweetObj) {
        retweetObj.retweetId.forEach(function(retweetId) {
          updatedArr.push({ retweeter: retweetObj.user, retweetId: retweetId});
        })
      })

      var newEverthing = [];

      updatedArr.forEach(function(tweet) {
        allRetweets.forEach(function(retweet) {

          if (String(tweet.retweetId) === String(retweet._id)) {
            newEverthing.push({
              _id: retweet._id,
              retweeter: tweet.retweeter,
              tweet: retweet.tweet,
              date: retweet.date,
              username: retweet.username
            })
          }
        });
      });

      allTweets = allTweets.concat(newEverthing);

      return response.json({
          allTweets: allTweets
        })

      })
      .catch(function(err) {
        console.log('error:', err.message);
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

      var followingArr = userInfo.following.concat([user_id]);

      // console.log('USER INFO:::', userInfo);
      return [userInfo, Tweet.find({
        username: {
          $in: followingArr
        }
      }), User.find({
        _id: {
          $in: followingArr
        }
      })]
    })
    .spread(function(userInfo, allTweets, allUserInfos) {
      console.log('ALL USER INFO::', allUserInfos);

      var allRetweets = [];
      var allRetweetsIds = [];

      allUserInfos.forEach(function(userInfo) {
        userInfo.retweets.forEach(function(tweetId) {
          allRetweets.push({ retweeter: userInfo._id, tweetId: tweetId });
          allRetweetsIds.push(tweetId);
        })
      });

      console.log('ALL RETWEETS IDS HAHAHA', allRetweetsIds);

      console.log('ALL RETWEETS ARRR!!!', allRetweets);

      var userId = userInfo._id;
      var numUserTweets = 0;
      allTweets.forEach(function(tweet) {
        var tweetUser = tweet.username;
        if (tweetUser === userId) {
          numUserTweets++;
        }
      });
      console.log('ALLL TWEETS::', allTweets);

      return [ userInfo, allTweets, numUserTweets, allRetweets, Tweet.find({
        _id: {
          $in: allRetweetsIds
        }
      }) ]


    })
    .spread(function(userInfo, allTweets, numUserTweets, allRetweetsArr, allRetweetsInfo) {

      var retweetArr = [];

      allRetweetsArr.forEach(function(retweet) {
        allRetweetsInfo.forEach(function(retweetInfo) {
          if (String(retweet.tweetId) === String(retweetInfo._id)) {
            retweetArr.push({
              _id: retweetInfo._id,
              retweeter: retweet.retweeter,
              tweet: retweetInfo.tweet,
              date: retweetInfo.date,
              username: retweetInfo.username,
              likes: retweetInfo.likes
            })
          }
        });
      });

      allTweets = allTweets.concat(retweetArr);

      // console.log('NEWEST ARR!!:', allTweets);
      // console.log('All 00000 RETWEETS::', allRetweetsInfo);

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
    username: userTweet,
    likes: []
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
        retweets: [],
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

      // want to add username to likes array in Tweet
      return [ Tweet.findOne({ _id: tweetId}), likesArr ];

      // response.json({
      //   likes: likesArr
      // })
    })
    .spread(function(tweetInfo, likesArr) {
      console.log('tweet INFO::', tweetInfo);
      var likes = tweetInfo.likes;
      console.log('BEFORE LIKES ARR::', likes);

      if (isLiked) {
        likes.push(userId);
      } else {
        var removeIndex = likes.indexOf(userId);
        likes.splice(removeIndex, 1);
      }
      console.log('AFTER LIKES ARR::', likes);
      return [ Tweet.update({
        _id: tweetId
      }, {
        $set: {
          likes: likes
        }
      }), likesArr ];
    })
    .spread(function(status, likesArr) {
      console.log('STATUS FIXING LIKES:', status);
      response.json({
        likes: likesArr
      })
    })
    .catch(function(err) {
      console.log('error liking...', err.message);
    });

});

app.post('/api/retweet', function(request, response) {

  var retweetId = request.body.retweetId;
  var username = request.body.username;

  User.findOne({ _id: username})
    .then(function(userInfo) {
      var retweetsArr = userInfo.retweets;

      retweetsArr.push(retweetId);

      console.log('USER INFO REWTEETING:', retweetsArr);

      return User.update({
        _id: username
      }, {
        $set: {
          retweets: retweetsArr
        }
      });

    })
    .then(function(updatedRetweet) {
      console.log('SUCCESS retweeting:', updatedRetweet);
      return response.json({
        message: 'success retweeting!!'
      });
    })
    .catch(function(err) {
      console.log('error trying to retweet:', err.message)
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
