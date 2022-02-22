import pbRoot from "./message";
import { buf2str } from "./codec";
import { config as bgConfig } from "./config";
import isPlainObject from "lodash/isPlainObject";
import isTypedArray from "lodash/isTypedArray";
import typeParse from "content-type";
import { CtypeName, Ctypes } from "./type";
import { type Namespace } from "protobufjs";

export interface PostOption {
  body?: XMLHttpRequestBodyInit | Record<string, string>;
  headers?: Record<string, string>;
  method?: string;
}

export interface FileItem {
  key: string;
  name?: string;
  data: Uint8Array;
}

export interface RawBody {
  // 是否开启原始类型传输
  enabled: boolean;
  // 0: 纯文本， 1：二进制
  type?: 0 | 1;
  asPlain?: string;
  asBinary?: Uint8Array;
}

export interface RequestMessage {
  url: string;
  method: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  rawBody: RawBody;
  files: FileItem[];
}

/**
 * 规范化参数格式，参数在网络上传输只能是字符串
 * @param input
 */
function normalizeParams(input: Record<string, any>): Record<string, string> {
  const output: Record<string, string> = {};
  if (isPlainObject(input)) {
    for (let key in input) {
      output[key] = String(input[key]);
    }
  }
  return output;
}

interface Cookie {
  name: string;
  value: string;
  path: string;
  domain: string;
  expires: string;
  maxAge: number;
  raw: string;
}

interface HeaderValue {
  value: string[];
}
interface ResponseMessage {
  code: number;
  headers: Record<string, HeaderValue>;
  cookies: Cookie[];
  body: Uint8Array;
}

/**
 * 根据输入创建消息类型
 * @param url
 * @param option
 * @returns
 */
async function createRequestMessage(
  url: string,
  option?: PostOption
): Promise<RequestMessage> {
  // 规范化路径，处理以//开始的路径
  if (url.startsWith("//")) {
    url = window.location.protocol + url;
  }

  // 获取配置
  const defaultOption: PostOption = {
    method: "GET",
  };
  if (isPlainObject(option)) {
    option = { ...defaultOption, ...option };
  } else {
    option = defaultOption;
  }

  // 定义消息
  const message: RequestMessage = {
    url,
    method: option.method?.toUpperCase() ?? "GET",
    headers: {},
    params: {},
    rawBody: {
      enabled: false,
    },
    files: [],
  };

  // 获取rawBody的引用
  const rawBody = message.rawBody;

  // 规范化headers的键，便于索引查找
  if (option.headers) {
    for (let key in option.headers) {
      message.headers[key.toLowerCase()] = option.headers[key];
    }
  }
  let userCtype: string = "";
  if (message.headers[CtypeName]) {
    const parseResult = typeParse.parse(message.headers[CtypeName] || "");
    userCtype = parseResult.type;
  }

  // body: URLSearchParams
  if (option.body instanceof URLSearchParams) {
    message.headers[CtypeName] = Ctypes.UrlEncoded;
    const params: Record<string, string> = {};
    for (const [key, value] of option.body) {
      params[key] = String(value);
    }
  }

  // body: FormData
  else if (option.body instanceof FormData) {
    // FormData类型可能会包含文件上传
    message.headers[CtypeName] = Ctypes.FormData;
    const params: Record<string, string> = {};
    const files: Array<FileItem> = [];
    for (const [key, value] of option.body.entries()) {
      if (value instanceof File) {
        const buf = await value.arrayBuffer();
        files.push({
          key,
          name: value.name,
          data: new Uint8Array(buf),
        });
      } else {
        params[key] = String(key);
      }
    }
  }

  // body: Record<string, string>
  else if (isPlainObject(option.body)) {
    // JSON对象类型
    if (userCtype === Ctypes.Json) {
      message.headers[CtypeName] = Ctypes.Json;
      rawBody.enabled = true;
      rawBody.type = 0;
      rawBody.asPlain = JSON.stringify(option.body);
    } else if (userCtype === Ctypes.FormData) {
      message.headers[CtypeName] = Ctypes.FormData;
      message.params = normalizeParams(option.body as Record<string, string>);
    } else {
      message.headers[CtypeName] = Ctypes.UrlEncoded;
      message.params = normalizeParams(option.body as Record<string, string>);
    }
  }

  // body: string
  else if (typeof option.body === "string") {
    // 字符串类型
    message.headers[CtypeName] = Ctypes.Text;
    rawBody.enabled = true;
    rawBody.type = 0;
    rawBody.asPlain = option.body;
  }

  // body: Blob
  else if (option.body instanceof Blob) {
    // Blob类型优先读取自带类型，如果没有，则当做原始二进制
    if (option.body.type) {
      message.headers[CtypeName] = option.body.type;
    } else {
      message.headers[CtypeName] = Ctypes.OctetStream;
    }
    const buf = await option.body.arrayBuffer();
    rawBody.enabled = true;
    rawBody.type = 1;
    rawBody.asBinary = new Uint8Array(buf);
  }

  // body: ArrayBuffer
  else if (option.body instanceof ArrayBuffer) {
    // 字符串类型
    message.headers[CtypeName] = Ctypes.OctetStream;
    rawBody.enabled = true;
    rawBody.type = 1;
    rawBody.asBinary = new Uint8Array(option.body);
  }

  // body: TypedArray
  else if (isTypedArray(option.body)) {
    // 其余类型都当做原始二进制
    message.headers[CtypeName] = Ctypes.OctetStream;
    rawBody.enabled = true;
    rawBody.type = 1;
    rawBody.asBinary = new Uint8Array(option.body!.buffer as Uint8Array);
  }
  // // Cookie
  // if(window.localStorage.getItem('cookies') as string){
  //   // 缓存cookie 
  //   let cookiesArr: WillReceiveBinParams['cookies'] = JSON.parse(window.localStorage.getItem('cookies') as string)
  //   // 过期时间
  //   let Expires = cookiesArr![0].RawExpires || ''
  //   let MaxAge = cookiesArr![0].MaxAge

  //   let Expiresdata = new Date(Expires).getTime()/1000
  //   let currentdata =  Date.now()/1000
  //   // 对比是否过期
  //   if(MaxAge && Expiresdata < currentdata){
      
  //     delete headers['cookie']
  //     window.localStorage.removeItem('cookies')

  //   }else {

  //     let cookies = cookiesArr!.map((obj)=>{
  //       return obj.cookies
  //     }).join(';')
      
  //     headers['cookie'] = cookies
  //   }

  // }else{

  // body: ohters
  else {
    message.headers[CtypeName] = Ctypes.Text;
    rawBody.enabled = true;
    rawBody.type = 0;
    rawBody.asPlain = String(option.body);
  }

  return message;
}

