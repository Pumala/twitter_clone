var app = angular.module('twitter_app', ['ui.router']);

// ====================
// STATES
// ====================
app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state({
    name: "home",
    url: "/timeline",
    templateUrl: "templates/world_timeline.html",
    controller: "WorldController"
  })
  .state({
    name: "profile",
    url: "/profile",
    templateUrl: "templates/user_profile.html",
    controller: "UserController"
  });
  // .state({
  //   name: "profile",
  //   url: "/profile",
  //   templateUrl: "templates/user_profile.html",
  //   controller: "UserProfileController"
  // });

  $urlRouterProvider.otherwise('/');
});

// ====================
// SERVICES
// ====================
app.factory('TwitterFactory', function($http, $rootScope, $state) {
  var service = {};

  service.allTweets = function() {
    var url = '/timeline';
    return $http({
      method: 'GET',
      url: url
    });
  }

  service.userProfile = function() {
    var url = '/profile';
    return $http({
      method: 'GET',
      url: url
    });
  }

  service.addNewTweet = function(newTweet) {
    var url = '/newtweet';
    return $http({
      method: 'PUT',
      url: url,
      data: {
        newTweet: newTweet
      }
    });
  }

  return service;
});

app.controller('WorldController', function($scope, TwitterFactory) {

  TwitterFactory.allTweets()
    .success(function(allTweets) {
      console.log('here is all the tweets for you:::', allTweets);
      $scope.allTweets = allTweets.allTweets;

    })
    .error(function(err) {
      console.log('error!!!', err.message);
    });

});

app.controller('UserController', function($scope, TwitterFactory, $state) {

  $scope.addTweet = function(newTweet) {
    TwitterFactory.addNewTweet(newTweet)
    .success(function(tweet) {
      console.log('inserted the new tweet!!::', tweet);
      $state.reload();
    })
    .error(function(err) {
      console.log('oh no!!! error!!!', err.message);
    });
  }

  TwitterFactory.userProfile()
    .success(function(allTweets) {
      console.log('here is all USER tweets for you:::', allTweets.allTweets);

      $scope.allTweets = allTweets.allTweets;
    })
    .error(function(err) {
      console.log('oh no!!! error!!!', err.message);
    });
});
