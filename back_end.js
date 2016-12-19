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
  date: Date,
  username: String,
  retweeter: String,
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

  // find 20 tweets in the db
  Tweet.find().limit(20)
    .then(function(allTweets) {
      // send the array of objects (allTweets) to the front-end
      return response.json({
        allTweets: allTweets
      })
    })
    .catch(function(err) {
      console.log('error in world timeline', err.message);
    })

});

// ***************************************
//          USER TIMELINE/PROFILE
// ***************************************
app.get('/api/profile/:username', function(request, response) {

  // grab the username from the params (who's page we're on)
  var user_id = request.params.username;

  // make a query to find the user info
  User.findOne({ _id: user_id})
    .then(function(userInfo) {

      // add the user to his own following array
      // because later we want to get all the tweets and retweets made
      // by him and everyone he's following
      var followingArr = userInfo.following.concat([user_id]);

      // return the user info because we still need it
      // do a query to get all the tweets made by him and everyone he is following
      // do another query to grab all the retweets made by him and everyone he is following
      // do another query to grab all the user info from everyone he is following
      return [userInfo, Tweet.find({
        $and: [
          { username: {
              $in: followingArr
            }
          }, {
            retweeter: ""
          }
        ]
      }), Tweet.find({
        retweeter: {
          $in: followingArr
        }
      }),
        User.find({
        _id: {
          $in: followingArr
        }
      })]
    })
    .spread(function(userInfo, allTweets, allRetweets, allUserInfos) {

      // save all the tweets and retweets to tweetAndRetweets variable
      var tweetAndRetweets = allTweets.concat(allRetweets);

      // create a new variable and give it the value of 0
      var numUserTweets = 0;
      // loop through all the tweets and retweets
      tweetAndRetweets.forEach(function(tweet) {
        var tweetUser = tweet.username;
        var retweeter = tweet.retweeter;
        // if the original tweet was written by the user or if the retweet was retweeted by the user
        if (((tweetUser === user_id) && (retweeter === "")) || (retweeter === user_id)) {
          // then increment the numUserTweets count by 1
          numUserTweets++;
        }
      });

      // pass the userInfo, all the tweets and retweets, and numUserTweets to the front-end
      return response.json({
        userInfo: userInfo,
        allTweets: tweetAndRetweets,
        numUserTweets: numUserTweets
      })

    })
    .catch(function(err) {
      console.log('Error grabbing DOM and his following TWEETS::', err);
    });

});

// ***************************************
//          USER TIMELINE/PROFILE
// ***************************************
app.post('/api/newtweet', function(request, response) {

  // save the username and newTweet to variable
  var userTweet = request.body.username;
  var newTweet = request.body.newTweet;

  // create a new instance of Tweet
  var addNewTweet = new Tweet({
    tweet: newTweet,
    date: new Date(),
    username: userTweet,
    retweeter: "",
    likes: []
  });

  // save it the db
  addNewTweet.save();

  return response.json({
    tweet: newTweet
  });

});

// ********************************
//          USER SIGNUP
// *******************************
app.post('/api/signup', function(request, response) {

  // save the signup info to variables
  var username = request.body.username;
  var password = request.body.password;
  var firstName = request.body.firstName;
  var lastName = request.body.lastName;
  var email = request.body.email;

  // generate a salt
  bcrypt.genSalt(saltRounds)
    .then(function(salt) {
      // return an encrypted password
      return bcrypt.hash(password, salt);
    })
    .then(function(hash) {
      // create a new instance of User
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
      });

      // save the new user to the db
      return newUser.save();

    })
    .then(function(saved) {
      response.json({
        message: 'Saved new user!'
      });
    })
    .catch(function(err) {
      console.log('error bcrypting!', err.message);
    })

});

// ******************************************
//          USER LOGOUT - REMOVE TOKEN
// ******************************************
app.delete('/api/logout/:tokenid', function(request, response) {

  var tokenId = request.params.tokenid;

  // remove the token when user logouts
  AuthToken.remove({ _id: tokenId })
    .then(function(updatedToken) {
      // update user info and set token to an empty string
      return User.update({
        token: tokenId
      }, {
        $set: {
          token: ""
        }
      })
    })
    .then(function(updatedUser) {
      response.json({
        message: 'SUCCESS deleting token'
      });
    })
    .catch(function(err) {
      console.log('error deleting auth token');
    });

});

// *****************************************
//          USER TIMELINE/PROFILE
// *****************************************
app.put('/api/login', function(request, response) {

  // save username and password to variables
  var username = request.body.username;
  var password = request.body.password;

  // make a query to find the user info
  User.find({ _id: username })
    .then(function(userInfo) {
      // get the encrypted password from the db that matches the user
      var hash = userInfo[0].password;
      // compare the password with the encrypted password
      return bcrypt.compare(password, hash);
    })
    .then(function(results) {

      // check if the passwords are a match or not
      if (results) {
        // if so, generate a random token
        var randomToken = uuidV4();

        // add 30 days
        var addThirtyDays = moment().add(30, 'days').format('MM-DD-YYYY');

        // insert new entry in AuthToken model
        var newToken = new AuthToken({
          _id: randomToken,
          expires: addThirtyDays
        })

        return newToken.save();
      } else {
        return response.json({
          error: 'passwords do not match'
        })
      }
    })
    .then(function(token) {
      // update user model to include token
      // also make query to find User Info
      // pass in token expiration date and token id
      return [ User.update({
          _id: username
        }, {
          $set: {
            token: token._id
          }
        }), User.findOne({ _id: username }), token.expires, token._id];
    })
    .spread(function(updated, userInfo, expires, token) {
      response.json({
        username: username,
        userInfo: userInfo,
        token: {
          token: token,
          expires: expires
        }
      });
    })
    .catch(function(err) {
      console.log('Error checking login info:', err.message);
      response.send({ error: err.message });
    });

});