/**
 * 网关响应体消息的类型
 */
export class GatewayResponse implements IGatewayResponse {
  constructor(public body: Uint8Array, public ctype: string) {}
  async text(): Promise<string> {
    return buf2str(this.body.buffer);
  }
  async json(): Promise<Record<string, any>> {
    const str = await buf2str(this.body.buffer);
    return JSON.parse(str);
  }
  async blob(): Promise<Blob> {
    let option: BlobPropertyBag = {};
    if (this.ctype) {
      option.type = this.ctype;
    }
    return new Blob([this.body], option);
  }
  async arrayBuffer(): Promise<ArrayBuffer> {
    return this.body.buffer;
  }
  async blobUrl(): Promise<string> {
    const blob = await this.blob();
    return URL.createObjectURL(blob);
  }
}

/**
 * 以二进制形式发送请求
 * @param input
 * @param init
 * @returns
 */
export async function POST(
  url: string,
  option?: PostOption
): Promise<IGatewayResponse> {
  // 创建消息
  const payload = await createRequestMessage(url, option);
  const message = (pbRoot as Namespace).lookupType("main.RequestMessage");
  const verifyErr = message.verify(payload);
  if (verifyErr) {
    throw new Error(`Message verification failure: ${verifyErr}`);
  }
  const pbMessage = message.create(payload);
  const buffer = message.encode(pbMessage).finish();

  // 发送请求到网关
  const response = await fetch(bgConfig.gatewayUrl, {
    method: "POST",
    body: buffer,
  });

  // 接收网关响应
  const protobuf = await response.arrayBuffer();
  const respMessage = (pbRoot as Namespace).lookupType("main.ResponseMessage");
  const respPbMessage = respMessage.decode(new Uint8Array(protobuf));
  const result = respMessage.toObject(respPbMessage) as ResponseMessage;
  console.log("Remote Response: \n\n", result, "\n\n");

  // 读取响应类型
  const ctype = result.headers[CtypeName]?.value[0] || "";
  const gresp = new GatewayResponse(result.body, ctype);
  return gresp;
}
