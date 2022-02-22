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
const  cookiesObjFn = ( cookie: Cookie,storaObj: CookieStore)=>{
 

  let isSameDomain = Object.keys(storaObj).indexOf(cookie.domain.slice(1)) >= 0

    if(isSameDomain){
     
      storaObj[cookie.domain].push({
        setTime:Date.now(),
        name:cookie.name,
        value:cookie.value,
        path:cookie.path,
        domain:cookie.domain,
        expires:cookie.expires,
        maxAge:cookie.maxAge,
        raw:cookie.raw
      })

    }else{
      storaObj[cookie.domain] = [{
        setTime:Date.now(),
        name:cookie.name,
        value:cookie.value,
        path:cookie.path,
        domain:cookie.domain,
        expires:cookie.expires,
        maxAge:cookie.maxAge,
        raw:cookie.raw
      }]
    }


}

/**
 * 接收到服务端下发的cookie
 * @param cookies
 */
export function handleReceivedCookies(cookies?: Cookie[]) {
  if (!Array.isArray(cookies) || cookies.length === 0) return;

  let localCookiesObj: CookieStore = {}

  let sessionCookiesObj: CookieStore = {}

  if(window.localStorage.getItem('cookiesObj')){
    localCookiesObj = JSON.parse(window.localStorage.getItem('cookiesObj') as string)
  }
  
  if(window.sessionStorage.getItem('cookiesObj')){
    sessionCookiesObj = JSON.parse(window.sessionStorage.getItem('cookiesObj') as string)
  }

  cookies.forEach((cookie,key)=>{
    if(cookie.expires || cookie.maxAge>=0){

      cookiesObjFn(cookie,localCookiesObj)

      

      window.localStorage.setItem('cookiesObj',JSON.stringify(localCookiesObj))
      
    }else{
      
     
      cookiesObjFn(cookie,sessionCookiesObj)
      
      window.sessionStorage.setItem('cookiesObj',JSON.stringify(sessionCookiesObj))

    }
  })


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
  let readCookies: string= readList.map((i)=>{
    return cookies![i].name+cookies![i].value
  
  }).join(';')


  if(readCookies){
    return readCookies
  }else{
    return output
  }
  

  //1、判断domain匹配
  //2、判断path是否匹配
  //3、判断过期
  return "a=value; b=value";
  return "";
}
