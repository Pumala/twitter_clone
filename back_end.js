const mongoose      = require('mongoose');
const bluebird      = require('bluebird');
const express       = require('express');
const bodyParser    = require('body-parser');
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

// ********************************
//          USER TIMELINE/PROFILE
// *******************************
app.get('/profile', function(request, response) {

  // hard code IAmDom's _id
  var user_id = "IAmDom";

  User.findOne({ _id: user_id})
    .then(function(userInfo) {
      console.log('USER INFO:::', userInfo);
      return Tweet.find({
        username: {
          $in: userInfo.following.concat([user_id])
        }
      })
    })
    .then(function(allTweets) {
      console.log('YOOHOO::', allTweets);
      return response.json({
        allTweets: allTweets
      })
      // console.log('ALL THE DAMN TWEETS::', allTweets);
    })
    .catch(function(err) {
      console.log('Error grabbing DOM and his following TWEETS::', err);
    });

});

// ********************************
//          USER TIMELINE/PROFILE
// *******************************
app.put('/newtweet', function(request, response) {
  var newTweet = request.params;
  console.log('NEW TWEET::', newTweet);

  var newTweet = 'chase all the rabbits you can find!'

  var addNewTweet = new Tweet({
    tweet: newTweet,
    date: Date.now(),
    username: 'IAmDom'
  })

  addNewTweet.save();

  return response.json({
    tweet: newTweet
  });

});

app.listen(3000, function() {
  console.log('The server has started to listen........');
});
