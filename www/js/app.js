/*  DESTINY GAME MOBILE APPLICATION TO SEARCH CLAN MEMBERS AND DISPLAY THEIR CURRENT STATUS
    MIKKO "RINIK" VIHERVUORI
    MAIL: MIKKO.VIHERVUORI@GMAIL.COM / RINIK@RINIK.FI
*/

// AngularJS slash Ionic create application and introduce dependencies
var app = angular.module('dstnapp', ['ionic', 'LocalStorageModule'])

// Prepare ionicPlatform
.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {

      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

// Configure localStorage to store API Key
app.config(function (localStorageServiceProvider) {
    localStorageServiceProvider
      .setPrefix('dstnapp'); // Prefix for the saved data
  });

// The main controller for dsntapp initialize used functions that are used in application
app.controller('main', function ($scope, $http, $ionicModal, $ionicPopup, localStorageService) {

  // Allocate some variables
  var apiData = "X-API-Key"; // When save to local storage get save as X-API-Key value
  var proxySettings = "proxy"; //
  var crucibleData = "crucible";
  $scope.apiKey = ""; // Just empty string to start
  $scope.httpConfig =""; // Same as above
  $scope.memberData = []; // Empty array
  $scope.search = "search-hide"; // Search CSS-class for waiting icon (spinner), default is hide spinner
  $scope.clickCount = 0; // Just for the easter egg.
  $scope.useProxy = {}; // Empty object for proxySettings.

  //Show hidden info screen (easter egg).
  $scope.showInfo = function() {
    $scope.clickCount += 1;
    if($scope.clickCount == 5) {
      $scope.clickCount = 0;
      $scope.showHiddenInfo();
    }
  }

  // Create modal for storing API Key
  $ionicModal.fromTemplateUrl('dstn-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.newDstnModal = modal;
  });
  // show API Key storing page
  $scope.openDstnModal = function() {
    $scope.newDstnModal.show();
    $scope.getProxy();
    $scope.getCrucible();
  };

  // close API Key storing page
  $scope.closeDstnModal = function() {
    $scope.newDstnModal.hide();
    // Just to make sure that class stays hidden (2/3 there's weird function that show's search spinner after saving API Key to local storage)
    $scope.setProxy();
    $scope.setCrucible();
    $scope.search = "search-hide";
  };

  // Alerts to show some info example missing API Key or too short search string.
  // Missing API Key alert
  $scope.showApiAlert = function() {
    var alertPopup = $ionicPopup.alert({
      title: 'Invalid API Key',
      template: 'Please check your API Key'
    });

    alertPopup.then(function(res) {
      // This is not necessary and only for debugging purposes
      console.log('X-API-Key is wrong length');
      console.log($scope.apiKey.length);
    });
  }

  // Trying to search with too short string alert
  $scope.showClanAlert = function(data) {
    var alertPopup = $ionicPopup.alert({
      title: 'Clan name not valid',
      template: 'Please check search string it\'s just ' + data + ' characters long.'
    });

    alertPopup.then(function(res) {
      // This is not necessary and it's only for debugging purposes
      console.log('Clan name not valid');
    });
  }

  // Show alert if the return from the server is null
  $scope.showClanNull = function(data) {
    var alertPopup = $ionicPopup.alert({
      title: 'Clan name not valid',
      template: 'Please check that your search is valid clan name.'
    });

    alertPopup.then(function(res) {
      // This is not necessary and it's only for debugging purposes
      $scope.memberData = [];
      console.log('Clan name not valid it was null');
      console.log(data);
    });
  }

  // Show easter egg and displays info screen.
  $scope.showHiddenInfo = function(data) {
    var alertPopup = $ionicPopup.alert({
      title: 'DSTN.ninja APP',
      template: 'DSTN.ninja mobile app is early development stage. For testing there is \"dummy\" that populate array with just one user.'
    });
    alertPopup.then(function(res) {
    });
  }

  // get API Key from local storage
  $scope.getAPIKey = function() {
    if(localStorageService.get(apiData)) {
      $scope.apiKey = localStorageService.get(apiData);
    } else {
      $scope.apiKey = "";
    }
    return $scope.apiKey;
  }

  // set Api Key to local storage
  $scope.setAPIKey = function(data) {
    $scope.apiKey = data;
    localStorageService.set(apiData, $scope.apiKey);
    $scope.newDstnModal.hide();
  }

  // set proxy status for local storage
  $scope.setProxy = function() {
    localStorageService.set(proxySettings, $scope.useProxy);
  }

  // get proxy status from local storage
  $scope.getProxy = function() {
    if(localStorageService.get(proxySettings)) {
      $scope.useProxy = localStorageService.get(proxySettings);
    } else {
      localStorageService.set(proxySettings, { "text": "Use own proxy server", "checked": false });
    }
  }

  // set crucible status to local storage
  $scope.setCrucible = function() {
    localStorageService.set(crucibleData, $scope.displayCrucible);
  }

  // set crucible status to local storage
  $scope.getCrucible = function() {
    if(localStorageService.get(crucibleData)) {
      $scope.displayCrucible = localStorageService.get(crucibleData);
    } else {
      localStorageService.set(crucibleData, { "text": "Display crucible", "checked": false });
    }
  }

  // Check memberdata and delete XBOX One stats
  $scope.checkMember = function(data) {
    var tempData = JSON.parse(JSON.stringify(data));
    if(tempData[0]["destinyAccounts"].length == 2) {
      console.log("Found XBOX One account, Deleting XBOX One Account stats!");
      tempData[0]["destinyAccounts"].shift();
    } else if (tempData[0]["bungieNetUser"]["psnDisplayName"] == null){
      console.log("No psnDisplayName not adding user.");
      return 2; // It's good practice to return something and you can catch error when code returns something. It could be false but I decieded to return 2.
    }
    if($scope.displayCrucible.checked == true && $scope.useProxy == true) {
      $scope.checkCrucible(tempData[0]["bungieNetUser"]["psnDisplayName"]);
    }
    return tempData;
  }

  // Get Crucible data from API
  $scope.checkCrucible = function(data) {
    var crucibleTemp = data;
    $http.get("http://localhost/proxy/?crucible=" + data).success(function (result) {
      // returns Crucible score from psnDisplayName
      //$scope.crucible[$scope.psnDisplayName] = result;
      $scope[crucibleTemp] = result;
      return true;
    });
  }

  // Generate dummyData for testing purposes
  $scope.generateDummy = function(data) {
    if (data !== null) {
      $scope.memberData = $scope.dummyData;
      return true;
    } else {
      return 2; // It's good practice to return something and you can catch error when code returns something. It could be false but I decieded to return 2.
    }
  }

  // create HTTP header for $http.get function
  $scope.setHTTPConfig = function() {
    $scope.httpConfig = {
      headers: {
        'X-API-Key': $scope.apiKey,
        'Accept': 'application/json'
      },
    };
  }

  // return HTTP header
  $scope.getHTTPConfig = function() {
    return $scope.httpConfig;
  }

  // Ask Clan ID number from Bungie API
  $scope.getClanId = function(data) {
    if ($scope.apiKey.length < 31 && data !== null) {
      $scope.showApiAlert();
      return 2;
    } else {
      $scope.setHTTPConfig();
      $scope.getCurrentPosition();
      $http.get("http://www.bungie.net/platform/Group/Name/" + encodeURI(data) +"/", $scope.httpConfig).success(function (result) {
        result = JSON.parse(result);
        return result["Response"]["detail"]["groupId"];
      });
      
    }
  }

  // Ask Clan Members from Bungie API
  $scope.getClanMembers = function(data) {
    var members = [];
    if (!isNaN(data) == true) {
      $http.get("http://www.bungie.net/platform/Group/Name/" + data + "/MembersV3/?currentPage=1", $scope.httpConfig).success(function (result) {
        for(i=0; i < result["Response"]["results"].length; i++) {
          members.push(result["Response"]["results"][i]["user"]["membershipId"]);
        }
        return members;
      });
    } else {
      console.log("Error in Clan ID, not a number!")
      return 2;
    }
  }

  // Ask single Clan Member stats from Bungie API
  $scope.getMemberStats = function(data) {
    if (!isNaN(data) == true) {
      $http.get("https://www.bungie.net/platform/User/GetBungieAccount/" + data + "/254/", $scope.httpConfig).success(function (result) {
        result = JSON.parse(result);
        return result;
      });
    } else {
      console.log("Error in Member ID, not a number!")
        return 2;
    }
  }

  // Use the proper function for clan search if $scope.useProxy.checked status is true or false
  $scope.userSearch = function(data) {
    if($scope.useProxy.checked == true) {
      $scope.getAllMembersProxy(data);
    } else {
      $scope.getAllMembersBungie(data);
    }
  }

  // Gather all the Clan Member data in single function
  $scope.getAllMembersBungie = function(data) {
    $scope.search = "search-show";
    if ($scope.apiKey.length < 31 && data !== null) {
      $scope.showApiAlert();
      return 2;
      if (data !== null) {
        if (data == "dummy") {
          $scope.generateDummy(data);
          $scope.search = "search-hide";
        } else {
          var clanId = $scope.getClanId(data);
          if(clanId == 0 || clanId == null) {
            $scope.showClanNull();
            return 2;
          } else {
            var clanMembers = $scope.getClanMembers(clanId);
            for (i=0; i < clanMembers.length; i++) {
              var member = $scope.checkMember(clanMembers[i]);
              if(member == 2) {
              } else {
                $scope.memberData.push(member);
              }
            }
            return true;
          }
        }
        } else if(data == null) {
          data = "";
        }
        $scope.showClanAlert(data.length);
        $scope.search = "search-hide";
        return 2; 
    }
  }

  // use destiny-proxy (github.com/rinik/destiny-proxy) to get result
  $scope.getAllMembersProxy = function(data) {
    $scope.search = "search-show";
    if ($scope.apiKey.length < 31 && data !== null) {
      $scope.showApiAlert();
      console.log($scope.apiKey.length);
      return 2; // It's good practice to return something and you can catch error when code returns something. It could be false but I decieded to return 2.
    } else {
      // if search string "dummy" populate memberData with dummyData
      if (data == "dummy") {
        $scope.generateDummy(data);
        $scope.search = "search-hide";
        // check the data if it's null create just empty string that the lenght property doesn't create error
      } else if(data == null || data.length < 4) {
        if (data == null) {
          data = "";
        }
        $scope.showClanAlert(data.length);
        $scope.search = "search-hide";
      } else {
        $scope.getPosition();
        $http.get("http://localhost/proxy/?clan=" + encodeURI(data.trim())).success(function(result) {
          if(result.length == 0 || result == null) {
            // Return error if the result is null or ""
            $scope.showClanNull();
          } else {
            // successful result returns clanId
            $scope.clanId = result;
          }
          
          $http.get("http://localhost/proxy/?members=" + $scope.clanId).success(function(result) {
            // successful result returns clan members in array
            $scope.members = result;
            // if already searched for clan, clear memberData before new array push, just for clear view
            $scope.memberData = [];
            // Hide the search spinner when first result is ready to display
            $scope.search = "search-hide";
            for (i=0; i < $scope.members.length; i++) {
              $http.get("http://localhost/proxy/?member=" + $scope.members[i]).success(function(result) {
                // Check the result for XBOX One accounts and empty psnDisplayName value
                var data = $scope.checkMember(result);
                if (data == 2) { // Here is a use case that $scope.checkMember returns error and we can catch it and use it (That's some fine piece of code;)
                  // don't add memberData because there is no psnDisplayName.
                } else {
                  // push successful result to array
                  $scope.memberData.push(data);
                }

            })
            }
          })
        })
      }
    }
  }

  // DUMMY data from testing purposes
  $scope.dummyData = [[{"destinyAccounts":[{"userInfo":{"iconPath":"\/common\/destiny_content\/icons\/f6d93da5c78db95e1b390ddb1ff6fcc7.jpg","membershipType":2,"membershipId":"4611686018440976513","displayName":"rinik_fin"},"grimoireScore":4715,"characters":[{"characterId":"2305843009323915257","raceHash":898834093,"genderHash":2204441813,"classHash":3655393761,"emblemHash":2686650663,"race":{"raceHash":898834093,"raceType":2,"raceName":"Exo","raceNameMale":"Exo Male","raceNameFemale":"Exo Female","raceDescription":"Self-aware machines built for a long-forgotten war.","hash":898834093,"index":0,"redacted":false},"gender":{"genderHash":2204441813,"genderType":1,"genderName":"Female","genderDescription":"","hash":2204441813,"index":0,"redacted":false},"characterClass":{"classHash":3655393761,"classType":0,"className":"Titan","classNameMale":"Titan","classNameFemale":"Titan","classIdentifier":"CLASS_TITAN","mentorVendorIdentifier":"VENDOR_TITAN_MENTOR","hash":3655393761,"index":0,"redacted":false},"emblemPath":"\/common\/destiny_content\/icons\/f6d93da5c78db95e1b390ddb1ff6fcc7.jpg","backgroundPath":"\/common\/destiny_content\/icons\/45f0b7108a1fe8ce5adadd9700bbb9db.jpg","level":40,"powerLevel":366,"dateLastPlayed":"2016-10-26T19:34:28Z","membershipId":"4611686018440976513","membershipType":2,"levelProgression":{"dailyProgress":0,"weeklyProgress":0,"currentProgress":346000,"level":40,"step":0,"progressToNextLevel":0,"nextLevelAt":0,"progressionHash":1716568313},"isPrestigeLevel":false,"genderType":1,"classType":0,"percentToNextLevel":0,"currentActivityHash":0},{"characterId":"2305843009270717677","raceHash":3887404748,"genderHash":2204441813,"classHash":2271682572,"emblemHash":2686650663,"race":{"raceHash":3887404748,"raceType":0,"raceName":"Human","raceNameMale":"Human Male","raceNameFemale":"Human Female","raceDescription":"Human","hash":3887404748,"index":0,"redacted":false},"gender":{"genderHash":2204441813,"genderType":1,"genderName":"Female","genderDescription":"","hash":2204441813,"index":0,"redacted":false},"characterClass":{"classHash":2271682572,"classType":2,"className":"Warlock","classNameMale":"Warlock","classNameFemale":"Warlock","classIdentifier":"CLASS_WARLOCK","mentorVendorIdentifier":"VENDOR_WARLOCK_MENTOR","hash":2271682572,"index":0,"redacted":false},"emblemPath":"\/common\/destiny_content\/icons\/f6d93da5c78db95e1b390ddb1ff6fcc7.jpg","backgroundPath":"\/common\/destiny_content\/icons\/45f0b7108a1fe8ce5adadd9700bbb9db.jpg","level":40,"powerLevel":365,"dateLastPlayed":"2016-10-21T16:33:10Z","membershipId":"4611686018440976513","membershipType":2,"levelProgression":{"dailyProgress":0,"weeklyProgress":0,"currentProgress":346000,"level":40,"step":0,"progressToNextLevel":0,"nextLevelAt":0,"progressionHash":1716568313},"isPrestigeLevel":false,"genderType":1,"classType":2,"percentToNextLevel":0,"currentActivityHash":0},{"characterId":"2305843009253107185","raceHash":3887404748,"genderHash":3111576190,"classHash":671679327,"emblemHash":185564349,"race":{"raceHash":3887404748,"raceType":0,"raceName":"Human","raceNameMale":"Human Male","raceNameFemale":"Human Female","raceDescription":"Human","hash":3887404748,"index":0,"redacted":false},"gender":{"genderHash":3111576190,"genderType":0,"genderName":"Male","genderDescription":"","hash":3111576190,"index":0,"redacted":false},"characterClass":{"classHash":671679327,"classType":1,"className":"Hunter","classNameMale":"Hunter","classNameFemale":"Hunter","classIdentifier":"CLASS_HUNTER","mentorVendorIdentifier":"VENDOR_HUNTER_MENTOR","hash":671679327,"index":0,"redacted":false},"emblemPath":"\/common\/destiny_content\/icons\/4ddc836fe272a8c377635fa6cfa1d7a9.jpg","backgroundPath":"\/common\/destiny_content\/icons\/580b6d043f3f977531477a690a2771d9.jpg","level":40,"powerLevel":370,"dateLastPlayed":"2016-10-16T12:15:16Z","membershipId":"4611686018440976513","membershipType":2,"levelProgression":{"dailyProgress":0,"weeklyProgress":0,"currentProgress":346000,"level":40,"step":0,"progressToNextLevel":0,"nextLevelAt":0,"progressionHash":1716568313},"isPrestigeLevel":false,"genderType":0,"classType":1,"percentToNextLevel":0,"currentActivityHash":0}],"lastPlayed":"0001-01-01T00:00:00Z","versions":15}],"bungieNetUser":{"membershipId":"8777511","uniqueName":"Rinik","displayName":"Rinik","profilePicture":70607,"profileTheme":54,"userTitle":0,"successMessageFlags":"1","isDeleted":false,"about":"I solemnly swear that I am up to no good...","firstAccess":"2014-11-25T06:46:49.729Z","lastUpdate":"2016-09-26T17:31:12.711Z","psnDisplayName":"rinik_fin","showActivity":true,"locale":"en","localeInheritDefault":true,"showGroupMessaging":true,"profilePicturePath":"\/img\/profile\/avatars\/bungie_day_15_20.jpg","profileThemeName":"septagon","userTitleDisplay":"Newbie","statusText":"","statusDate":"2015-07-08T06:55:58.189Z"},"clans":[{"groupId":"811629","platformType":2}],"relatedGroups":{"811629":{"groupId":"811629","name":"Super Potato Bros","membershipIdCreated":"8537418","creationDate":"2015-02-07T15:19:23.034Z","modificationDate":"2016-10-07T21:00:41.004Z","groupType":0,"about":"Finnish PVP & raiding clan driven to conquer every obstacle, with teamwork, efficiency & accuracy. We will terminate our enemies with extreme prejudice. What is essential in war is victory, not prolonged operations. -Sun Tzu","isDeleted":false,"tags":["#PvP","#Raid","#pve","#crusible","#Trials_of_Osiris","#potato"],"rating":83,"ratingCount":10,"memberCount":10,"pendingMemberCount":0,"isPublic":true,"isMembershipClosed":false,"isMembershipReviewed":true,"isPublicTopicAdminOnly":false,"primaryAlliedGroupId":"0","motto":"What is essential in war is victory, not prolonged operations.","clanCallsign":"SuPB","allowChat":true,"isDefaultPostPublic":false,"isDefaultPostAlliance":false,"chatSecurity":0,"locale":"en","avatarImageIndex":60065,"founderMembershipId":"8537418","homepage":0,"membershipOption":0,"defaultPublicity":2,"theme":"Group_Director","bannerPath":"\/img\/Themes\/Group_Director\/struct_images\/group_top_banner.jpg","avatarPath":"\/img\/profile\/avatars\/group\/gca4.png","isAllianceOwner":true,"conversationId":"8882754","clanReviewType":0,"enableInvitationMessagingForAdmins":true,"banExpireDate":"2001-01-01T00:00:00Z"}},"destinyAccountErrors":[]}]];

});