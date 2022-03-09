export enum Ctypes {
  OctetStream = "application/octet-stream",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  // 一些可以直接输出显示的文本类型
  JSON = "application/json",
  Plain = "text/plain",
  HTML = "text/html",
  CSS = "text/css",
  JS = "text/javascript",
  AJS = "application/javascript",
}

export const CtypeName = "content-type";
