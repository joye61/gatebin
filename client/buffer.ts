import type {
  BinParam,
  FileItem,
  RequestMessage,
  ResponseMessage,
} from "./types";
import zlib from "pako";

/**
 * 字符串转ArrayBuffer
 * @param str
 * @returns
 */
export async function str2buf(str: string): Promise<ArrayBuffer> {
  const blob = new Blob([str]);
  if (typeof blob.arrayBuffer === "function") {
    return blob.arrayBuffer();
  }

  return new Promise<ArrayBuffer>((resolve) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve(reader.result as ArrayBuffer);
    });
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * ArrayBuffer转字符串
 * @param buffer
 * @returns
 */
export async function buf2str(buffer: BlobPart): Promise<string> {
  const blob = new Blob([buffer]);
  if (typeof blob.text === "function") {
    return blob.text();
  }

  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve(reader.result as string);
    });
    reader.readAsText(blob);
  });
}

/**
 * 请求消息编码
 *
 * -----------------------------
 * b1 是否压缩 1字节
 * -----------------------------
 * b2 参数长度 4字节
 *    代表是参数区占用的字节长度
 * -----------------------------
 * b3 参数区
 *    Method：请求方法
 *    URL：请求的地址
 *    Header：自定义请求头
 *    Params: 参数
 *    RawBody：RawBody描述对象
 *    Files：文件列表描述对象
 * -----------------------------
 * b4 RawBody
 *    可能是代表字符串的字节数组
 *    可能是原始二进制字节数组
 * -----------------------------
 * b5 文件列表
 * -----------------------------
 */
export async function encode(msg: RequestMessage): Promise<Uint8Array> {
  const binParam: Partial<BinParam> = {
    url: msg.url,
    method: msg.method,
    headers: msg.headers,
    params: msg.params,
  };

  // 解析b4
  const rawBody = msg.rawBody;
  let b4: Uint8Array;
  if (rawBody.enabled) {
    switch (rawBody.type) {
      case 0:
        const buf = await str2buf(rawBody.bodyAsText ?? "");
        b4 = new Uint8Array(buf);
        break;
      case 1:
        b4 = rawBody.bodyAsBinary ?? new Uint8Array(0);
        break;
      default:
        b4 = new Uint8Array(0);
        break;
    }
    binParam.rawBody = {
      enabled: true,
      type: rawBody.type,
      size: b4.byteLength,
    };
  } else {
    b4 = new Uint8Array(0);
    binParam.rawBody = {
      enabled: false,
    };
  }

  // 解析b5
  let fileTotalLen = 0;
  let files: Omit<FileItem, "data">[] = [];
  let fileList: Uint8Array[] = [];
  for (let file of msg.files) {
    fileTotalLen += file.size;
    files.push({
      key: file.key,
      name: file.name,
      size: file.size,
    });
    fileList.push(file.data!);
  }
  binParam.files = files;
  let b5 = new Uint8Array(fileTotalLen);
  let foffset = 0;
  for (let file of fileList) {
    b5.set(file, foffset);
    foffset += file.byteLength;
  }

  // 解析b3
  const paramBuf = await str2buf(JSON.stringify(binParam));
  const b3 = new Uint8Array(paramBuf);

  // 解析b2，必须以大端字节序写入
  const b2view = new DataView(new ArrayBuffer(4));
  b2view.setUint32(0, b3.byteLength);
  const b2 = new Uint8Array(b2view.buffer);

  // 生成除了压缩字节之外的数据包
  let dataPart = new Uint8Array(
    b2.byteLength + b3.byteLength + b4.byteLength + b5.byteLength
  );
  let offset = 0;
  for (let b of [b2, b3, b4, b5]) {
    dataPart.set(b, offset);
    offset += b.byteLength;
  }

  // 判断压缩逻辑
  let b1: Uint8Array;
  if (msg.compress) {
    b1 = Uint8Array.of(1);
    dataPart = zlib.deflate(dataPart);
  } else {
    b1 = Uint8Array.of(0);
  }

  // 生成最终的二进制对象
  const binary = new Uint8Array(b1.byteLength + dataPart.byteLength);
  offset = 0;
  for (let b of [b1, dataPart]) {
    binary.set(b, offset);
    offset += b.byteLength;
  }

  // 返回最终解析的对象
  return binary;
}

/**
 * 响应消息编码
 * -----------------------------
 * b1 是否压缩 1字节
 * -----------------------------
 * b2 参数长度 4字节
 * -----------------------------
 * b3 参数区
 *  code 响应code
 *  headers 响应头
 * -----------------------------
 * b4 远端原始body
 * -----------------------------
 *
 * @param resp
 */
export async function decode(resp: Uint8Array): Promise<ResponseMessage> {
  // 先读取第一个字节
  const b1 = resp.subarray(0, 1);
  let offset = 1;

  let dataPart: Uint8Array = resp.slice(1);
  if (b1[0] === 1) {
    dataPart = zlib.inflate(dataPart);
  }

  // 读取长度信息
  offset = 0;
  const lenView = new DataView(dataPart.buffer, offset, 4);
  const paramLen = lenView.getUint32(0);
  offset += 4;

  // 读取参数
  const paramData = dataPart.subarray(offset, offset + paramLen);
  const paramStr = await buf2str(paramData);
  const param = JSON.parse(paramStr) as {
    code: number;
    headers: Record<string, string[]>;
  };
  offset += paramLen;

  // 读取消息体
  const body = dataPart.slice(offset);
  // 最终请求体
  const headers: Record<string, string[]> = {};
  for (let key in param.headers) {
    headers[key.toLowerCase()] = param.headers[key];
  }

  return {
    code: param.code,
    headers: headers,
    body,
  };
}
