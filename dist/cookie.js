let cookieCache = {};
const cookiesObjFn = (cookie, storaObj, storeType) => {
    cookie.domain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
    let isSameDomain = Object.keys(storaObj).indexOf(cookie.domain) >= 0;
    if (!isSameDomain) {
        storaObj[cookie.domain] = [];
    }
    storaObj[cookie.domain].push(Object.assign({ setTime: Date.now() / 1000, storeType: storeType == 'local' ? 'local' : 'session' }, cookie));
};
export function handleReceivedCookies(cookies) {
    if (!Array.isArray(cookies) || cookies.length === 0)
        return;
    const localStorage = window.localStorage.getItem('cookiesObj');
    const sessionStorage = window.sessionStorage.getItem('cookiesObj');
    let localCookiesObj = {};
    let sessionCookiesObj = {};
    if (localStorage) {
        localCookiesObj = JSON.parse(localStorage) || {};
    }
    if (sessionStorage) {
        sessionCookiesObj = JSON.parse(sessionStorage) || {};
    }
    cookies.forEach((cookie, key) => {
        if (cookie.maxAge >= 0) {
            cookiesObjFn(cookie, localCookiesObj, 'local');
            window.localStorage.setItem('cookiesObj', JSON.stringify(localCookiesObj));
        }
        else {
            if (cookie.maxAge == -1) {
                cookiesObjFn(cookie, sessionCookiesObj, 'session');
                window.sessionStorage.setItem('cookiesObj', JSON.stringify(sessionCookiesObj));
            }
        }
    });
}
export function getWillSendCookies(url) {
    let output = "";
    const urlObj = new URL(url);
    let domainName = '';
    const parts = urlObj.hostname.split(".");
    const possibleDomains = [];
    let tmpDomain = parts[parts.length - 1];
    for (let i = parts.length - 2; i >= 0; i--) {
        tmpDomain = parts[i] + "." + tmpDomain;
        possibleDomains.push(tmpDomain);
    }
    let cookies = undefined;
    cookieCache = JSON.parse(window.localStorage.getItem('cookiesObj')) || {};
    for (let i = 0; i < possibleDomains.length; i++) {
        if (cookieCache[possibleDomains[i]]) {
            cookies = cookieCache[possibleDomains[i]];
            domainName = possibleDomains[i];
            break;
        }
    }
    if (!cookies || cookies.length == 0) {
        return output;
    }
    console.log(cookies, 'cookies');
    const expireIndex = [];
    const readList = [];
    const now = Date.now() / 1000;
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        if (urlObj.pathname.startsWith(cookie.path)) {
            if (typeof cookie.maxAge === "number") {
                console.log(cookie.setTime + cookie.maxAge, now);
                if ((cookie.maxAge <= 0) || (cookie.setTime + cookie.maxAge < now)) {
                    expireIndex.push(i);
                }
                else {
                    readList.push(i);
                }
            }
            else {
                expireIndex.push(i);
            }
        }
    }
    if (expireIndex && expireIndex.length) {
        expireIndex.map((i) => {
            cookieCache[domainName].splice(i, 1);
        });
    }
    window.localStorage.setItem('cookiesObj', JSON.stringify(cookieCache));
    let readCookies = readList.map((i) => {
        return cookies[i].name + cookies[i].value;
    }).join(';');
    if (readCookies) {
        return readCookies;
    }
    else {
        return output;
    }
    return "a=value; b=value";
    return "";
}
