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
  })
  .state({
    name: "search",
    url: "/search/{search_keyword}",
    templateUrl: "templates/search_results.html",
    controller: "SearchResultsController"
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

    // check the token expiration date, only keep their session if not expired
    // else, log the user out of the session
    // var expDate = $cookies.getObject('cookieData').token.expires;
    // console.log('expires?', expDate);
    // console.log('TYPE?', typeof expDate);

    // if so, then reassign the $rootScope variables

    // update the likes array
    // var data = $cookies.getObject('cookieData');
    $rootScope.rootUsername = $cookies.getObject('cookieData')._id;
    $rootScope.rootToken = $cookies.getObject('cookieData').token;
    $rootScope.rootLikes = $cookies.getObject('cookieData').likes;
    // data.likes = ...
    // $cookies.putObject('cookieData', data);
    console.log('WHO I LIKES::', $rootScope.rootLikes);
    console.log('who is the root User??', $rootScope.rootUsername);
  }

  // LOGOUT
  $rootScope.rootLogout = function() {
    console.log('this is the token you want', $rootScope.rootToken.token);
    // delete token
    var url = "/api/logout/" + $rootScope.rootToken.token;
    return $http({
      method: 'DELETE',
      url: url
    })
    .success(function(message) {
      console.log('the message!!', message);
      // reset all the $rootScope variables to null
      $rootScope.rootUsername = null;
      $rootScope.rootToken = null;
      $rootScope.rootLikes = null;
      $rootScope.factoryCookieData = null;
      // kill the cookies
      $cookies.remove('cookieData');
      // redirect to home page
      $state.go('home');
    });

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
    console.log('nEW SIGNUP:', signupInfo)
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
    });
  }

  service.removeTweet = function(tweetId) {
    console.log('remove PLEASEEEE', tweetId);
    var url = '/api/remove/' + tweetId;
    return $http({
      method: 'DELETE',
      url: url
    });
  }

  service.updateLikes = function(isLiked, tweetId) {
    var url = '/api/edit/likes';
    return $http({
      method: 'PUT',
      url: url,
      data: {
        isLiked: isLiked,
        tweetId: tweetId,
        username: $rootScope.rootUsername
      }
    });
  }

  service.updateRootLikes = function(likes) {


    console.log('I KNOW WHO I AM for real!!!!', likes.likes);

    console.log('BEFORE COOKIE::', $cookies.getObject('cookieData'));

    var data = $cookies.getObject('cookieData');

    data.likes = likes.likes;

    $cookies.remove('cookieData');

    $cookies.putObject('cookieData', data);

    var newCookies = $cookies.getObject('cookieData');


    console.log('DATA COOKIES::', data);
    console.log('NEW COOKIES::', newCookies);

    // var data = $cookies.getObject('cookieData');
    //
    // // data.likes = likes;
    //
    // console.log('COOKIES LIKES this data ::', data);
    //
    // $cookies.putObject('cookieData', data);
    //
    $rootScope.rootLikes = $cookies.getObject('cookieData').likes;
    //
    // console.log('UPDATED COOKIE::', $cookies.getObject('cookieData'));
  }

  service.search = function(search_keyword) {
    var url = '/api/search/' + search_keyword;
    return $http({
      method: 'GET',
      url: url
    });
  }

  service.retweeting = function(retweetId) {
    var url = '/api/retweet';
    return $http({
      method: 'POST',
      url: url,
      data: {
        retweetId: retweetId,
        username: $rootScope.rootUsername
      }
    })
  }

  return service;
});

// Search Controller
app.controller('SearchController', function($scope, $rootScope, $stateParams, $state, TwitterFactory) {

  $scope.searchResults = function(searchQuery) {
    console.log(' the search query::', $scope.searchQuery)
    $state.go('search', { 'search_keyword': searchQuery });
  }

})

