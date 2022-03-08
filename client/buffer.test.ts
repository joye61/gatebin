/**
 * @jest-environment jsdom
 */

import { buf2str, encode, str2buf } from "./buffer";
import { BinParam, FileItem, RawBody, type RequestMessage } from "./types";
import _, { cloneDeep } from "lodash";

beforeAll(() => {
  // https://github.com/jsdom/jsdom/issues/2555
  // Polyfill jsdom Blob.arrayBuffer
  Blob.prototype.arrayBuffer = async function () {
    return new Promise<ArrayBuffer>((resolve) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        resolve(reader.result as ArrayBuffer);
      });
      reader.readAsArrayBuffer(this);
    });
  };
});

test("Test string to buffer conversion", async () => {
  const str: string = "hello world";
  const t1 = await str2buf(str);
  expect(t1).toBeInstanceOf(ArrayBuffer);
});

test("Test buffer to string conversion", async () => {
  const str: string = "hello world";
  const buf = Uint8Array.of(
    104,
    101,
    108,
    108,
    111,
    32,
    119,
    111,
    114,
    108,
    100
  );
  const result = await buf2str(buf);
  expect(result).toBe(str);
});

/**
 * 制造一些数据
 * @param type
 */
async function mockdata(type: number) {
  // 构建测试数据
  const params: Record<string, string> = {
    a: "1",
    b: "2",
    c: "hello world",
  };
  const file = new File(["hello world"], "test.txt");
  const fileBuf = await file.arrayBuffer();
  const files: FileItem[] = [
    {
      key: "test",
      name: file.name,
      size: file.size,
      data: new Uint8Array(fileBuf),
    },
  ];
  const rawBodyWithValue: RawBody = {
    enabled: true,
    size: 0,
  };
  const rawBodyWithoutValue: RawBody = {
    enabled: false,
    size: 0,
  };
  const msg: Partial<RequestMessage> = {
    compress: false,
    url: "http://example.com",
    method: "GET",
    headers: {},
    params,
  };

  switch (type) {
    case 1:
      msg.files = files;
      msg.rawBody = rawBodyWithValue;
      break;
    case 2:
      msg.files = [];
      msg.rawBody = rawBodyWithValue;
      break;
    case 3:
      msg.files = [];
      msg.rawBody = rawBodyWithoutValue;
      break;
    case 4:
      msg.files = files;
      msg.rawBody = rawBodyWithoutValue;
      break;
    case 5:
      msg.compress = true;
      msg.files = files;
      msg.rawBody = rawBodyWithoutValue;
      break;
    case 6:
      msg.compress = true;
      msg.files = files;
      msg.rawBody = rawBodyWithValue;
      break;
    case 7:
      msg.compress = true;
      msg.files = [];
      msg.rawBody = rawBodyWithoutValue;
      break;
  }

  const binParam = cloneDeep(msg);
  const rawBody = binParam.rawBody!;
  if (rawBody.enabled) {
    let b4: Uint8Array;
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
    binParam.rawBody = {
      enabled: false,
      size: 0,
    };
  }
  binParam.files = binParam.files!.map((file) => {
    return {
      key: file.key,
      name: file.name,
      size: file.size,
    };
  }) as any;

  return { msg: msg as RequestMessage, binParam: binParam as BinParam };
}

async function encodeTest(msg: RequestMessage, binParam: BinParam){
  const binMsg = await encode(msg);
  // 确保类型争取
  expect(binMsg).toBeInstanceOf(Uint8Array);
  const paramBuf = await str2buf(JSON.stringify(binParam));
  // 确保总长度正确
  expect(binMsg.byteLength).toBe(1 + 4 + paramBuf.byteLength + file.size);

  // 确保能读出参数区域长度
  const lenView = new DataView(binMsg.buffer, 1, 4);
  const paramLen = lenView.getUint32(0);
  expect(paramLen).toBe(paramBuf.byteLength);

  // 确保参数能正确解析
  const paramData = binMsg.subarray(5, 5 + paramLen);
  const paramStr = await buf2str(paramData);
  expect(JSON.parse(paramStr)).toEqual(binParam);

  // 读取文件内容
  const fstart = 5 + paramLen;
  const fileData = binMsg.subarray(fstart, fstart + file.size);
  const fileContent = await buf2str(fileData);
  expect(fileContent).toBe("hello world");
}

// Test coding logic
test("Test request message encode logic", async () => {
  // 构建测试数据
  const params: Record<string, string> = {
    a: "1",
    b: "2",
    c: "hello world",
  };
  const file = new File(["hello world"], "test.txt");
  const fileBuf = await file.arrayBuffer();
  const msg: RequestMessage = {
    compress: false,
    url: "http://example.com",
    method: "GET",
    headers: {},
    params,
    rawBody: {
      enabled: false,
      size: 0,
    },
    files: [
      {
        key: "test",
        name: file.name,
        size: file.size,
        data: new Uint8Array(fileBuf),
      },
    ],
  };

  // 最终需要解码的消息
  const binParam: BinParam = {
    url: "http://example.com",
    method: "GET",
    headers: {},
    params,
    rawBody: {
      enabled: false,
      size: 0,
    },
    files: [
      {
        key: "test",
        name: file.name,
        size: file.size,
      },
    ],
  };

  const binMsg = await encode(msg);
  // 确保类型争取
  expect(binMsg).toBeInstanceOf(Uint8Array);
  const paramBuf = await str2buf(JSON.stringify(binParam));
  // 确保总长度正确
  expect(binMsg.byteLength).toBe(1 + 4 + paramBuf.byteLength + file.size);

  // 确保能读出参数区域长度
  const lenView = new DataView(binMsg.buffer, 1, 4);
  const paramLen = lenView.getUint32(0);
  expect(paramLen).toBe(paramBuf.byteLength);

  // 确保参数能正确解析
  const paramData = binMsg.subarray(5, 5 + paramLen);
  const paramStr = await buf2str(paramData);
  expect(JSON.parse(paramStr)).toEqual(binParam);

  // 读取文件内容
  const fstart = 5 + paramLen;
  const fileData = binMsg.subarray(fstart, fstart + file.size);
  const fileContent = await buf2str(fileData);
  expect(fileContent).toBe("hello world");
});

// Test decoding logic
test("Test response message decode logic", async () => {});
