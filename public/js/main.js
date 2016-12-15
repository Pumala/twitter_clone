var app = angular.module('twitter_app', ['ui.router', 'ngCookies']);

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
  })
  .state({
    name: "signup",
    url: "/signup",
    templateUrl: "templates/signup.html",
    controller: "SignUpController"
  })
  .state({
    name: "login",
    url: "/login",
    templateUrl: "templates/login.html",
    controller: "LoginController"
  });

  $urlRouterProvider.otherwise('/');
});

// ====================
// SERVICES
// ====================
app.factory('TwitterFactory', function($http, $rootScope, $state, $cookies) {
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

  service.addNewTweet = function(username, newTweet) {
    var url = '/newtweet';
    return $http({
      method: 'PUT',
      url: url,
      data: {
        username: username,
        newTweet: newTweet
      }
    });
  }

  service.submitNewSignUp = function(signupInfo) {
    var url = '/api/signup';
    return $http({
      method: 'PUT',
      url: url,
      data: signupInfo
    })
  }

  service.submitLoginInfo = function(loginInfo) {
    console.log('the LOGIN INFO::', loginInfo);
    var url = '/api/login';
    return $http({
      method: 'PUT',
      url: url,
      data: loginInfo
    })
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
      console.log('error!!!', err);
    });

});

app.controller('SignUpController', function($scope, TwitterFactory, $state) {

  $scope.submitSignUp = function() {
    if ($scope.password === $scope.confirm_password && $scope.password.length > 3) {
      var newUserInfo = {
        username: $scope.username,
        password: $scope.password
      }
      TwitterFactory.submitNewSignUp(newUserInfo)
        .success(function(info) {
          $state.go('login');
          console.log('NEW INFO::', info);
          console.log('SUCCESS registering new user!!');
        })
        .error(function() {
          console.log('encountered error submitting new user info!');
        })
    } else {
      console.log('PASSWORDS DO NOT MATCH!!!');
      return
    }
  }

});

app.controller('LoginController', function($scope, $state, $cookies, $rootScope, TwitterFactory) {

  $scope.submitLogin = function() {
    var loginInfo = {
      username: $scope.username,
      password: $scope.password
    };

    TwitterFactory.submitLoginInfo(loginInfo)
      .success(function(userInfo) {

        $cookies.putObject('cookieData', userInfo)
        // store user login infor in $rootScope variables
        $rootScope.username = userInfo.username;
        $rootScope.username = userInfo.password;
        $state.go('home');
        // console.log('Random token and username:', userInfo);

      })
      .error(function(err) {
        console.log('LOGIN ERROR');
        $state.go('login');
      });
  }

});

app.controller('UserController', function($scope, TwitterFactory, $state) {

  $scope.addTweet = function(newTweet) {
    TwitterFactory.addNewTweet($scope.username, newTweet)
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
      console.log('profile tweets coming in!!::', allTweets);
      console.log('here is EVERYTHING COMING for you:::', allTweets.allTweets);

      $scope.username = allTweets.userInfo._id;
      $scope.numFollowing = allTweets.userInfo.following.length;
      $scope.numFollowers = allTweets.userInfo.followers.length;

      $scope.numTweets = allTweets.numUserTweets;

      $scope.allTweets = allTweets.allTweets;
    })
    .error(function(err) {
      console.log('oh no!!! error!!!', err.message);
    });
});
