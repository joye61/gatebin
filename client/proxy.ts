import { buf2str, decode, encode } from "./buffer";
import { CtypeName, Ctypes } from "./mime";
import type {
  DebugResponseMessage,
  RequestMessage,
  RequestOption,
  ResponseMessage,
} from "./types";
import typeParse from "content-type";
import { toParamsFiles } from "./convert";
import isPlainObject from "lodash/isPlainObject";
import isTypedArray from "lodash/isTypedArray";
import { getId } from "./id";

export class ProxyResponse {
  code: number;
  body: Uint8Array;
  headers: Record<string, Array<string>>;
  constructor(message: ResponseMessage) {
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
  async json<T = any>(): Promise<T> {
    const str = await this.text();
    return JSON.parse(str);
  }

  /**
   * 返回Blob
   * @returns
   */
  async blob(): Promise<Blob> {
    let option: BlobPropertyBag = {};
    const contentType = this.headers[CtypeName]?.[0] || "";
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
    const disposition = this.headers["content-disposition"]?.[0];
    if (disposition) {
      const regRes = disposition.match(/filename\=\"(.*?)\"/);
      if (regRes?.[1]) {
        finalName = regRes[1];
      }
    }
    link.download = finalName;
    link.href = url;
    link.click();
    await new Promise<void>((resolve) => {
      window.setTimeout(() => {
        link.remove();
        resolve();
      }, 0);
    });
  }
}

/**
 * 根据输入创建消息类型
 * @param url
 * @param option
 * @returns
 */
export async function createRequestMessage(
  url: string,
  option: RequestOption
): Promise<RequestMessage> {
  // 定义消息
  const message: RequestMessage = {
    compress: option.compress!,
    url,
    method: option.method?.toUpperCase() ?? "GET",
    headers: {},
    params: {},
    rawBody: {
      enabled: false,
    },
    files: [],
  };

  // 下列方法没有请求体，直接返回
  if (["GET", "CONNECT", "HEAD", "OPTIONS", "TRACE"].includes(option.method!)) {
    return message;
  }

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
    const { params } = await toParamsFiles(option.body);
    message.headers[CtypeName] = Ctypes.UrlEncoded;
    message.params = params;
  }

  // body: FormData
  else if (option.body instanceof FormData) {
    // FormData类型可能会包含文件上传
    const { params, files } = await toParamsFiles(option.body);
    message.headers[CtypeName] = Ctypes.FormData;
    message.params = params;
    message.files = files;
  }

  // body: Record<string, string>
  else if (isPlainObject(option.body)) {
    // 提取对象中可能存在的文件列表和纯对象列表
    const { params, files } = await toParamsFiles(
      option.body as Record<string, string | File>
    );

    // 如果文件列表不为空，只能为FormData类型
    if (files.length) {
      message.headers[CtypeName] = Ctypes.FormData;
      message.params = params;
      message.files = files;
    } else {
      // JSON对象类型，需要剔除文件
      if (userCtype === Ctypes.JSON) {
        message.headers[CtypeName] = Ctypes.JSON;
        rawBody.enabled = true;
        rawBody.type = 0;
        rawBody.bodyAsText = JSON.stringify(params);
      } else if (userCtype === Ctypes.FormData) {
        message.headers[CtypeName] = Ctypes.FormData;
        message.params = params;
      } else {
        message.headers[CtypeName] = Ctypes.UrlEncoded;
        message.params = params;
      }
    }
  }

  // body: string
  else if (typeof option.body === "string") {
    if (userCtype === Ctypes.UrlEncoded) {
      const search = new URLSearchParams(option.body);
      const { params } = await toParamsFiles(search);
      message.headers[CtypeName] = Ctypes.UrlEncoded;
      message.params = params;
    } else {
      // 字符串类型
      message.headers[CtypeName] = userCtype || Ctypes.Plain;
      rawBody.enabled = true;
      rawBody.type = 0;
      rawBody.bodyAsText = option.body;
    }
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
    rawBody.bodyAsBinary = new Uint8Array(buf);
  }

  // body: ArrayBuffer
  else if (option.body instanceof ArrayBuffer) {
    // 字符串类型
    message.headers[CtypeName] = Ctypes.OctetStream;
    rawBody.enabled = true;
    rawBody.type = 1;
    rawBody.bodyAsBinary = new Uint8Array(option.body);
  }

  // body: TypedArray
  else if (isTypedArray(option.body)) {
    // 其余类型都当做原始二进制
    message.headers[CtypeName] = Ctypes.OctetStream;
    rawBody.enabled = true;
    rawBody.type = 1;
    rawBody.bodyAsBinary = new Uint8Array(option.body!.buffer as Uint8Array);
  }

  // body: 其他类型都当做纯文本原始类型处理
  else {
    if (userCtype) {
      message.headers[CtypeName] = userCtype;
    } else {
      message.headers[CtypeName] = Ctypes.Plain;
    }
    rawBody.enabled = true;
    rawBody.type = 0;
    rawBody.bodyAsText = option.body ? String(option.body) : "";
  }

  return message;
}

/**
 * 获取用于调试的消息头
 * @param id
 * @param type
 * @returns
 */
function getFormatMessageHeader(
  id: number,
  type: "Request" | "Response"
): string[] {
  return [
    `%c${type} Message: %c[${id}]`,
    "background-color:blue;color:#fff;padding:5px 0 5px 10px",
    "background-color:blue;color:red;padding:5px 10px 5px 0;font-weight:bold",
  ];
}

// 发送代理请求
export async function request(
  url: string,
  option?: RequestOption
): Promise<ProxyResponse> {
  // 请求地址不能为空
  if (!url) {
    throw new Error("The request url cannot be empty");
  }

  // 如果url是blobUrl或者DataUrl
  // 直接将结果返回，免除编解码过程
  if (/^data\:(.+)?(;base64)?,/.test(url) || /^blob\:/.test(url)) {
    const fetchRes = await fetch(url);
    const fetchBuf = await fetchRes.arrayBuffer();
    const dataResult: ResponseMessage = {
      code: 200,
      headers: {},
      body: new Uint8Array(fetchBuf),
    };
    return new ProxyResponse(dataResult);
  }

  // 规范化路径，处理以//开始的路径
  if (url.startsWith("//")) {
    url = window.location.protocol + url;
  }

  // 获取配置
  const defaultOption: RequestOption = {
    compress: true,
    debug: false,
  };
  if (isPlainObject(option)) {
    option = { ...defaultOption, ...option };
  } else {
    option = defaultOption;
  }
  option.method = option.method?.toUpperCase() ?? "GET";

  // 创建消息
  const payload = await createRequestMessage(url, option);

  // 当前的消息id
  const id = getId();
  if (option.debug) {
    console.log(
      ...getFormatMessageHeader(id, "Request"),
      "\n\n",
      payload,
      "\n\n"
    );
  }

  // 推送请求到网关
  const finalBuffer = await encode(payload);
  const response = await fetch(window.location.origin + "/__gb", {
    method: "POST",
    body: finalBuffer,
  });

  // 接收网关响应
  let responseBuf = await response.arrayBuffer();
  const result = await decode(new Uint8Array(responseBuf));

  // debug模式显示调试信息
  if (option.debug) {
    const debugResult: DebugResponseMessage = result;
    const resTypeRaw = result.headers[CtypeName]?.[0] ?? "";
    const { type } = typeParse.parse(resTypeRaw);
    // 如果响应是JSON类型，返回解析后的对象
    if (type === Ctypes.JSON) {
      const text = await buf2str(result.body);
      try {
        debugResult.bodyAsJson = JSON.parse(text);
      } catch (error) {
        debugResult.bodyAsJson = (<SyntaxError>error).message;
      }
    }

    // 如果响应是文本类型，返回解析后的文本
    const checks: string[] = [
      Ctypes.AJS,
      Ctypes.JS,
      Ctypes.CSS,
      Ctypes.HTML,
      Ctypes.Plain,
    ];
    if (checks.includes(type)) {
      const text = await buf2str(result.body);
      debugResult.bodyAsText = text;
    }
    console.log(
      ...getFormatMessageHeader(id, "Response"),
      "\n\n",
      debugResult,
      "\n\n"
    );
  }

  // 读取响应类型
  return new ProxyResponse(result);
}
