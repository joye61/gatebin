import { config } from "./config";
import { type CookieStoreItem } from "./cookie";

function storeCookie(item: CookieStoreItem) {
  const domain = item.domain.replace(/^\./, "");
  const key = config.cacheKey + ":" + domain;
  let cache: string | null = null;
  let value: Record<string, CookieStoreItem> = {};
  // 先检查缓存中当前域对应的键是否存在
  if (item.storeType === "local") {
    cache = window.localStorage.getItem(key);
  } else if (item.storeType === "session") {
    cache = window.localStorage.getItem(key);
  }
  // 如果缓存存在，则解析出来
  if (cache && typeof cache === "string") {
    value = JSON.parse(cache);
  }

  
}


function getCookiesByDomain() {}
