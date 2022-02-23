import { config } from "./config";
import { type Cookie } from "./post";

const localStore = window.localStorage;
const sessionStore = window.sessionStorage;

export interface CookieStoreItem extends Cookie {
  // 设置cookie时的时间
  startTime: number;
}

/**
 * 根据域名获取所有的cookie值
 * @param domain
 * @returns
 */
export function getValuesByKey(key: string) {
  // 同一个cookie有可能同时存在于seesion和local中
  let localValue: Record<string, CookieStoreItem> = {};
  let sessionValue: Record<string, CookieStoreItem> = {};
  const localCache = localStore.getItem(key);
  const sessionCache = sessionStore.getItem(key);

  // 解析出json化的数据
  if (localCache) {
    localValue = JSON.parse(localCache);
  }
  if (sessionCache) {
    sessionValue = JSON.parse(sessionCache);
  }

  return { localValue, sessionValue };
}

export function addCookiesByUrl(url: string, items: Array<Cookie>) {
  const urlObj = new URL(url);
  for (let item of items) {
    // 根据最新规范，domain前的点号忽略，如：.a.com = a.com
    const domain = item.domain.replace(/^\./, "");

    // 当前服务器不能下发跟自己无关的cookie
    // 如：baidu.com 不能下发chelun.com的cookie
    // 但：chelun.com可以下发a.chelun.com的cookie
    if (!domain.endsWith(urlObj.hostname)) {
      continue;
    }

    const key = config.cacheKey + ":" + domain;
    const { localValue, sessionValue } = getValuesByKey(key);

    // 不管maxAge是什么值，先删除旧的cookie数据
    delete localValue[item.name];
    delete sessionValue[item.name];

    // 设置新的cookie值，同一个cookie不可能同时存储于local和session中
    const startTime = Date.now() / 1000;
    const storeValue: CookieStoreItem = {
      startTime,
      ...item,
    };

    // maxAge=0代表立即删除cookie，不做任何操作
    if (item.maxAge > 0) {
      localValue[item.name] = storeValue;
    } else if (item.maxAge < 0) {
      sessionValue[item.name] = storeValue;
    }

    // 更新存储
    localStore.setItem(key, JSON.stringify(localValue));
    sessionStore.setItem(key, JSON.stringify(sessionValue));
  }
}

/**
 * 获取将要发送到URL的所有cookie
 * @param url
 */
export function getCookiesByUrl(url: string): CookieStoreItem[] {
  const urlObj = new URL(url);

  // 拼接出所有可能的域列表
  const parts = urlObj.hostname.split(".");
  const checks: string[] = [];
  let tmpDomain = parts[parts.length - 1];
  for (let i = parts.length - 2; i >= 0; i--) {
    tmpDomain = parts[i] + "." + tmpDomain;
    checks.push(tmpDomain);
  }

  // a.b.c.com 匹配下面的所有域名下发的cookie：
  // c.com | b.c.com | a.b.c.com
  const output: CookieStoreItem[] = [];
  for (let domain of checks) {
    const key = config.cacheKey + ":" + domain;
    const { localValue, sessionValue } = getValuesByKey(key);

    // local的值要判断过期逻辑，如果过期，则删除
    const names = Object.keys(localValue);
    for (let name of names) {
      const item = localValue[name];
      // 首先判断是否过期，如果过期，则要删除
      if (
        item.maxAge <= 0 ||
        Date.now() / 1000 >= item.startTime + item.maxAge
      ) {
        delete localValue[name];
        continue;
      }

      // 判断cookie的路径是否匹配
      if (!urlObj.pathname.startsWith(item.path)) {
        continue;
      }

      // 既没有过期，路径也匹配，放入结果中
      output.push(item);
    }

    // 将处理之后的local值重新存储
    localStore.setItem(key, JSON.stringify(localValue));

    // session的值不用处理过期逻辑，浏览器会自动删除
    for (let name in sessionValue) {
      const item = sessionValue[name];
      // 判断cookie的路径是否匹配
      if (!urlObj.pathname.startsWith(item.path)) {
        continue;
      }
      output.push(item);
    }
  }

  return output;
}
