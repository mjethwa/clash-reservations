function generateCode() {
    var vowels = "aeiou";
    var consonents = "bcdfghjklmnpqrstvwxyz";
    var digits = "0123456789";
    
    var result = "";
    
    result = result.concat(
                           randomChar(consonents), randomChar(vowels),
                           randomChar(consonents), randomChar(vowels),
                           randomChar(consonents), randomChar(vowels),
                           randomChar(digits), randomChar(digits)
                           );
    
    return result;
    
}

function randomChar(fromString) {
    if (!fromString) return null;
    return fromString.charAt(Math.floor(Math.random() * fromString.length));
}


function getCookies() {
    var result = {};
    
    var c = document.cookie.split('; ');
    for (i = c.length - 1; i >= 0; i--) {
        var C = c[i].split('=');
        result[C[0]] = C[1];
    }
    
    return result;
}

function setCookie(cKey, cVal, oCachedObject) {
    if (typeof (cKey) != "string" || typeof (cVal) != "string") {
        console.log("Attempted to set cookie with non string values");
        return;
    }
    
    document.cookie = cKey + "=" + cVal + "; expires=Fri, 31 Dec 9999 23:59:59 GMT";
    if (oCachedObject) oCachedObject[cKey] = cVal;
}

function getArguments() {
    
    var result = {};
    var sStr = window.location.search;
    
    if (sStr.startsWith("?")) sStr = sStr.substring(1);
    var c = sStr.split('&');
    for (i = c.length - 1; i >= 0; i--) {
        var C = c[i].split('=');
        result[C[0]] = C[1];
    }
    
    return result;
}