// *****************************************
//          Unfollow User
// *****************************************
app.put('/api/unfollow', function(request, response) {

  var wasFollowing = request.body.wasFollowing;
  var user_id = request.body.user_id;

  // make 2 queries:
  // 1) get the user info
  // 2) get who the user was following info
  bluebird.all([
    User.findOne({
      _id: user_id
      }),
      User.findOne({
        _id: wasFollowing
      })
    ])
    .spread(function(userInfo, wasFollowingInfo) {

      // assign the array of who the user is following to a variable
      var following = userInfo.following;

      // assign the array of who were the followers of who the user was following to a variable
      var followers = wasFollowingInfo.followers;

      // remove user from the following array because he is no longer following the person
      // first, get the index
      var followingIndex = following.indexOf(wasFollowing);

      // use the index to remove him from the following array
      following.splice(followingIndex, 1);

      // remove user from the followers array because he is no longer a followers
      // first, get the index
      var followerIndex = followers.indexOf(user_id);

      // use the index to remove him from the followers array
      followers.splice(followerIndex, 1);

      // make queries to update the db
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
      response.json({
        message: 'it was a success unfollowing!'
      })
    })
    .catch(function(err) {
      console.log('err trying to unfollow::', err);
    });

});

// *****************************************
//          FOLLOW User
// *****************************************
app.put('/api/follow', function(request, response) {

  var user_id = request.body.user_id;
  var whoUserFollows = request.body.whoUserFollows;

  // make a promise => grab 2 different values
  // 1) find current User info
  // 2) find the info of the user that the current User is following
  bluebird.all([
      User.findOne({ _id: user_id}),
      User.findOne({ _id: whoUserFollows})
    ])
    .spread(function(userInfo, followingInfo) {

      // modify the current User's following array to include the new user he is following
      var following = userInfo.following.concat([whoUserFollows]);
      // modify the user's (who the current User is following) followers
      // add the current user to his followers array
      var followers = followingInfo.followers.concat([user_id]);

      // update the db
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
      return response.json({
        message: 'it was a success following!!'
      })
    })
    .catch(function(err) {
      console.log('encountered err following!!!', err.message);
    });

})

// *****************************************
//              REMOVE TWEET
// *****************************************
app.delete('/api/remove/:tweetid', function(request, response) {

  var tweetId = request.params.tweetid;

  // remove tweet from db
  Tweet.remove({ _id: tweetId })
    .then(function(status) {
      response.json({
        message: 'SUCCESS DELETING TWEET'
      })
    })
    .catch(function(err) {
      console.log('error deleting tweet', err.message);
    })

});

// *****************************************
//           EDIT LIKES (LIKE OR UNLIKE)
// *****************************************
app.put('/api/edit/likes', function(request, response) {

  var data = request.body;
  var isLiked = data.isLiked;
  var userId = data.username;
  var tweetId = data.tweetId;
  console.log('like??', isLiked);
  // first, use userId to find the userInfo
  // we want to grab his likes array
  bluebird.all([
      User.findOne({ _id: userId}),
      Tweet.findOne({ _id: tweetId})
    ])
    .spread(function(userInfo, tweetInfo) {

      var userLikesArr = userInfo.likes;
      var tweetLikes = tweetInfo.likes;

      // add or remove the tweetId from the user's likes array
      // add or remove the user from the tweet's likes array
      if (isLiked) {
        userLikesArr.push(tweetId);
        tweetLikes.push(userId);
      } else {
        var removeTweetIndex = userLikesArr.indexOf(tweetId);
        userLikesArr.splice(removeTweetIndex, 1);

        var removeUserIndex = tweetLikes.indexOf(userId);
        tweetLikes.splice(removeUserIndex, 1);
      }

      // make a query to update the user's like array  and tweet's like array in the db
      // also return the likes array ??
      return [ User.update({
        _id: userId
      }, {
        $set: {
          likes: userLikesArr
        }
      }), Tweet.update({
        _id: tweetId
      }, {
        $set: {
          likes: tweetLikes
        }
      }), userLikesArr ];

    })
    .spread(function(userUpdate, tweetUpdate, likesArr) {
      response.json({
        likes: likesArr
      })
    })
    .catch(function(err) {
      console.log('error liking...', err.message);
    });

});

// *****************************************
//           Add Retweet
// *****************************************
app.post('/api/retweet', function(request, response) {
// FIX THIS PART TO include
// date: moment().format('MMMM Do YYYY'),

  var retweetId = request.body.retweetId;
  var retweeter = request.body.username;

  // make a query to grab the tweet info
  Tweet.findOne({ _id: retweetId })
    .then(function(tweetInfo) {

      // create a new instance of tweet
      var newTweet = new Tweet({
        tweet: tweetInfo.tweet,
        date: new Date(),
        username: tweetInfo.username,
        retweeter: retweeter,
        likes: [String]
      })

      // save it to the db
      return newTweet.save();

    })
    .then(function(addedRetweet) {
      return response.json({
        message: 'success retweeting!!'
      });
    })
    .catch(function(err) {
      console.log('error trying to retweet:', err.message)
    })

});

// *****************************************
//           SEARCH FOR USERS
// *****************************************
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
