import { now } from "lodash";
import isTypedArray from "lodash/isTypedArray";
import zlib from "pako";

/**
 * 字符串转ArrayBuffer
 * @param str
 * @returns
 */
export async function str2buf(str: string): Promise<ArrayBuffer> {
  const blob = new Blob([str], { type: "text/plain" });
  return blob.arrayBuffer();
}

/**
 * ArrayBuffer转字符串
 * @param buffer
 * @returns
 */
export async function buf2str(buffer: ArrayBuffer) {
  const blob = new Blob([buffer], { type: "text/plain" });
  return blob.text();
}

/**
 * 请求数据编码，顺序如下:
 * json数据长度|json数据|原始body|文件列表
 *
 * interface WillSendBinStruct {
 *   paramsLen: Uint16Array;
 *   params: Uint8Array;
 *   raw: Uint8Array;
 *   files: Uint8Array;
 * }
 *
 * @param data
 * @returns
 */
export async function encode(data: WillSendData): Promise<Uint8Array> {
  const params: WillSendBinParams = {
    url: data.url,
    method: data.method.toUpperCase(),
    headers: data.headers!,
    params: data.params,
    raw: {
      sendAsRaw: data.raw.sendAsRaw,
    },
  };

  // 文件上传相关
  let filesMap: FileItem[] = [];
  let files: Blob[] = [];
  let filesTotalSize: number = 0;
  if (Array.isArray(data.files) && data.files.length) {
    data.files.forEach((item) => {
      if (item.file instanceof File) {
        files.push(item.file);
        filesTotalSize += item.file.size;
        filesMap.push({
          fileName: item.filedName,
          size: item.file.size,
          filedName: item.fileName,
        });
      }
    });
  }
  if (filesMap.length > 0) {
    params.files = filesMap;
  }

  // 原始数据缓冲
  let rawSize = 0;
  let rawBuf = new ArrayBuffer(0);
  if (data.raw.sendAsRaw) {
    let content = data.raw.content;
    if (typeof content === "string") {
      rawBuf = await str2buf(content);
    } else if (content instanceof Blob) {
      rawBuf = await content.arrayBuffer();
    } else if (content instanceof ArrayBuffer) {
      rawBuf = content;
    } else if (isTypedArray(content)) {
      rawBuf = (content as Uint8Array).buffer;
    }
    rawSize = rawBuf.byteLength;
  }
  params.raw.size = rawSize;

  // 数据缓冲
  const paramsStr = JSON.stringify(params);
  // const paramsBuf = await str2buf(paramsStr);
  const paramsBuf = zlib.deflate(paramsStr);

  // 创建缓冲区
  const buf = new ArrayBuffer(
    2 + paramsBuf.byteLength + rawBuf.byteLength + filesTotalSize
  );
  const bin = new Uint8Array(buf);

  // 写入参数的长度，保证大端序
  let offset = 0;
  const paramsLenBuf = new ArrayBuffer(2);
  const dataView = new DataView(paramsLenBuf);
  dataView.setUint16(0, paramsBuf.byteLength);
  bin.set(new Uint8Array(paramsLenBuf), offset);
  offset += 2;

  // 写入参数
  bin.set(new Uint8Array(paramsBuf), offset);
  offset += paramsBuf.byteLength;

  // 写入原始数据
  bin.set(new Uint8Array(rawBuf), offset);
  offset += rawBuf.byteLength;

  // 写入文件
  for (let file of files) {
    const fileBuf = await file.arrayBuffer();
    bin.set(new Uint8Array(fileBuf), offset);
    offset += fileBuf.byteLength;
  }
  return bin;
}

/**
 * 解码二进制返回数据
 *
 * interface WillSendBinStruct {
 *   paramsLen: Uint16Array;
 *   params: Uint8Array;
 *   body: Uint16Array;
 * }
 *
 * @param data
 * @returns
 */
export async function decode(data: ArrayBuffer): Promise<DecodeData> {
  const bin = new Uint8Array(data);

  // 1、读取params长度
  const view = new DataView(bin.subarray(0, 2).buffer);
  const paramsLen = view.getUint16(0);

  // 2、读取params
  const zlibBuf = bin.subarray(2, 2 + paramsLen);
  let paramsBuf = new Uint8Array(0);
  try {
    paramsBuf = zlib.inflate(zlibBuf);
  } catch (error) {}
  const bufStr = await buf2str(paramsBuf.buffer);
  const params: WillReceiveBinParams = JSON.parse(bufStr);

  // 3、根据params读取body的数据
  const body = bin.subarray(2 + paramsLen, params.contentLength);
  
  console.log(params.headers,'params')

  //  cookie
  if(params && params.cookies && params.cookies.length ){
    let localCookiesArr = window.localStorage.getItem('cookies') 
  // localStroage cookies
    let localCookies: Array<{}> = localCookiesArr && JSON.parse( localCookiesArr as string )
    // 响应头 cookies
    let paramsCookies: Array<{}> =  params.cookies
    // domain 是否相同 cookies
    let isSame: Boolean = true
    // 对比域名
    localCookies?.forEach((localCookiesObj:Record<string,number>)=>{
      
      if(paramsCookies.some((paramsCookiesObj:Record<string,number>)=> localCookiesObj.Domain !== paramsCookiesObj.Domain)){
        isSame = false;
        window.localStorage.removeItem('cookies')
      }
    })

    // 未存储cookie 或 不一致时 存储更新cookies
    if(!localCookies || (isSame == false )){
      console.log('重新设置cookie')
      let cookiesArr:  WillReceiveBinParams['cookies'] = []
      params.cookies.forEach((obj:CookiesItem,key)=>{
      
      cookiesArr![key] = {
        cookies:`${obj.Name}=${ obj.Value}`,
        RawExpires:obj.RawExpires,
        MaxAge:obj.MaxAge,
        Domain:obj.Domain
      }
    })
  
    if(cookiesArr.length){
      window.localStorage.setItem('cookies',JSON.stringify(cookiesArr))
    }
  }
   
}

  const result: DecodeData = {
    params,
    body,
  };


  return result;
}
