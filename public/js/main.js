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
    url: "/profile/{username}",
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

  // set it to cookieData if it exists, else null
  $rootScope.factoryCookieData = $cookies.getObject('cookieData') ? $cookies.getObject('cookieData') : null;

  // check if user is logged in
  if ($rootScope.factoryCookieData) {
    // if so, then reassign the $rootScope variables
    $rootScope.rootUsername = $cookies.getObject('cookieData').username;
    $rootScope.rootToken = $cookies.getObject('cookieData').token;
  }

  // LOGOUT
  $rootScope.rootLogout = function() {
    // reset all the $rootScope variables to null
    $rootScope.rootUsername = null;
    $rootScope.rootToken = null;
    $rootScope.factoryCookieData = null;
    // kill the cookies
    $cookies.remove('cookieData');
    // redirect to home page
    $state.go('home');
  }

  service.allTweets = function() {
    var url = '/timeline';
    return $http({
      method: 'GET',
      url: url
    });
  }

  service.userProfile = function(username) {
    var url = '/profile/' + username;
    console.log('user anyone??', url);

    return $http({
      method: 'GET',
      url: url
    });
  }

  service.addNewTweet = function(username, newTweet) {
    var url = '/newtweet';
    return $http({
      method: 'POST',
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
      method: 'POST',
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

  service.followUser = function(whoUserFollows) {
    console.log('I am following this guy =>', whoUserFollows);
    var url = '/api/follow';
    return $http({
      method: 'PUT',
      url: url,
      data: {
        whoUserFollows: whoUserFollows,
        user_id: $rootScope.rootUsername
      }
    })
  }

  service.unfollowUser = function(wasFollowing) {
    console.log('was Following this guy =>', wasFollowing);
    var url = '/api/unfollow';
    return $http({
      method: 'PUT',
      url: url,
      data: {
        wasFollowing: wasFollowing,
        user_id: $rootScope.rootUsername
      }
    })
  }

  service.removeTweet = function(tweetId) {
    console.log('remove PLEASEEEE', tweetId);
    var url = '/api/remove/' + tweetId;
    return $http({
      method: 'DELETE',
      url: url
      // data: {
      //   tweetId: tweetId
      // }
    })
  }

  return service;
});

app.controller('WorldController', function($scope, $state, TwitterFactory) {

  $scope.removeTweet = function(tweetId) {
    console.log('tweeting this ID', tweetId);
    TwitterFactory.removeTweet(tweetId)
      .success(function(info) {
        $state.reload();
        console.log('removed the tweet!', info);
      })
      .error(function() {
        console.log('error removing tweeet');
      })
  }

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
        $rootScope.rootUsername = userInfo.username;
        $rootScope.rootToken = userInfo.token;
        $state.go('home');
        // console.log('Random token and username:', userInfo);

      })
      .error(function(err) {
        console.log('LOGIN ERROR');
        $state.go('login');
      });
  }

});

app.controller('UserController', function($scope, TwitterFactory, $state, $rootScope, $stateParams) {

  $scope.username = $stateParams.username;

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

  $scope.unfollow = function(username) {
    console.log('I TRIED');
    TwitterFactory.unfollowUser(username)
      .success(function() {
        $scope.isFollowing = false;
        $state.reload();
        console.log('success unfollowing');
      })
      .error(function(err) {
        console.log('failed at unfollowing');
      })
  }

  $scope.follow = function(username) {
    TwitterFactory.followUser(username)
      .success(function(info) {
        $scope.isFollowing = true;
        $state.reload();
        console.log('THINK AGAIN!:', info);
        console.log('SUCCESS FOLLOWING!!');
      })
      .error(function() {
        console.log('encountered error following....');
      });
  }

  TwitterFactory.userProfile($scope.username)
    .success(function(allTweets) {
      console.log('profile tweets coming in!!::', allTweets);
      console.log('here is EVERYTHING COMING for you:::', allTweets.allTweets);

      $scope.username = allTweets.userInfo._id;
      $scope.numFollowing = allTweets.userInfo.following.length;
      $scope.numFollowers = allTweets.userInfo.followers.length;

      $scope.numTweets = allTweets.numUserTweets;

      $scope.allTweets = allTweets.allTweets;

      if ($rootScope.rootUsername) {
        var followers = allTweets.userInfo.followers;
        // check if user if currently following this person
        if (followers.indexOf($rootScope.rootUsername) > -1) {
          $scope.isFollowing = true;
        } else {
          $scope.isFollowing = false;
        }
        // followers.forEach(function(follower) {
        //   if
        // });
      } else {
        console.log('NOPE');
      }
    })
    .error(function(err) {
      console.log('oh no!!! error!!!', err.message);
    });
});
