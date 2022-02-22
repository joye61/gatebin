import { Cookie } from "./post";

interface CookieStoreItem extends Cookie {
  setTime: number;
}
interface CookieStore {
  [key: string]: Array<CookieStoreItem>;
}

const cookieCache: CookieStore = {};

// b.baidu.com

// a.b.baidu.com

// baidu.com
// b.baidu.com
// a.b.baidu.com

/**
 * 接收到服务端下发的cookie
 * @param cookies
 */
export function handleReceivedCookies(cookies?: Cookie[]) {
  if (!Array.isArray(cookies) || cookies.length === 0) return;
}

export function getWillSendCookies(url: string): string {
  let output = "";
  const urlObj = new URL(url);

  // domain匹配
  const parts = urlObj.hostname.split(".");
  const possibleDomains: string[] = [];
  let tmpDomain = parts[parts.length - 1];
  for (let i = parts.length - 2; i >= 0; i--) {
    tmpDomain = parts[i] + "." + tmpDomain;
    possibleDomains.push(tmpDomain);
  }
  let cookies: Array<CookieStoreItem> | undefined = undefined;
  for (let i = 0; i < possibleDomains.length; i++) {
    if (cookieCache[possibleDomains[i]]) {
      cookies = cookieCache[possibleDomains[i]];
      break;
    }
  }

  // cookie不存在，直接返回空
  if (!cookies || cookies.length == 0) {
    return output;
  }

  const expireIndex: number[] = [];
  const readList: number[] = [];
  const now = Date.now() / 1000;
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    if (urlObj.pathname.startsWith(cookie.path)) {
      // 判断是否过期 maxAge
      if (typeof cookie.maxAge === "number") {
        // 如果cookie过期
        if (cookie.setTime + cookie.maxAge < now) {
          expireIndex.push(i);
        } else {
          readList.push(i);
        }
      }
      // 判断是否过期 maxAge
      else if (cookie.expires) {
        const expireTime = Date.parse(cookie.expires) / 1000;
        if (now > expireTime) {
          expireIndex.push(i);
        } else {
          readList.push(i);
        }
      } 
      // 如果maxAge和expire都不存在，是sessionCookie
      else {
        expireIndex.push(i);
      }
    }
  }

  // 

  

  //1、判断domain匹配
  //2、判断path是否匹配
  //3、判断过期
  return "a=value; b=value";
  return "";
}
