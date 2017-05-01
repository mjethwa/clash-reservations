var oCookies = getCookies();
var oArguments = getArguments();
if (oArguments["resvCode"]) setCookie("resvCode", oArguments["resvCode"], oCookies);

var app = angular.module("reserveApp", ["ngRoute", "firebase"]);

//TODO: figure out why controller specified in config does not work
app.config(function ($routeProvider) {
    $routeProvider
        .when("/", { templateUrl: "templates/pages/home.html" })
        .when("/create-war", {
            templateUrl: "templates/pages/create-war.html"
        })
        .when("/join-war", {
            templateUrl: "templates/pages/join-war.html"
        })
        .when("/join-war", { templateUrl: "templates/pages/join-war.html" })
        .when("/war/:warCode", { templateUrl: "templates/pages/war-main.html" })
        .when("/war/:warCode/opponent/:opponentIndex", { templateUrl: "templates/pages/war-opponent.html" })
        .otherwise({ redirectTo: "/" })
});

app.filter('minutesDisplay', function () {
    return function (input, zeroStr) {
        if (!isFinite(input)) return input;

        // conditional based on optional argument
        if (input == 0 && zeroStr) {
            return zeroStr;
        }

        var mins = Math.floor(input / 60000);
        var out = '';
        if (mins >= 60) {
            out = out.concat(Math.floor(mins / 60).toString(), 'h ', (mins % 60).toString(), 'm');
        }
        else {
            out = out.concat(mins.toString(), 'm');
        }

        return out;
    };
});

app.directive('ratingStars', function () {
    return {
        scope: {
            iStars: '=stars'
        },
        templateUrl: 'templates/controls/rating-stars.html'
    };
});

app.directive('timerProgress', ["minutesDisplayFilter", function (minutesDisplayFilter) {
    return {
        scope: {
            iRemainingTime: '=remainingTime',
            iRemainingPerc: '=remainingPerc'
        },
        templateUrl: 'templates/controls/timer-progress.html'
    };
}]);

