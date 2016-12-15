// ********************************
// Hard Coded Users
// ********************************

var user1 = new User({
  _id: 'IAmLyn',
  password: '12345',
  following: ['IAmDom'],
  followers: ['funkyClam']
});

user1.save();

var user2 = new User({
  _id: 'IAmDom',
  password: 'abcde',
  following: ['funkyClam'],
  followers: ['funkyClam']
});

user2.save();

var user11 = new User({
  _id: 'funkyClam',
  password: '123funkyclam',
  following: ['IAmDom', 'funkyClam'],
  followers: []
});

user11.save();

var user2 = new User({
  username: 'jumpinLollies',
  password: '123jumpinglollies',
  following: [],
  followers: []
});

user2.save();

var user3 = new User({
  username: 'monkeySauce',
  password: '123monkey',
  following: [],
  followers: []
});

user3.save();

var user4 = new User({
  username: 'koalaMee',
  password: '123koalaMee',
  following: [],
  followers: []
});

user4.save();

// ********************************
// Hard Coded Tweets
// ********************************

var tweet1 = new Tweet({
  tweet: 'See the monkey sleeping in the tree?',
  date: Date.now(),
  username: 'funkyClam'
});

tweet1.save();

var tweet2 = new Tweet({
  tweet: 'Wake up the rooster!!',
  date: Date.now(),
  username: 'funkyClam'
});

tweet2.save();

var tweet3 = new Tweet({
  tweet: 'Cha cha bing bang kooky!',
  date: Date.now(),
  username: 'IAmDom'
});

tweet3.save();

var tweet4 = new Tweet({
  tweet: 'Run in circles til\' you pass out!!',
  date: Date.now(),
  username: 'IAmLyn'
});

tweet4.save();

var tweet5 = new Tweet({
  tweet: 'Foaming at the mouth all day long!',
  date: Date.now(),
  username: 'IAmDom'
});

tweet5.save();

var tweet6 = new Tweet({
  tweet: 'Dance until your legs break!!',
  date: Date.now(),
  username: 'monkeySause',
  userId: "5851a9788626123190ecbcc2"
});

tweet6.save();

var tweet2 = new Tweet({
  tweet: "Where's my dog you bastard?!",
  date: Date.now(),
  username: "IAmDom",
  userId: "5851a9788626123190ecbcbf"
});

tweet2.save();

var tweet1 = new Tweet({
  tweet: "OMG, so funny!",
  date: Date.now(),
  username: "IAmLyn",
  userId: "5851a9788626123190ecbcbe"
});

tweet1.save();

// ********************************
// Updated Users to follow other users
// ********************************

User.update({
  // IAmDom is....
  _id: '5851a9788626123190ecbcbf'
  }, {
      $set: {
        following: [
          // following IAmLyn and jumpinLollies
          '5851a9788626123190ecbcbe',
          '5851a9788626123190ecbcc1'
        ]
    }
  })
  .then(function(following) {
    console.log("FOLLOWING::", following);
  })
  .catch(function(err) {
    console.log('error grabbing who im following::', err.message);
  });
