import { Cookie } from "./post";

/**
 * 接收到服务端下发的cookie
 * @param cookies
 */
export function handleReceivedCookies(cookies?: Cookie[]) {
  if (!Array.isArray(cookies) || cookies.length === 0) return;
}

export function getWillSendCookies(url: string): string {
  let output = "";
  //1、判断domain匹配
  //2、判断path是否匹配
  //3、判断过期
  return "a=value; b=value";
  return "";
}
