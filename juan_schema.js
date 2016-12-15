const User = mongoose.model('User', {
  _id: String, // actually the username
  avatar_url: String,
  following: [String],
  // followers: [ObjectId]  // do not need it for now
});

const Tweet = mongoose.model('Tweet', {
  text: String,
  date: Date,
  userID: String
});


// World Timeline
Tweet.find().limit(20);


// User Profile page
bluebird.all([
  Tweet.find({ userID: theUserID }).limit(20),
  User.findById(theUserId)
])
.spread(function(tweets, user) {

});


// My timeline
User.findById(theUserId)
  .then(function(user) {
    return Tweet.find({
      userID: {
        $in: user.following.concat([user._id])
      }
    });
  })
  .then(function(tweets) {
    // you have the tweets
  });
