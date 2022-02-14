export type BodyData = Record<string, number | string | Blob | ArrayBuffer>;

export type Cookie = {
  value: string;
  expires: string;
  maxAge: string;
};
export interface RequestBinData {
  url: string;
  method:
    | "GET"
    | "POST"
    | "PUT"
    | "DELETE"
    | "HEAD"
    | "OPTIONS"
    | "PATCH"
    | "TRACE";
  headers?: HeadersInit;
  body?: Record<string, number | string | Blob | ArrayBuffer>;
  cookies: {
    [key: string]: string;
  };
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
 * 请不求数据编码为二进制
 * @param data
 * @returns
 */
export function encode(data: RequestBinData): ArrayBuffer {
  // TODO
  return new ArrayBuffer(6);
}

/**
 *
 * @param data
 * @returns
 */
export function decode(data: ArrayBuffer): ResponseBinData {
  // TODO
  return {};
}