app.controller("reserveCtrl", ["$scope", "$route", "$routeParams", "$location", "$timeout", "$firebaseArray", "$firebaseObject",
    function ($scope, $route, $routeParams, $location, $timeout, $firebaseArray, $firebaseObject) {

        $scope.$route = $route;
        $scope.$location = $location;
        $scope.$routeParams = $routeParams;
        $scope.goNext = function (path) {
            $location.path(path);
        };


        $scope.blockUi = function () {
            $scope.bBlockUi = 1;
        };

        $scope.unBlockUi = function () {
            $scope.bBlockUi = 0;
        };

        $scope.setFbConfig = function (fbConfig) {
            setCookie("fb_apiKey", fbConfig.apiKey, oCookies);
            setCookie("fb_authDomain", fbConfig.authDomain, oCookies);
            setCookie("fb_databaseURL", fbConfig.databaseURL, oCookies);
            setCookie("fb_storageBucket", fbConfig.storageBucket, oCookies);
            setCookie("fb_messagingSenderId", fbConfig.messagingSenderId, oCookies);

            $scope.oFbConfig = fbConfig;
        };

        $scope.setResvCode = function (resvCode, mustExist) {
            if (!resvCode) return false;

            $scope.blockUi();


            if ($scope.bUseFb) {

                firebase.database().ref()
                    .child(resvCode)
                    .child('oWarInfo')
                    .once('value')
                    .then(function (snapshot) {
                        $scope.$apply(function () {
                            if (snapshot.val() !== null) {
                                var warInfo = snapshot.val();

                                $scope.oCommonData.sResvCode = resvCode;
                                setCookie("resvCode", resvCode, oCookies);

                                $scope.oWarInfo = $firebaseObject(firebase.database().ref()
                                    .child($scope.oCommonData.sResvCode)
                                    .child('oWarInfo'));

                                if (warInfo.oTimerType && warInfo.oTimerType.iTime) $scope.iAllocatedTime = warInfo.oTimerType.iTime;

                                $scope.loOpponents = $firebaseArray(firebase.database().ref()
                                    .child($scope.oCommonData.sResvCode)
                                    .child('loOpponents'));


                                //$scope.unBlockUi();
                            }

                            $scope.unBlockUi();
                        });
                    })
                    .catch(function (error) {
                        $scope.unBlockUi();
                    });


            }
            else {
                //$scope.unBlockUi();
                $scope.oCommonData.sResvCode = resvCode;
                setCookie("resvCode", resvCode, oCookies);

                $timeout($scope.unBlockUi, 5000); //simulate delay
            }

            $scope.goNext('/war/' +  resvCode);

            return true;
        };

        $scope.createResvCode = function (warInfo) {

            if (!isFinite(warInfo.oWarSize.iSize)) return false;

            $scope.blockUi();

            //create a copy to remove the invalid keys for now
            var oSafeWarInfo = {};
            oSafeWarInfo.sClanName = warInfo.sClanName;
            oSafeWarInfo.sOppositionClanName = warInfo.sOppositionClanName;
            if (warInfo.oWarInfo) {
                oSafeWarInfo.oWarSize = {};
                if (warInfo.oWarSize.iSize) oSafeWarInfo.oWarSize.iSize = warInfo.oWarSize.iSize;
                if (warInfo.oWarSize.sName) oSafeWarInfo.oWarSize.sName = warInfo.oWarSize.sName;
            }
            if (warInfo.oTimerType) {
                oSafeWarInfo.oTimerType = {};
                if (warInfo.oTimerType.sName) oSafeWarInfo.oTimerType.sName = warInfo.oTimerType.sName;
                if (warInfo.oTimerType.sType) oSafeWarInfo.oTimerType.sType = warInfo.oTimerType.sType;
                if (warInfo.oTimerType.iTime) oSafeWarInfo.oTimerType.iTime = warInfo.oTimerType.iTime;
            }

            $scope.oWarInfo = oSafeWarInfo;
            if (warInfo.oTimerType && warInfo.oTimerType.iTime) $scope.iAllocatedTime = warInfo.oTimerType.iTime;

            var oOpponentData = [];
            for (var i = 0; i < warInfo.oWarSize.iSize; i++) {
                oOpponentData.push({ iSeq: i, sOpponentName: "p".concat((i + 1).toString()), loResvs: [] });
            }
            $scope.loOpponents = oOpponentData;

            $scope.oCommonData.sResvCode = generateCode();
            setCookie("resvCode", $scope.oCommonData.sResvCode, oCookies);


            if ($scope.bUseFb) {
                firebase.database().ref()
                    .child($scope.oCommonData.sResvCode)
                    .child('oWarInfo')
                    //to and from json strips out internal keys
                    .set($scope.stripInvalidKeys($scope.oWarInfo))
                    .then(function () {

                        firebase.database().ref()
                            .child($scope.oCommonData.sResvCode)
                            .child('loOpponents')
                            //to and from json strips out internal keys
                            .set($scope.stripInvalidKeys($scope.loOpponents))
                            .then(function () {

                                $scope.oWarInfo = $firebaseObject(firebase.database().ref()
                                    .child($scope.oCommonData.sResvCode)
                                    .child('oWarInfo'));

                                $scope.loOpponents = $firebaseArray(firebase.database().ref()
                                    .child($scope.oCommonData.sResvCode)
                                    .child('loOpponents'));
                                $scope.unBlockUi();
                            })
                            .catch(function (error) {
                                $scope.unBlockUi();
                            });
                    })
                    .catch(function (error) {
                        $scope.unBlockUi();
                    });



                //firebase.database().ref().child($scope.oCommonData.sResvCode).set($scope.oWarInfo.sOppositionClanName);
                //firebase.database().ref().child($scope.oCommonData.sResvCode).child('oWarInfo').update($scope.oWarInfo);
            }
            else {
                //$scope.unBlockUi();
                $timeout($scope.unBlockUi, 5000); //simulate delay
            }

            $scope.goNext('/war/' +  $scope.oCommonData.sResvCode);
            return true;
        };

        $scope.stripInvalidKeys = function (obj) {

            var newObj = angular.fromJson(angular.toJson(obj));

            return newObj;
        };

        $scope.unsetResvCode = function () {
            $scope.oCommonData.sResvCode = null;
            //setCookie("resvCode", '');
            return true;
        };

        $scope.oCommonData = { sResvCode: null };

        $scope.setResvCode(oArguments["resvCode"], true);

        $scope.deriveFbServerTimeOffset = function () {
            firebase.database().ref()
                .child("iServerTime")
                .set(firebase.database.ServerValue.TIMESTAMP)
                .then(function () {
                    firebase.database().ref()
                        .child("iServerTime")
                        .once('value')
                        .then(function (snapshot) {
                            if (isFinite(snapshot.val())) {
                                $scope.iTimeOffset = snapshot.val() - (new Date()).getTime();

                                $timeout($scope.updateServerTime, 3600000);
                            }
                            else {
                                $timeout($scope.updateServerTime, 10000);
                            }
                        })
                        .catch(function (error) {
                            $timeout($scope.updateServerTime, 10000);
                        });

                })
                .catch(function (error) {
                    $timeout($scope.updateServerTime, 10000);
                });
        };

        $scope.updateServerTime = function () {
            var newVal = (new Date()).getTime();
            if (isFinite($scope.iTimeOffset)) newVal = newVal + ($scope.iTimeOffset);

            $scope.serverTime = newVal;
            $timeout($scope.updateServerTime, 60000);
        };
        $scope.updateServerTime(); //trigger the polling
        $scope.getServerTime = function () {
            //return (new Date()).getTime();
            return $scope.serverTime;
        };


        /*
        data_paths:
         
        {resvCode}/oWarInfo/sClanName
        {resvCode}/oWarInfo/sOppositionClanName
        {resvCode}/oWarInfo/oWarSize/iSize
        {resvCode}/oWarInfo/oWarSize/sName
        {resvCode}/oWarInfo/oTimerType/sName
        {resvCode}/oWarInfo/oTimerType/sType
        {resvCode}/oWarInfo/oTimerType/iTime

                                
        {resvCode}/loOpponents/{0-n}/iSeq 
        {resvCode}/loOpponents/{0-n}/sOpponentName
        {resvCode}/loOpponents/{0-n}/loResvs/{0-n}/iSeq
        {resvCode}/loOpponents/{0-n}/loResvs/{0-n}/sPlayerName
        {resvCode}/loOpponents/{0-n}/loResvs/{0-n}/iResult
        {resvCode}/loOpponents/{0-n}/loResvs/{0-n}/iResvTime
        */

        $scope.iAllocatedTime = 120 * 60 * 1000;


        $scope.oFbConfig = {
            apiKey: oCookies.fb_apiKey,
            authDomain: oCookies.fb_authDomain,
            databaseURL: oCookies.fb_databaseURL,
            storageBucket: oCookies.fb_storageBucket,
            messagingSenderId: oCookies.fb_messagingSenderId,
        };


        if ($scope.oFbConfig.apiKey && $scope.oFbConfig.databaseURL) {
            firebase.initializeApp($scope.oFbConfig);
            $scope.bUseFb = 1;
            $scope.deriveFbServerTimeOffset(); //trigger the polling                        
        }

        $scope.oWarInfo = MOCKUP.oWarInfo;

        $scope.loOpponents = MOCKUP.loOpponents;

        //configs
        $scope.loWarSizes = CONFIG.loWarSizes;
        $scope.loTimerTypes = CONFIG.loTimerTypes;
    }]);

