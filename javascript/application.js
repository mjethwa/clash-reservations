            var oCookies = getCookies();
            var oArguments = getArguments();
            console.log(oArguments["resvCode"]);

            var app = angular.module("reserveApp", ["firebase"]);

            app.constant('RESERVE_CONST',{
                STARS_PENDING = -1,
                
            });

            app.filter('minutesDisplay', function() {
                return function(input, zeroStr) {
                    if (!isFinite(input)) return input;

                    // conditional based on optional argument
                    if (input == 0 && zeroStr) {
                        return zeroStr;
                    }

                    var out = null;
                    if (input > 60) {
                        out = Math.floor(input / 60).toString() + 'h ' + (input % 60).toString() + 'm';
                    }
                    else {
                        out = input.toString() + 'm';
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

            app.controller("reserveCtrl", ["$scope", "$timeout", "$firebaseArray",
                function ($scope, $timeout, $firebaseArray) {
                    $scope.setResvCode = function (resvCode, mustExist) {
                        if (!resvCode) return false;

                        $scope.oCommonData.sResvCode = resvCode;
                        setCookie("resvCode",resvCode);
                        return true;
                    }

                    $scope.unsetResvCode = function () {
                        $scope.oCommonData.sResvCode = null;
                        setCookie("resvCode", '');
                        return true;
                    }

                    $scope.oCommonData = { sResvCode: null };

                    $scope.setResvCode(oArguments["resvCode"], true);
                    
                    $scope.updateServerTime = function () {
                        $scope.serverTime = (new Date()).getTime();
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
                    {resvCode}/oWarInfo/sTimerType
                                            
                    {resvCode}/loOpponents/{0-n}/$id  //generated by firebase for Arrays
                    {resvCode}/loOpponents/{0-n}/sOpponentName
                    {resvCode}/loOpponents/{0-n}/loResvs/{0-n}/$id   //generated by firebase for Arrays
                    {resvCode}/loOpponents/{0-n}/loResvs/{0-n}/sPlayerName
                    {resvCode}/loOpponents/{0-n}/loResvs/{0-n}/iResult
                    {resvCode}/loOpponents/{0-n}/loResvs/{0-n}/iResvTime
                    */
                                           
                    $scope.oWarInfo = {
                        sClanName:"Super Clanny",
                        sOppositionClanName:null,
                        iWarSize:15,
                        sTimerType:"fixed-2-h"
                    };
                                           
                    $scope.loOpponents = [
                        { $id: 0, sOpponentName: "p1", loResvs: [{ $id: 0, sPlayerName: "Joe", iResult: 2, iResvTime: $scope.getServerTime() }, { $id: 1, sPlayerName: "James", iResult: -1, iResvTime: $scope.getServerTime() }] },
                        { $id: 1, sOpponentName: "p2", loResvs: [{ $id: 0, sPlayerName: "Joe", iResult: 0, iResvTime: $scope.getServerTime() }, { $id: 1, sPlayerName: "James", iResult: -1, iResvTime: $scope.getServerTime() }] },
                        { $id: 2, sOpponentName: "p3", loResvs: [] },
                        { $id: 3, sOpponentName: "p4", loResvs: [{ $id: 0, sPlayerName: "Joe", iResult: 1, iResvTime: $scope.getServerTime() }] },
                        { $id: 4, sOpponentName: "p5" },
                        { $id: 5, sOpponentName: "p6", loResvs: [{ $id: 0, sPlayerName: "Jim", iResult: 1, iResvTime: $scope.getServerTime() }, { $id: 1, sPlayerName: "John", iResult: -1, iResvTime: $scope.getServerTime() }] },
                        ];
                       
                    //configs
                    $scope.loWarSizes = [
                        {val:"10", txt:"10 v 10"},
                        {val:"15", txt:"15 v 15"},
                        {val:"20", txt:"20 v 20"},
                        {val:"25", txt:"25 v 25"},
                        {val:"30", txt:"30 v 30"},
                        {val:"40", txt:"40 v 40"},
                        {val:"50", txt:"50 v 50"}
                        ];
                    $scope.loTimerTypes = [
                        {val:"fixed-30-m", txt:"30 mins"},
                        {val:"fixed-1-h", txt:"1 hour"},
                        {val:"fixed-2-h", txt:"2 hours"},
                        {val:"fixed-3-h", txt:"3 hours"},
                        {val:"fixed-4-h", txt:"4 hours"},
                        {val:"fixed-5-h", txt:"5 hours"},
                        {val:"fixed-6-h", txt:"6 hours"},
                        {val:"fixed-12-h", txt:"12 hours"},
                        {val:"fixed-24-h", txt:"24 hours"}
                        ];
 
                }]);

            app.controller("reserveInitCtrl", ["$scope", "$firebaseArray",
                function ($scope, $firebaseArray) {


                    $scope.onCreateOption = function () {
                        //$scope.sResvCode = generateCode();
                        $scope.iPageMode = 1;
                    };

                    $scope.onJoinOption = function () {
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

                    $scope.onCreateRequested = function () {
                        //$scope.oCommonData.sResvCode = generateCode();
                        $scope.setResvCode(generateCode(), false);
                    }

                    $scope.onJoinRequested = function () {
                        //$scope.oCommonData.sResvCode = $scope.sInputResvCode;
                        $scope.setResvCode($scope.sInputResvCode, true);
                    }

                }]);


            app.controller("reserveListCtrl", ["$scope", "$firebaseArray",
                function ($scope, $firebaseArray) {

                    $scope.onLeaveOption = function () {                     
                        $scope.onDeSelectOpponent();
                        $scope.unsetResvCode();
                    };

                    $scope.onOpponentSelected = function (opponent) {
                        $scope.oSelectedOpponent = ($scope.oSelectedOpponent == opponent ? null : opponent);
                    }
                    $scope.onDeSelectOpponent = function () {
                        $scope.onUpdateResvCancel();
                        $scope.oSelectedOpponent = null;
                    }

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
                        $scope.oSelectedOpponent.loResvs.push({ $id: resvId, sPlayerName: sName, iResvTime: $scope.getServerTime(), iResult: -1 });
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
                        if (mins > 120) mins = 120;

                        return Math.round(((mins * 1.0) / 120) * 100);
                    }

                    $scope.getRemainingMinutes = function (resv) {
                        var minsElapsed = $scope.getElapsedMinutes(resv);

                        if (minsElapsed > 120) return 0;

                        return (120 - minsElapsed);
                    };

                    $scope.getRemainingPercentage = function (resv) {
                        var mins = $scope.getRemainingMinutes(resv);

                        return Math.round(((mins * 1.0) / 120) * 100);
                    }                    

                    $scope.isStarSet = function (starVal) {
                        return (starVal >= 0);
                    }


                }]);

