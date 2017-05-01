
//mockup
var currentTime = (new Date()).getTime();
var MOCKUP = {
    oWarInfo: {
        sClanName: "Super Clanny",
        sOppositionClanName: null,
        oWarSize: { iSize: 15, sName: "15 v 15" },
        oTimerType: { sName: "Fixed 1 Hour", sType: "fixed", iTime: (60 * 60000) }
    },
    loOpponents: [
        { iSeq: 0, sOpponentName: "p1", loResvs: [{ iSeq: 0, sPlayerName: "Joe", iResult: 2, iResvTime: currentTime }, { iSeq: 1, sPlayerName: "James", iResult: -1, iResvTime: currentTime }] },
        { iSeq: 1, sOpponentName: "p2", loResvs: [{ iSeq: 0, sPlayerName: "Joe", iResult: 0, iResvTime: currentTime }, { iSeq: 1, sPlayerName: "James", iResult: -1, iResvTime: currentTime }] },
        { iSeq: 2, sOpponentName: "p3", loResvs: [] },
        { iSeq: 3, sOpponentName: "p4", loResvs: [{ iSeq: 0, sPlayerName: "Joe", iResult: 1, iResvTime: currentTime }] },
        { iSeq: 4, sOpponentName: "p5" },
        { iSeq: 5, sOpponentName: "p6", loResvs: [{ iSeq: 0, sPlayerName: "Jim", iResult: 1, iResvTime: currentTime }, { iSeq: 1, sPlayerName: "John", iResult: -1, iResvTime: currentTime }] },
    ]
};

//configs
var CONFIG = {
    loWarSizes: [
        { iSize: 10, sName: "10 v 10" },
        { iSize: 15, sName: "15 v 15" },
        { iSize: 20, sName: "20 v 20" },
        { iSize: 25, sName: "25 v 25" },
        { iSize: 30, sName: "30 v 30" },
        { iSize: 40, sName: "40 v 40" },
        { iSize: 50, sName: "50 v 50" }
    ],

    loTimerTypes: [
        { sName: "Fixed 30 Mins", sType: "fixed", iTime: (30 * 60000) },
        { sName: "Fixed 1 Hour", sType: "fixed", iTime: (60 * 60000) },
        { sName: "Fixed 2 Hours", sType: "fixed", iTime: (120 * 60000) },
        { sName: "Fixed 3 Hours", sType: "fixed", iTime: (180 * 60000) },
        { sName: "Fixed 4 Hours", sType: "fixed", iTime: (240 * 60000) },
        { sName: "Fixed 5 Hours", sType: "fixed", iTime: (300 * 60000) },
        { sName: "Fixed 6 Hours", sType: "fixed", iTime: (360 * 60000) },
        { sName: "Fixed 12 Hours", sType: "fixed", iTime: (720 * 60000) },
        { sName: "Fixed 24 Hours", sType: "fixed", iTime: (1440 * 60000) }
    ],

    oFbConfig: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        storageBucket: "",
        messagingSenderId: "",
    }
};