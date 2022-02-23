import pbRoot from "./message";
import zlib from "pako";
import { buf2str } from "./convert";
import { config } from "./config";
import isPlainObject from "lodash/isPlainObject";
import isTypedArray from "lodash/isTypedArray";
import typeParse from "content-type";
import { CtypeName, Ctypes } from "./type";
import { type Namespace } from "protobufjs";
import { addCookiesByUrl, getCookiesByUrl } from "./store";

export interface PostOption {
  body?: XMLHttpRequestBodyInit | Record<string, string>;
  headers?: Record<string, string>;
  method?: string;
  // 是否启用消息压缩，使用zlib压缩
  compress?: boolean;
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

export interface Cookie {
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
  option: PostOption
): Promise<RequestMessage> {
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

  // body: ohters
  else {
    message.headers[CtypeName] = Ctypes.Text;
    rawBody.enabled = true;
    rawBody.type = 0;
    rawBody.asPlain = "";
  }

  // cookie相关逻辑
  const cookies = getCookiesByUrl(url);
  if (cookies.length) {
    let cookieArr: string[] = [];
    cookies.forEach((item) => {
      cookieArr.push(`${item.name}=${item.value}`);
    });
    message.headers["cookie"] = cookieArr.join("; ");
  }

  return message;
}

/**
 * 网关响应体消息的类型
 */
export class GatewayResponse implements IGatewayResponse {
  code: number;
  body: Uint8Array;
  headers: Record<string, HeaderValue>;

  constructor(public message: ResponseMessage) {
    this.code = message.code;
    this.body = message.body;
    this.headers = message.headers;
  }

  /**
   * 以文本格式返回
   * @returns
   */
  async text(): Promise<string> {
    return buf2str(this.body);
  }

  /**
   * 将结果解析为json
   * @returns
   */
  async json(): Promise<Record<string, any>> {
    const str = await this.text();
    return JSON.parse(str);
  }

  /**
   * 返回Blob
   * @returns
   */
  async blob(): Promise<Blob> {
    let option: BlobPropertyBag = {};
    const contentType = this.headers[CtypeName]?.value[0] || "";
    if (contentType) {
      option.type = contentType;
    }
    return new Blob([this.body], option);
  }

  /**
   * 返回ArrayBuffer
   * @returns
   */
  async arrayBuffer(): Promise<ArrayBuffer> {
    return this.body.buffer;
  }

  /**
   * 以BlobURL的格式返回
   * @returns
   */
  async blobUrl(): Promise<string> {
    const blob = await this.blob();
    return URL.createObjectURL(blob);
  }

  /**
   * 下载一个文件并且保存到本地
   * @param name 主动设置的文件名
   */
  async download(name?: string) {
    const url = await this.blobUrl();
    const link = document.createElement("a");
    let finalName = name ?? "download";
    // 如果是下载文件，检测下载头
    const disposition = this.headers["content-disposition"]?.value;
    if (Array.isArray(disposition)) {
      const regRes = disposition[0].match(/filename\=\"(.*?)\"/);
      if (regRes?.[1]) {
        name = regRes[1];
      }
    }
    link.download = finalName;
    link.href = url;
    link.click();
    window.setTimeout(() => {
      link.remove();
    }, 0);
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
  // 如果url是blobUrl或者DataUrl
  // 直接将结果返回，免除编解码过程
  if (/^data\:(.+)?(;base64)?,/.test(url) || /^blob\:/.test(url)) {
    const fetchRes = await fetch(url);
    const fetchBuf = await fetchRes.arrayBuffer();
    const dataResult: ResponseMessage = {
      code: 200,
      headers: {},
      cookies: [],
      body: new Uint8Array(fetchBuf),
    };
    return new GatewayResponse(dataResult);
  }

  // 规范化路径，处理以//开始的路径
  if (url.startsWith("//")) {
    url = window.location.protocol + url;
  }

  // 获取配置
  const defaultOption: PostOption = {
    method: "GET",
    compress: true,
  };
  if (isPlainObject(option)) {
    option = { ...defaultOption, ...option };
  } else {
    option = defaultOption;
  }

  // 创建消息
  const payload = await createRequestMessage(url, option);

  if (config.debug) {
    console.log(`Request Message: \n\n`, payload, "\n\n");
  }

  const message = (pbRoot as Namespace).lookupType("main.RequestMessage");
  const verifyErr = message.verify(payload);

  // 如果消息无法编码，报错
  if (verifyErr) {
    throw new Error(`Message verification failure: ${verifyErr}`);
  }

  const pbMessage = message.create(payload);
  const buffer = message.encode(pbMessage).finish();

  // 如果网关地址没有配置，报错
  if (!config.entry) {
    throw new Error(`Gateway entry address cannot be empty`);
  }

  let finalBuffer: Uint8Array;
  if (option.compress) {
    // 如果设置启用压缩
    const zlibBuffer = zlib.deflate(buffer);
    finalBuffer = new Uint8Array(1 + zlibBuffer.byteLength);
    finalBuffer.set(Uint8Array.of(1), 0);
    finalBuffer.set(zlibBuffer, 1);
  } else {
    finalBuffer = new Uint8Array(1 + buffer.byteLength);
    finalBuffer.set(Uint8Array.of(0), 0);
    finalBuffer.set(buffer, 1);
  }

  // 推送请求到网关
  const response = await fetch(config.entry, {
    method: "POST",
    body: finalBuffer,
  });

  // 接收网关响应
  let responseBuf = await response.arrayBuffer();
  let protobuf = new Uint8Array(responseBuf);
  // 如果启用了压缩，则默认要先解压缩
  if (option.compress) {
    protobuf = zlib.inflate(protobuf);
  }
  const respMessage = (pbRoot as Namespace).lookupType("main.ResponseMessage");
  const respPbMessage = respMessage.decode(new Uint8Array(protobuf));
  const result = respMessage.toObject(respPbMessage) as ResponseMessage;

  if (config.debug) {
    console.log("Response Message: \n\n", result, "\n\n");
  }

  // 处理接收到的信息
  addCookiesByUrl(url, result.cookies);

  // 读取响应类型
  return new GatewayResponse(result);
}
