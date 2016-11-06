            var oCookies = getCookies();
            var oArguments = getArguments();
            if (oArguments["resvCode"]) setCookie("resvCode", oArguments["resvCode"], oCookies);

            var app = angular.module("reserveApp", ["firebase"]);

            app.filter('minutesDisplay', function() {
                return function(input, zeroStr) {
                    if (!isFinite(input)) return input;

                    // conditional based on optional argument
                    if (input == 0 && zeroStr) {
                        return zeroStr;
                    }

                    var out = '';
                    if (input >= 60) {
                        out = out.concat(Math.floor(input / 60).toString(), 'h ', (input % 60).toString(), 'm');
                    }
                    else {
                        out = out.concat(input.toString(), 'm');
                    }
                    
                    return out;
                };
            });

            app.directive('ratingStars', function() {
                return {
                    scope: {
                        iStars: '=stars'
                    },
                    templateUrl: 'templates/rating-stars.html'
                };
            });

            app.directive('timerProgress', ["minutesDisplayFilter", function(minutesDisplayFilter) {
                return {
                    scope: {
                        iRemainingMin: '=remainingMin',
                        iRemainingPerc: '=remainingPerc'
                    },
                    templateUrl: 'templates/timer-progress.html'
                };
            }]);

            app.controller("reserveCtrl", ["$scope", "$timeout", "$firebaseArray", "$firebaseObject",
                function ($scope, $timeout, $firebaseArray, $firebaseObject) {

                    $scope.blockUi = function() {
                        $scope.bBlockUi = 1;
                    };

                    $scope.unBlockUi = function() {
                        $scope.bBlockUi = 0;
                    };  

                    $scope.setFbConfig = function(fbConfig) {
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

                        $scope.oCommonData.sResvCode = resvCode;
                        setCookie("resvCode", resvCode, oCookies);

                        //$scope.unBlockUi();
                        $timeout($scope.unBlockUi, 5000); //simulate delay
                        return true;
                    };

                    $scope.createResvCode = function (warInfo) {

                        if (!isFinite(warInfo.oWarSize.iSize)) return false;

                        $scope.blockUi();
                        $scope.oWarInfo = warInfo;
                        if (warInfo.oTimerType.iMins) $scope.iAllocatedMinutes = warInfo.oTimerType.iMins;

                        var oOpponentData = [];
                        for (var i=0; i < warInfo.oWarSize.iSize ; i++) {
                            oOpponentData.push({ iSeq: i, sOpponentName: "p".concat( (i + 1).toString()) , loResvs: [] });
                        }   
                        $scope.loOpponents = oOpponentData;

                        $scope.oCommonData.sResvCode = generateCode();
                        setCookie("resvCode", $scope.oCommonData.sResvCode, oCookies);


                        if($scope.bUseFb) {
                            firebase.database().ref()
                                .child($scope.oCommonData.sResvCode)
                                .child('oWarInfo')
                                //to and from json strips out internal keys
                                .set(angular.fromJson(angular.toJson($scope.oWarInfo)))
                                .then(function() {
                                    $scope.oWarInfo = $firebaseObject(firebase.database().ref()
                                        .child($scope.oCommonData.sResvCode)
                                        .child('oWarInfo'));
                                })
                                .catch(function(error) {

                                });

                            firebase.database().ref()
                                .child($scope.oCommonData.sResvCode)
                                .child('loOpponents')
                                //to and from json strips out internal keys
                                .set(angular.fromJson(angular.toJson($scope.loOpponents)))
                                .then(function() {
                                    $scope.loOpponents = $firebaseObject(firebase.database().ref()
                                        .child($scope.oCommonData.sResvCode)
                                        .child('loOpponents'));
                                    $scope.unBlockUi();
                                })
                                .catch(function(error) {
                                    $scope.unBlockUi();
                                });                                

                            //firebase.database().ref().child($scope.oCommonData.sResvCode).set($scope.oWarInfo.sOppositionClanName);
                            //firebase.database().ref().child($scope.oCommonData.sResvCode).child('oWarInfo').update($scope.oWarInfo);
                        }
                        else {
                            //$scope.unBlockUi();
                            $timeout($scope.unBlockUi, 5000); //simulate delay
                        }


                        return true;
                    };                   

                    $scope.unsetResvCode = function () {
                        $scope.oCommonData.sResvCode = null;
                        //setCookie("resvCode", '');
                        return true;
                    };

                    $scope.oCommonData = { sResvCode: null };

                    $scope.setResvCode(oArguments["resvCode"], true);
                    
                    $scope.updateServerTime = function () {
                        var newVal = (new Date()).getTime();
                        if (isFinite($scope.iTimeOffset)) newVal = newVal + ($scope.iTimeOffset * 60000);

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
                    {resvCode}/oWarInfo/iWarSize
                    {resvCode}/oWarInfo/oWarSize/iSize
                    {resvCode}/oWarInfo/oWarSize/sName
                    {resvCode}/oWarInfo/sTimerType
                    {resvCode}/oWarInfo/oTimerType/sName
                    {resvCode}/oWarInfo/oTimerType/sType
                    {resvCode}/oWarInfo/oTimerType/iMins

                                            
                    {resvCode}/loOpponents/{0-n}/iSeq  //generated by firebase for Arrays
                    {resvCode}/loOpponents/{0-n}/sOpponentName
                    {resvCode}/loOpponents/{0-n}/loResvs/{0-n}/iSeq   //generated by firebase for Arrays
                    {resvCode}/loOpponents/{0-n}/loResvs/{0-n}/sPlayerName
                    {resvCode}/loOpponents/{0-n}/loResvs/{0-n}/iResult
                    {resvCode}/loOpponents/{0-n}/loResvs/{0-n}/iResvTime
                    */

                    $scope.iAllocatedMinutes = 120;


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
                    }
                                           
                    $scope.oWarInfo = {
                        sClanName:"Super Clanny",
                        sOppositionClanName:null,
                        oWarSize:{iSize:15, sName:"15 v 15"},
                        oTimerType:{sName:"Fixed 1 Hour" ,sType:"fixed", iMins:60}
                    };
                                           
                    $scope.loOpponents = [
                        { iSeq: 0, sOpponentName: "p1", loResvs: [{ iSeq: 0, sPlayerName: "Joe", iResult: 2, iResvTime: $scope.getServerTime() }, { iSeq: 1, sPlayerName: "James", iResult: -1, iResvTime: $scope.getServerTime() }] },
                        { iSeq: 1, sOpponentName: "p2", loResvs: [{ iSeq: 0, sPlayerName: "Joe", iResult: 0, iResvTime: $scope.getServerTime() }, { iSeq: 1, sPlayerName: "James", iResult: -1, iResvTime: $scope.getServerTime() }] },
                        { iSeq: 2, sOpponentName: "p3", loResvs: [] },
                        { iSeq: 3, sOpponentName: "p4", loResvs: [{ iSeq: 0, sPlayerName: "Joe", iResult: 1, iResvTime: $scope.getServerTime() }] },
                        { iSeq: 4, sOpponentName: "p5" },
                        { iSeq: 5, sOpponentName: "p6", loResvs: [{ iSeq: 0, sPlayerName: "Jim", iResult: 1, iResvTime: $scope.getServerTime() }, { iSeq: 1, sPlayerName: "John", iResult: -1, iResvTime: $scope.getServerTime() }] },
                        ];
                       
                    //configs
                    $scope.loWarSizes = [
                        {iSize:10, sName:"10 v 10"},
                        {iSize:15, sName:"15 v 15"},
                        {iSize:20, sName:"20 v 20"},
                        {iSize:25, sName:"25 v 25"},
                        {iSize:30, sName:"30 v 30"},
                        {iSize:40, sName:"40 v 40"},
                        {iSize:50, sName:"50 v 50"}
                        ];
                    $scope.loTimerTypes = [
                        {sName:"Fixed 30 Mins" ,sType:"fixed", iMins:30},
                        {sName:"Fixed 1 Hour" ,sType:"fixed", iMins:60},
                        {sName:"Fixed 2 Hours" ,sType:"fixed", iMins:120},
                        {sName:"Fixed 3 Hours" ,sType:"fixed", iMins:180},
                        {sName:"Fixed 4 Hours" ,sType:"fixed", iMins:240},
                        {sName:"Fixed 5 Hours" ,sType:"fixed", iMins:300},
                        {sName:"Fixed 6 Hours" ,sType:"fixed", iMins:360},
                        {sName:"Fixed 12 Hours" ,sType:"fixed", iMins:720},
                        {sName:"Fixed 24 Hours" ,sType:"fixed", iMins:1440}
                        ];
 
                }]);

            app.controller("firebaseConfigCtrl", ["$scope", "$firebaseArray",
                function ($scope, $firebaseArray) {
                    $scope.showConfig = function() {
                        $scope.bShow = 1;
                    };
                    
                    $scope.hideConfig = function() {
                        $scope.bShow = 0;
                    };


                }]);

            app.controller("reserveInitCtrl", ["$scope", "$firebaseArray",
                function ($scope, $firebaseArray) {


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

                    $scope.onJoinRequested = function () {
                        //$scope.oCommonData.sResvCode = $scope.sInputResvCode;
                        $scope.setResvCode($scope.sInputResvCode, true);
                    };

                }]);


            app.controller("reserveListCtrl", ["$scope", "$firebaseArray",
                function ($scope, $firebaseArray) {

                    $scope.onLeaveOption = function () {                     
                        $scope.onDeSelectOpponent();
                        $scope.unsetResvCode();
                    };

                    $scope.onOpponentSelected = function (opponent) {
                        $scope.oSelectedOpponent = ($scope.oSelectedOpponent == opponent ? null : opponent);
                    };
                    $scope.onDeSelectOpponent = function () {
                        $scope.onUpdateResvCancel();
                        $scope.oSelectedOpponent = null;
                    };

                    $scope.onUpdateResvOption = function (resv) {
                        $scope.oSelectedResv = (resv == $scope.oUpdateResv ? null : resv);
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

                    };
                    $scope.onAddResv = function (sName) {
                        if (!$scope.oSelectedOpponent.loResvs) $scope.oSelectedOpponent.loResvs = [];
                        var resvId = $scope.oSelectedOpponent.loResvs.length;
                        $scope.oSelectedOpponent.loResvs.push({ iSeq: resvId, sPlayerName: sName, iResvTime: $scope.getServerTime(), iResult: -1 });
                    };
                    $scope.onSaveResv = function (resv) {
                        //$scope.$apply();
                        $scope.oSelectedResv.iResult = $scope.iStars;
                        $scope.oSelectedResv = null;
                    };
                    $scope.onRenewResv = function (resv) {
                        $scope.oSelectedResv.iResvTime = $scope.getServerTime();
                        $scope.oSelectedResv = null;
                    };
                    $scope.onUpdateResvCancel = function (resv) {
                        $scope.oSelectedResv = null;
                    };

                    $scope.getElapsedMinutes = function (resv) {
                        return Math.floor(($scope.getServerTime() - resv.iResvTime) / 60000);
                    };

                    $scope.getElapsedPercentage = function (resv) {
                        var mins = $scope.getElapsedMinutes(resv);
                        if (mins > $scope.iAllocatedMinutes) mins = $scope.iAllocatedMinutes;

                        return Math.round(((mins * 1.0) / $scope.iAllocatedMinutes) * 100);
                    };

                    $scope.getRemainingMinutes = function (resv) {
                        var minsElapsed = $scope.getElapsedMinutes(resv);

                        if (minsElapsed > $scope.iAllocatedMinutes) return 0;

                        return ($scope.iAllocatedMinutes - minsElapsed);
                    };

                    $scope.getRemainingPercentage = function (resv) {
                        var mins = $scope.getRemainingMinutes(resv);

                        return Math.round(((mins * 1.0) / $scope.iAllocatedMinutes) * 100);
                    };                    

                    $scope.isStarSet = function (starVal) {
                        return (starVal >= 0);
                    };


                }]);