app.controller("firebaseConfigCtrl", ["$scope", "$firebaseArray",
    function ($scope, $firebaseArray) {
        $scope.showConfig = function () {
            $scope.bShow = 1;
        };

        $scope.hideConfig = function () {
            $scope.bShow = 0;
        };


    }]);

app.controller("reserveInitCtrl", ["$scope", "$firebaseArray",
    function ($scope, $firebaseArray) {

        $scope.sInputResvCode = oCookies.resvCode;

        $scope.onCreateOption = function () {
            //$scope.sResvCode = generateCode();
            $scope.iPageMode = 1;
        };

        $scope.onJoinOption = function () {
            $scope.sInputResvCode = oCookies.resvCode;
            $scope.iPageMode = 2;
        }

        $scope.onCancelOption = function () {
            $scope.iPageMode = 0;
        };

        $scope.isOptionPending = function () {
            return (!$scope.iPageMode);
        };

        $scope.isOptionCreate = function () {
            return ($scope.iPageMode == 1);
        };

        $scope.isOptionJoin = function () {
            return ($scope.iPageMode == 2);
        };

        $scope.onCreateRequested = function (warInfo) {
            //$scope.oCommonData.sResvCode = generateCode();
            //$scope.setResvCode(generateCode(), false);
            $scope.createResvCode(warInfo);
        };

        $scope.onJoinRequested = function (resvCode) {
            //$scope.oCommonData.sResvCode = $scope.sInputResvCode;
            $scope.setResvCode(resvCode, true);
        };

    }]);


