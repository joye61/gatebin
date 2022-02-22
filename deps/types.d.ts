declare const process: any;

type FileItem = {
  // 文件名
  filedName: string;
  // 文件大小
  size: number;
  // 文件源数据
  file?: File;
  // 文件名
  fileName: string;
};

type CookiesItem = {
  // cookie name=value
  cookies: string;
  // 名称
  Name?: string;
  // 值
  Value?: string;
  // 有效期
  RawExpires?: string;
  // 有效期 时间戳 比expire优先级高
  MaxAge?: number;
  // 域名
  Domain?:string;

};

type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

type RawInfo = {
  sendAsRaw: boolean;
  size?: number;
  content?: string | Blob | ArrayBuffer | TypedArray;
};

// 即将发送的数据封装
interface WillSendData {
  url: string;
  method: string;
  headers?: Record<string, string>;
  // 参数内容
  params?: Record<string, string>;
  // 原始文件信息
  raw: RawInfo;
  // 上传的文件信息
  files?: Array<FileItem>;
}

// 请求参数
interface PostOption {
  body?: XMLHttpRequestBodyInit | null | Record<string, string>;
  headers?: Record<string, string>;
  method?: string;
}

interface WillSendBinParams {
  url: string;
  method: string;
  headers: Record<string, string>;
  params?: Record<string, string>;
  raw: RawInfo;
  files?: Array<FileItem>;
}

interface WillReceiveBinParams {
  cookies?: Array<CookiesItem>;
  headers: Record<string, string>;
  contentLength: number;
}

interface DecodeData {
  params: WillReceiveBinParams;
  body: Uint8Array;
}

interface IGatewayResponse {
  text(): Promise<string>;
  json(): Promise<Record<string, any>>;
  blob(): Promise<Blob>;
  arrayBuffer(): Promise<ArrayBuffer>;
  blobUrl(): Promise<string>;
}
