export interface RequestOption {
  // 请求体
  body?: XMLHttpRequestBodyInit | Record<string, string | File>;
  headers?: Record<string, string>;
  method?: string;
  // 是否启用消息压缩，使用zlib压缩
  compress?: boolean;
}

export interface FileItem {
  key: string;
  name: string;
  size: number;
  data: Uint8Array;
}

export interface RawBody {
  // 是否开启原始类型传输
  enabled: boolean;
  // 原始body的长度
  size: number;
  // 0: 纯文本， 1：二进制
  type?: 0 | 1;
  bodyAsText?: string;
  bodyAsBinary?: Uint8Array;
}

export interface RequestMessage {
  compress: boolean;
  url: string;
  method: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  rawBody: RawBody;
  files: Array<FileItem>;
}

export interface BinParam {
  url: string;
  method: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  rawBody: Omit<RawBody, "bodyAsText" | "bodyAsBinary">;
  files: Array<Omit<FileItem, "data">>;
}

export interface HeaderValue {
  value: string[];
}

export interface ResponseMessage {
  code: number;
  headers: Record<string, HeaderValue>;
  body: Uint8Array;
}

export interface DebugResponseMessage extends ResponseMessage {
  bodyAsJson?: any;
  bodyAsText?: any;
}