app.controller("reserveListCtrl", ["$scope", "$firebaseArray",
    function ($scope, $firebaseArray) {

        $scope.onLeaveOption = function () {
            $scope.onDeSelectOpponent();
            $scope.unsetResvCode();
        };

        $scope.onOpponentSelected = function (opponent) {
            if ($scope.oSelectedOpponent == opponent) {
                $scope.onDeSelectOpponent();
                return;
            }
            else {
                $scope.oSelectedOpponent = opponent;

                if ($scope.bUseFb) {
                    $scope.loEditResvs =
                        $firebaseArray(firebase.database().ref()
                            .child($scope.oCommonData.sResvCode)
                            .child('loOpponents')
                            .child($scope.oSelectedOpponent.$id)
                            .child('loResvs'));
                }
                else {
                    $scope.loEditResvs = $scope.oSelectedOpponent.loResvs;
                }
            }

        };
        $scope.onDeSelectOpponent = function () {
            $scope.onUpdateResvCancel();
            $scope.oSelectedOpponent = null;

            if ($scope.bUseFb) {
                if ($scope.loEditResvs) $scope.loEditResvs.$destroy();
            }
            $scope.loEditResvs = null;
        };

        $scope.onUpdateResvOption = function (resv) {
            $scope.oSelectedResv = resv;
            $scope.iStars = resv.iResult;
        };

        $scope.onIncrementStars = function () {
            if ($scope.iStars || $scope.iStars == 0) {
                if ($scope.iStars < 3) {
                    $scope.iStars = $scope.iStars + 1;
                }
            }
            else {
                $scope.iStars = 0;
            }
        };

        $scope.onDecrementStars = function () {
            if ($scope.iStars) {
                $scope.iStars = $scope.iStars - 1;
            }
            else {
                $scope.iStars = -1;
            }
        };

        $scope.onRemoveResvOption = function (resv) {

            if ($scope.bUseFb) { $scope.loEditResvs.$remove($scope.oSelectedResv); }

            $scope.oSelectedResv = null;
        };
        $scope.onAddResv = function (sName) {
            if (!sName) return false;

            if ($scope.bUseFb) {
                //$scope.loOpponents.$save($scope.oSelectedOpponent);
                $scope.loEditResvs.$add({ sPlayerName: sName, iResvTime: $scope.getServerTime(), iResult: -1 });
            }
            else {
                if (!$scope.oSelectedOpponent.loResvs) {
                    $scope.oSelectedOpponent.loResvs = [];
                    $scope.loEditResvs = $scope.oSelectedOpponent.loResvs;
                }
                var resvId = $scope.oSelectedOpponent.loResvs.length;
                $scope.oSelectedOpponent.loResvs.push({ iSeq: resvId, sPlayerName: sName, iResvTime: $scope.getServerTime(), iResult: -1 });

            }
            return true;
        };
        $scope.onSaveResv = function (resv) {
            //$scope.$apply();
            $scope.oSelectedResv.iResult = $scope.iStars;

            if ($scope.bUseFb) { $scope.loEditResvs.$save($scope.oSelectedResv); }

            $scope.oSelectedResv = null;
        };
        $scope.onRenewResv = function (resv) {
            $scope.oSelectedResv.iResvTime = $scope.getServerTime();

            if ($scope.bUseFb) { $scope.loEditResvs.$save($scope.oSelectedResv); }

            $scope.oSelectedResv = null;
        };
        $scope.onUpdateResvCancel = function (resv) {
            $scope.oSelectedResv = null;
        };

        $scope.getElapsedTime = function (resv) {
            return $scope.getServerTime() - resv.iResvTime;
        };

        $scope.getElapsedPercentage = function (resv) {
            var elapsedTime = $scope.getElapsedTime(resv);
            if (elapsedTime > $scope.iAllocatedTime) elapsedTime = $scope.iAllocatedTime;

            return Math.round(((elapsedTime * 1.0) / $scope.iAllocatedTime) * 100);
        };

        $scope.getRemainingTime = function (resv) {
            var elapsedTime = $scope.getElapsedTime(resv);

            if (elapsedTime > $scope.iAllocatedTime) return 0;

            return ($scope.iAllocatedTime - elapsedTime);
        };

        $scope.getRemainingPercentage = function (resv) {
            var remainingTime = $scope.getRemainingTime(resv);

            return Math.round(((remainingTime * 1.0) / $scope.iAllocatedTime) * 100);
        };

        $scope.isStarSet = function (starVal) {
            return (starVal >= 0);
        };

        $scope.getBestScore = function (opponent) {
            if (!opponent) return -1;
            if (!opponent.loResvs) return -1;

            var result = -1;

            if (Array.isArray(opponent.loResvs)) {
                for (var i = 0; i < opponent.loResvs.length; i++) {
                    if (opponent.loResvs[i].iResult > result) result = opponent.loResvs[i].iResult;
                }
            }
            else {
                angular.forEach(opponent.loResvs, function (value, key) {
                    if (value.iResult > result) result = value.iResult;
                });
            }

            return result;

        };


    }]);

