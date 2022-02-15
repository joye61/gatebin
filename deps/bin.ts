export type FileItem = {
  name: string;
  size: number;
  file: Blob;
};

export interface DataType {
  url: string;
  method?: string;
  headers?: HeadersInit;
  params?: Record<string, number | string | boolean | null>;
  filesMap?: Array<Omit<FileItem, "file">>;
}

export interface RequestData {
  data: DataType;
  files?: Array<FileItem>;
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


export async function buf2str(buffer:ArrayBuffer) {
  // return String.fromCharCode.apply(null, new Uint8Array(buffer))
 return  Array.from(new Uint8Array(buffer), (e) => String.fromCharCode(e)).join('')
}

/**
 * 请求数据编码
 * @param data 
 * @returns 
 */
export async function encode(data: RequestData): Promise<Uint8Array> {
  // 文件上传相关
  let filesMapBuf = new ArrayBuffer(0);
  let filesMap: DataType["filesMap"] = [];
  let files: Blob[] = [];
  let filesTotalSize: number = 0;
  if (Array.isArray(data.files) && data.files.length) {
    filesMap = data.files.map((item) => {
      files.push(item.file);
      filesTotalSize += item.file.size;
      return {
        name: item.name,
        size: item.file.size,
      };
    });
    filesMapBuf = await str2buf(JSON.stringify(filesMap));
  }
  if (filesMap.length) {
    data.data.filesMap = filesMap;
  }
 
  // 数据缓存
  const dataBuf = await str2buf(JSON.stringify(data.data));

  // 创建缓冲区
  const buf = new ArrayBuffer(2 + dataBuf.byteLength + filesTotalSize);
  const bin = new Uint8Array(buf);

  // 写入数据的长度
  let offset = 0;
  bin.set(Uint16Array.of(dataBuf.byteLength), offset);
  offset += 2;

  console.log("数据域长度：", dataBuf.byteLength);

  // 写入数据
  bin.set(new Uint8Array(dataBuf), offset);
  offset += dataBuf.byteLength;

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
 * @param data
 * @returns
 */
export function decode(data: ArrayBuffer) {

  // TODO
  console.log(data,'data')
  const bin = new Uint8Array(data);
  // buf2str()

  return {};
}
