import { config } from "./config";
import parser from "set-cookie-parser";
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
export function addCookiesByUrl(url, items) {
    if (!Array.isArray(items))
        return;
    const urlObj = new URL(url);
    const startTime = Date.now();
    const cookies = parser(items, { decodeValues: false }).map((item) => {
        let domain = urlObj.hostname;
        if (item.domain) {
            domain = item.domain.replace(/^\./, "");
        }
        let path = "/";
        if (item.path) {
            path = item.path;
        }
        let maxAge = item.maxAge;
        if (typeof maxAge !== "number") {
            if (item.expires instanceof Date) {
                maxAge = (item.expires.valueOf() - startTime) / 1000;
            }
            else {
                maxAge = -1;
            }
        }
        return {
            name: item.name,
            value: item.value,
            path,
            domain,
            maxAge: maxAge,
            startTime,
        };
    });
    for (let item of cookies) {
        const key = config.cacheKey + "." + item.domain;
        const { localValue, sessionValue } = getValuesByKey(key);
        delete localValue[item.name];
        delete sessionValue[item.name];
        if (item.maxAge > 0) {
            localValue[item.name] = item;
        }
        else if (item.maxAge < 0) {
            sessionValue[item.name] = item;
        }
        else {
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
