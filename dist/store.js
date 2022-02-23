import { config } from "./config";
function storeCookie(item) {
    const domain = item.domain.replace(/^\./, "");
    const key = config.cacheKey + ":" + domain;
    let cache = null;
    let value = {};
    if (item.storeType === "local") {
        cache = window.localStorage.getItem(key);
    }
    else if (item.storeType === "session") {
        cache = window.localStorage.getItem(key);
    }
    if (cache && typeof cache === "string") {
        value = JSON.parse(cache);
    }
}
function getCookiesByDomain() { }
