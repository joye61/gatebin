import { config } from "./config";
import parser from "set-cookie-parser";

const localStore = window.localStorage;
const sessionStore = window.sessionStorage;

export interface Cookie {
  name: string;
  value: string;
  path: string;
  domain: string;
  maxAge: number;
  startTime: number;
}

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

/**
 * 通过URL下发cookie
 * @param url
 * @param items
 */
export function addCookiesByUrl(url: string, items?: Array<string>) {
  if (!Array.isArray(items)) return;
  const urlObj = new URL(url);
  const startTime = Date.now();

  // 解析cookie数据
  const cookies: Cookie[] = parser(items).map((item) => {
    // 确保domain值存在
    let domain = urlObj.hostname;
    if (item.domain) {
      domain = item.domain.replace(/^\./, "");
    }

    // 确保path值存在
    let path = "/";
    if (item.path) {
      path = item.path;
    }

    // 用maxAge取代expires，保证maxAge始终存在
    let maxAge = item.maxAge;
    if (!maxAge) {
      // 如果maxAge不存在，但是expires存在
      if (item.expires instanceof Date) {
        maxAge = (item.expires.valueOf() - startTime) / 1000;
      } else {
        // 如果maxAge和expires都不存在，session生命周期
        maxAge = -1;
      }
    }

    return {
      name: item.name,
      value: item.value,
      path,
      domain,
      maxAge: maxAge!,
      startTime,
    };
  });

  // 存储cookie
  for (let item of cookies) {
    const key = config.cacheKey + "." + item.domain;
    const { localValue, sessionValue } = getValuesByKey(key);

    // 不管maxAge是什么值，先删除旧的cookie数据
    delete localValue[item.name];
    delete sessionValue[item.name];

    // maxAge=0代表立即删除cookie，不做任何操作
    if (item.maxAge > 0) {
      // >0 时为正常带过期时间的cookie
      localValue[item.name] = item;
    } else if (item.maxAge < 0) {
      // <0 时浏览器关闭自动清除
      sessionValue[item.name] = item;
    } else {
      // =0 时直接删除，前面已经删了
    }

    // 更新存储
    if (Object.keys(localValue).length) {
      localStore.setItem(key, JSON.stringify(localValue));
    }
    if (Object.keys(sessionValue).length) {
      sessionStore.setItem(key, JSON.stringify(sessionValue));
    }
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
    const key = config.cacheKey + "." + domain;
    const { localValue, sessionValue } = getValuesByKey(key);

    // 只有存储中有值的时候才读取
    if (Object.keys(localValue).length) {
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
    }

    // 只有存储中有值的时候才读取
    if (Object.keys(sessionValue).length) {
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
  }

  return output;
}
