export type BodyData = Record<string, number | string | Blob | ArrayBuffer>;

export type Cookie = {
  value: string;
  expires: string;
  maxAge: string;
};

export type FileItem = {
  name: string;
  length: number;
  file: Blob;
};

export interface RequestBinData {
  url: string;
  method: string;
  headers?: HeadersInit;
  data?: Record<string, number | string | Blob | ArrayBuffer>;
  cookies?: {
    [key: string]: string;
  };
  // 表单中有可能有文件上传
  files?: Array<FileItem>;
}

export interface ResponseBinData {
  headers?: HeadersInit;
  body?: Record<string, number | string>;
  cookies?: {
    [key: string]: Cookie;
  };
}

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
 * 请求数据编码为二进制
 * @param data
 * @returns
 */
export async function encode(data: RequestBinData): Promise<Uint8Array> {
  // 数据转换为字节流
  const urlBuf = await str2buf(data.url);
  const methodBuf = await str2buf(data.method);
  let headersBuf = new ArrayBuffer(0);
  if (data.headers) {
    headersBuf = await str2buf(JSON.stringify(data.headers));
  }
  let dataBuf = new ArrayBuffer(0);
  if (data.data) {
    dataBuf = await str2buf(JSON.stringify(data.data));
  }
  let cookiesBuf = new ArrayBuffer(0);
  if (data.cookies) {
    cookiesBuf = await str2buf(JSON.stringify(data.cookies));
  }

  // 文件上传相关
  let filesMapBuf = new ArrayBuffer(0);
  let files: Blob[] = [];
  if (Array.isArray(data.files) && data.files.length) {
    const filesMap = data.files.map((item) => {
      files.push(item.file);
      return {
        name: item.name,
        length: item.file.size,
      };
    });
    filesMapBuf = await str2buf(JSON.stringify(filesMap));
  }

  // 字节总长度
  const headerLen = 11;
  const contentLen =
    urlBuf.byteLength +
    methodBuf.byteLength +
    headersBuf.byteLength +
    dataBuf.byteLength +
    cookiesBuf.byteLength +
    filesMapBuf.byteLength;
  const filesLen = files.reduce(
    (prev: number, file: Blob) => prev + file.size,
    0
  );

  const buf = new ArrayBuffer(headerLen + contentLen + filesLen);
  const bin = new Uint8Array(buf);
  let offset = 0;

  // 1、编码头部
  bin.set(Uint16Array.of(urlBuf.byteLength), offset);
  offset += 2;
  bin.set(Uint8Array.of(methodBuf.byteLength), offset);
  offset += 1;
  bin.set(Uint16Array.of(headersBuf.byteLength), offset);
  offset += 2;
  bin.set(Uint16Array.of(dataBuf.byteLength), offset);
  offset += 2;
  bin.set(Uint16Array.of(cookiesBuf.byteLength), offset);
  offset += 2;
  bin.set(Uint16Array.of(filesMapBuf.byteLength), offset);
  offset += 2;

  // 2、编码数据
  bin.set(new Uint8Array(urlBuf), offset);
  offset += urlBuf.byteLength;
  bin.set(new Uint8Array(methodBuf), offset);
  offset += methodBuf.byteLength;
  bin.set(new Uint8Array(headersBuf), offset);
  offset += headersBuf.byteLength;
  bin.set(new Uint8Array(dataBuf), offset);
  offset += dataBuf.byteLength;
  bin.set(new Uint8Array(cookiesBuf), offset);
  offset += cookiesBuf.byteLength;
  bin.set(new Uint8Array(filesMapBuf), offset);
  offset += filesMapBuf.byteLength;

  // 3、编码文件
  for (let file of files) {
    const fileBuf = await file.arrayBuffer();
    bin.set(new Uint8Array(fileBuf), offset);
    offset += fileBuf.byteLength;
  }

  return bin;
}

/**
 * 解码二进制返回数据
 * @param data
 * @returns
 */
export function decode(data: ArrayBuffer): ResponseBinData {
  // TODO
  return {};
}
