import { Cookie } from "./post";

export interface CookieStoreItem extends Cookie {
  // cookie的设置时间戳
  setTime: number;
  // 存储方式
  storeType: "local" | "session";
}
export interface CookieStore {
  [key: string]: Array<CookieStoreItem>;
}

let cookieCache: CookieStore = {};

// b.baidu.com

// a.b.baidu.com

// baidu.com
// b.baidu.com
// a.b.baidu.com

const  cookiesObjFn = ( cookie: Cookie,storaObj: CookieStore,storeType:string)=>{
  // 域名开始 . 号切掉
  cookie.domain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain
  // 判断缓存有没有当前域名
  let isSameDomain = Object.keys(storaObj).indexOf(cookie.domain) >= 0
    // 没有 对象添加新的属性数组对象
    if(!isSameDomain){
      storaObj[cookie.domain] = []
    }
    // 有 直接push
    storaObj[cookie.domain].push({
      setTime:Date.now()/1000,
      storeType:storeType == 'local'?'local' : 'session',
      ...cookie
    })
}

/**
 * 接收到服务端下发的cookie
 * @param cookies
 */
export function handleReceivedCookies(cookies?: Cookie[]) {
  if (!Array.isArray(cookies) || cookies.length === 0) return;
  // 获取缓存对象
  const localStorage = window.localStorage.getItem('cookiesObj')
  const sessionStorage = window.sessionStorage.getItem('cookiesObj')

  let localCookiesObj: CookieStore = {}
  let sessionCookiesObj: CookieStore = {}

  if(localStorage){
    localCookiesObj = JSON.parse(localStorage as string) || {}
  }
  
  if(sessionStorage){
    sessionCookiesObj = JSON.parse(sessionStorage as string) || {}
  }

  cookies.forEach((cookie,key)=>{
    // 存储
    if(cookie.maxAge >= 0){
      cookiesObjFn(cookie,localCookiesObj,'local')
      window.localStorage.setItem('cookiesObj',JSON.stringify(localCookiesObj))
      
    }else{
      
      if(cookie.maxAge == -1){
        cookiesObjFn(cookie,sessionCookiesObj,'session')
         window.sessionStorage.setItem('cookiesObj',JSON.stringify(sessionCookiesObj))
      }
     
    }
  })


}

export function getWillSendCookies(url: string): string {
  let output = "";
  const urlObj = new URL(url);
  let domainName = ''

  // domain匹配
  const parts = urlObj.hostname.split(".");
  const possibleDomains: string[] = [];
  let tmpDomain = parts[parts.length - 1];
  for (let i = parts.length - 2; i >= 0; i--) {
    tmpDomain = parts[i] + "." + tmpDomain;
    possibleDomains.push(tmpDomain);
  }
  let cookies: Array<CookieStoreItem> | undefined = undefined;
  cookieCache = JSON.parse(window.localStorage.getItem('cookiesObj') as string) || {};
  for (let i = 0; i < possibleDomains.length; i++) {
    if (cookieCache[possibleDomains[i]]) {
      cookies = cookieCache[possibleDomains[i]];
      domainName = possibleDomains[i]
      break;
    }
  }

  // cookie不存在，直接返回空
  if (!cookies || cookies.length == 0) {
    return output;
  }
console.log(cookies,'cookies')
 
  const expireIndex: number[] = [];
  const readList: number[] = [];
  const now = Date.now() / 1000;

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    if (urlObj.pathname.startsWith(cookie.path)) {
      // 判断是否过期 maxAge
      if (typeof cookie.maxAge === "number") {
       
        // 如果cookie过期
        console.log(cookie.setTime+cookie.maxAge,now)
        if ((cookie.maxAge <=0) ||(cookie.setTime + cookie.maxAge < now)) {
          expireIndex.push(i);
          
        } else {
          readList.push(i);
          
        }
      }
      // 判断是否过期 maxAge
      // else if (cookie.expires) {
      //   const expireTime = Date.parse(cookie.expires) / 1000;
      //   if (now > expireTime) {
      //     expireIndex.push(i);
      //   } else {
      //     readList.push(i);
      //   }
      // }
      // 如果maxAge和expire都不存在，是sessionCookie
      else {
        expireIndex.push(i);
      }
    }
  }
  // cookie过期  cookieCache
  if(expireIndex && expireIndex.length){
    expireIndex.map((i)=>{
      cookieCache[domainName].splice(i,1)
    })
  }
  window.localStorage.setItem('cookiesObj',JSON.stringify(cookieCache))

  // cookie可读列表
  let readCookies: string = readList.map((i)=>{
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