// Search Results controller
app.controller('SearchResultsController', function($scope, $stateParams, $rootScope, TwitterFactory) {
  // console.log('state prarams::', $stateParams);

  $scope.search = $stateParams.search_keyword;

  console.log('state prarams::', $scope.search);

  TwitterFactory.search($scope.search)
    .success(function(info) {
      // $state.reload();
      $scope.allUsers = info.allUsers;
      console.log('search results!', info.allUsers);
    })
    .error(function() {
      console.log('error searching!!');
    })
})

app.controller('WorldController', function($scope, $rootScope, $state, TwitterFactory) {
  console.log('rootyyy:', $rootScope.rootUsername);

  $scope.retweet = function(tweetId) {
    if ($rootScope.rootUsername) {
      TwitterFactory.retweeting(tweetId)
        .success(function(results) {
          console.log('retweeting results::', results);
          $state.reload();
        })
        .error(function() {
          console.log('error retweeting.....');
        });
    } else {
      $state.go('login');
    }
  }

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

  $scope.likeTweet = function(isLiked, tweetId) {
    if ($rootScope.rootUsername) {
      TwitterFactory.updateLikes(isLiked, tweetId)
        .success(function(likes) {
          console.log('sucess liking!!', likes);
          TwitterFactory.updateRootLikes(likes);
          $state.reload();
          // console.log('root likes:', $rootScope.rootLikes);
          // console.log('root username:', $rootScope.rootUsername);
        })
        .error(function(err) {
          console.log('error liking!!');
        });
    } else {
      $state.go('login');
    }
  }

  TwitterFactory.allTweets()
    .success(function(allTweets) {
      console.log('here is all the tweets for you:::', allTweets);
      $scope.allTweets = allTweets.allTweets;
      console.log('TWEETETETE', $rootScope.rootLikes);
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
        password: $scope.password,
        firstName: $scope.firstName,
        lastName: $scope.lastName,
        email: $scope.email
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
        console.log('LOGEED IN OBJECT!!!!!! IMPOTENT!!!:', userInfo);
        $cookies.putObject('cookieData', userInfo.userInfo)
        // store user login infor in $rootScope variables


        $rootScope.rootUsername = userInfo.username;
        $rootScope.rootLikes = userInfo.userInfo.likes;
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

  $scope.retweet = function(tweetId) {
    if ($rootScope.rootUsername) {
      TwitterFactory.retweeting(tweetId)
        .success(function(results) {
          console.log('retweeting results::', results);
          $state.reload();
        })
        .error(function() {
          console.log('error retweeting.....');
        });
    } else {
      $state.go('login');
    }
  }

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

  $scope.likeTweet = function(isLiked, tweetId) {
    if ($rootScope.rootUsername) {
      TwitterFactory.updateLikes(isLiked, tweetId)
        .success(function(likes) {
          console.log('success liking!!', likes);
          TwitterFactory.updateRootLikes(likes);
          $state.reload();
          console.log('root likes:', $rootScope.rootLikes);
          console.log('root username:', $rootScope.rootUsername);
        })
        .error(function(err) {
          console.log('error liking!!');
        });
    } else {
      $state.go('login');
    }
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
    if ($rootScope.rootUsername) {
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
    } else {
      $state.go('login');
    }
  }

  TwitterFactory.userProfile($scope.username)
    .success(function(allTweets) {
      console.log('profile tweets coming in!!::', allTweets);
      console.log('here is EVERYTHING COMING for you:::', allTweets.allTweets);

      $scope.username = allTweets.userInfo._id;
      $scope.numFollowing = allTweets.userInfo.following.length;
      $scope.numFollowers = allTweets.userInfo.followers.length;
      $scope.numLikes = allTweets.userInfo.likes.length;

      $scope.numTweets = allTweets.numUserTweets;

      $scope.allTweets = allTweets.allTweets;
      console.log('username?', $scope.username);
      console.log('rootScope???', $rootScope.rootUsername);
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
