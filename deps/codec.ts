import isTypedArray from "lodash/isTypedArray";

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
          name: item.name,
          size: item.file.size,
        });
      }
    });
  }
  params.files = filesMap;

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
  const paramsBuf = await str2buf(JSON.stringify(params));

  // 创建缓冲区
  const buf = new ArrayBuffer(
    2 + paramsBuf.byteLength + rawBuf.byteLength + filesTotalSize
  );
  const bin = new Uint8Array(buf);

  // 写入参数的长度
  let offset = 0;
  bin.set(Uint16Array.of(paramsBuf.byteLength), offset);
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
export async function decode<T>(data: ArrayBuffer): Promise<T> {
  // TODO
  return {} as T;
}
