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
  cookies: Array<{}>;
  headers: Record<string, string>;
  bodyLen: number;
}
