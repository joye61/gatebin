import { config } from "./config";
const localStore = window.localStorage;
const sessionStore = window.sessionStorage;
export function getValuesByKey(key) {
    let localValue = {};
    let sessionValue = {};
    const localCache = localStore.getItem(key);
    const sessionCache = sessionStore.getItem(key);
    if (localCache) {
        localValue = JSON.parse(localCache);
    }
    if (sessionCache) {
        sessionValue = JSON.parse(sessionCache);
    }
    return { localValue, sessionValue };
}
export function addCookies(items) {
    if (!Array.isArray(items))
        return;
    for (let item of items) {
        const domain = item.domain.replace(/^\./, "");
        const key = config.cacheKey + "." + domain;
        const { localValue, sessionValue } = getValuesByKey(key);
        delete localValue[item.name];
        delete sessionValue[item.name];
        const startTime = Date.now() / 1000;
        const storeValue = Object.assign({ startTime }, item);
        if (item.maxAge > 0) {
            localValue[item.name] = storeValue;
        }
        else if (item.maxAge < 0) {
            sessionValue[item.name] = storeValue;
        }
        if (Object.keys(localValue).length) {
            localStore.setItem(key, JSON.stringify(localValue));
        }
        if (Object.keys(sessionValue).length) {
            sessionStore.setItem(key, JSON.stringify(sessionValue));
        }
    }
}
export function getCookiesByUrl(url) {
    const urlObj = new URL(url);
    const parts = urlObj.hostname.split(".");
    const checks = [];
    let tmpDomain = parts[parts.length - 1];
    for (let i = parts.length - 2; i >= 0; i--) {
        tmpDomain = parts[i] + "." + tmpDomain;
        checks.push(tmpDomain);
    }
    const output = [];
    for (let domain of checks) {
        const key = config.cacheKey + "." + domain;
        const { localValue, sessionValue } = getValuesByKey(key);
        if (Object.keys(localValue).length) {
            const names = Object.keys(localValue);
            for (let name of names) {
                const item = localValue[name];
                if (item.maxAge <= 0 ||
                    Date.now() / 1000 >= item.startTime + item.maxAge) {
                    delete localValue[name];
                    continue;
                }
                if (!urlObj.pathname.startsWith(item.path)) {
                    continue;
                }
                output.push(item);
            }
            localStore.setItem(key, JSON.stringify(localValue));
        }
        if (Object.keys(sessionValue).length) {
            for (let name in sessionValue) {
                const item = sessionValue[name];
                if (!urlObj.pathname.startsWith(item.path)) {
                    continue;
                }
                output.push(item);
            }
        }
    }
    return output;
}
