const cookieCache = {};
export function handleReceivedCookies(cookies) {
    if (!Array.isArray(cookies) || cookies.length === 0)
        return;
}
export function getWillSendCookies(url) {
    let output = "";
    const urlObj = new URL(url);
    const parts = urlObj.hostname.split(".");
    const possibleDomains = [];
    let tmpDomain = parts[parts.length - 1];
    for (let i = parts.length - 2; i >= 0; i--) {
        tmpDomain = parts[i] + "." + tmpDomain;
        possibleDomains.push(tmpDomain);
    }
    let cookies = undefined;
    for (let i = 0; i < possibleDomains.length; i++) {
        if (cookieCache[possibleDomains[i]]) {
            cookies = cookieCache[possibleDomains[i]];
            break;
        }
    }
    if (!cookies || cookies.length == 0) {
        return output;
    }
    const expireIndex = [];
    const readList = [];
    const now = Date.now() / 1000;
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        if (urlObj.pathname.startsWith(cookie.path)) {
            if (typeof cookie.maxAge === "number") {
                if (cookie.setTime + cookie.maxAge < now) {
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
    return "a=value; b=value";
    return "";
}
