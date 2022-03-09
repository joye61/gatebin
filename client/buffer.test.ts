import { buf2str, decode, encode, str2buf } from "./buffer";
import {
  BinParam,
  FileItem,
  RawBody,
  ResponseMessage,
  type RequestMessage,
} from "./types";
import zlib from "pako";
import _ from "lodash";
import { Ctypes } from "./mime";

test("string & buffer conversion", async () => {
  const str: string = "hello wo汉漢😀❌rld1*";
  const buf = Uint8Array.of(
    104,
    101,
    108,
    108,
    111,
    32,
    119,
    111,
    230,
    177,
    137,
    230,
    188,
    162,
    240,
    159,
    152,
    128,
    226,
    157,
    140,
    114,
    108,
    100,
    49,
    42
  );

  const t1 = await str2buf(str);
  expect(_.isEqual(new Uint8Array(t1), buf)).toBe(true);

  const t2 = await buf2str(buf);
  expect(t2).toEqual(str);
});

/**
 * 制造一些数据
 * @param type
 */
async function mockRequestMessage(type: number) {
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

  const rawBodyTextBuf = await str2buf("hello world");
  const rawBodyWithText: RawBody = {
    enabled: true,
    type: 0,
    size: rawBodyTextBuf.byteLength,
    bodyAsText: "hello world",
  };

  const rawBodyBin = Uint8Array.of(1, 2, 3, 4, 5);
  const rawBodyWithBin: RawBody = {
    enabled: true,
    type: 1,
    size: rawBodyBin.byteLength,
    bodyAsBinary: rawBodyBin,
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
      msg.rawBody = rawBodyWithText;
      break;
    case 2:
      msg.files = [];
      msg.rawBody = rawBodyWithText;
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
      msg.rawBody = rawBodyWithText;
      break;
    case 7:
      msg.compress = true;
      msg.files = [];
      msg.rawBody = rawBodyWithoutValue;
      break;
    case 8:
      msg.compress = true;
      msg.files = files;
      msg.rawBody = rawBodyWithBin;
      break;
    case 9:
      msg.compress = true;
      msg.files = [];
      msg.rawBody = rawBodyWithBin;
      break;
  }

  return <RequestMessage>msg;
}

/**
 * 根据不同的消息类型进行编码测试
 * @param msg
 */
async function encodeTest(msg: RequestMessage) {
  // 输入编码
  const bin = await encode(msg);
  // 接下来的逻辑确保输出编码可以正常反解出来
  // 1、读取第一个字节，查看压缩与否
  const compress = bin.subarray(0, 1)[0];
  let dataPart: Uint8Array;
  if (compress === 1) {
    dataPart = zlib.inflate(bin.subarray(1));
  } else {
    dataPart = bin.subarray(1);
  }

  // 2、读取4个字节的参数长度数据
  const lenView = new DataView(dataPart.slice(0, 4).buffer);
  const paramLen = lenView.getUint32(0);
  // 3、读取param数据
  let offset = 4;
  const paramData = dataPart.subarray(offset, offset + paramLen);
  const param: BinParam = JSON.parse(await buf2str(paramData));
  offset += paramLen;
  expect(param).toHaveProperty("url");
  expect(param).toHaveProperty("method");
  expect(param).toHaveProperty("headers");
  expect(param).toHaveProperty("params");
  expect(param).toHaveProperty("rawBody");
  expect(param).toHaveProperty("files");

  // 4、读取RawBody
  const rawBodyDef = param.rawBody;
  const rawBodyData = dataPart.subarray(offset, offset + rawBodyDef.size);
  if (rawBodyDef.enabled) {
    if (rawBodyDef.type === 0) {
      const rawBodyText = await buf2str(rawBodyData);
      expect(_.isEqual(rawBodyText, msg.rawBody.bodyAsText)).toBe(true);
    } else if (rawBodyDef.type === 1) {
      expect(_.isEqual(rawBodyData, msg.rawBody.bodyAsBinary)).toBe(true);
    }
  }
  offset += rawBodyDef.size;

  // 5、读取文件列表
  if (param.files.length) {
    param.files.forEach((item, index) => {
      const fileData = dataPart.subarray(offset, offset + item.size);
      offset += item.size;
      expect(_.isEqual(fileData, msg.files[index].data)).toBe(true);
    });
  }
}

describe("Test request message encoding", () => {
  test("type-1", async () => {
    const msg = await mockRequestMessage(1);
    await encodeTest(msg);
  });
  test("type-2", async () => {
    const msg = await mockRequestMessage(2);
    await encodeTest(msg);
  });
  test("type-3", async () => {
    const msg = await mockRequestMessage(3);
    await encodeTest(msg);
  });
  test("type-4", async () => {
    const msg = await mockRequestMessage(4);
    await encodeTest(msg);
  });
  test("type-5", async () => {
    const msg = await mockRequestMessage(5);
    await encodeTest(msg);
  });
  test("type-6", async () => {
    const msg = await mockRequestMessage(6);
    await encodeTest(msg);
  });
  test("type-7", async () => {
    const msg = await mockRequestMessage(7);
    await encodeTest(msg);
  });
  test("type-8", async () => {
    const msg = await mockRequestMessage(8);
    await encodeTest(msg);
  });
  test("type-9", async () => {
    const msg = await mockRequestMessage(9);
    await encodeTest(msg);
  });
});

type TestResp = ResponseMessage & {
  compress: boolean;
};

async function mockResponseMessage(type: number): Promise<TestResp> {
  let compress = true;
  let code = 200;
  let headers: Record<string, string[]> = {};
  let body: Uint8Array;
  switch (type) {
    case 1:
      headers = {
        "Content-Type": [Ctypes.Plain],
      };
      body = new Uint8Array(await str2buf("hello world"));
      break;
    case 2:
      headers = {
        "Content-Type": [Ctypes.JSON],
      };
      body = new Uint8Array(await str2buf(JSON.stringify({ a: 1, b: 2 })));
      break;
    case 3:
      compress = false;
      headers = {
        "Content-Type": [Ctypes.Plain],
      };
      body = new Uint8Array(await str2buf("hello world"));
      break;
    case 4:
      compress = false;
      headers = {
        "Content-Type": [Ctypes.JSON],
      };
      body = new Uint8Array(await str2buf(JSON.stringify({ a: 1, b: 2 })));
      break;
    case 5:
      body = new Uint8Array(await str2buf("hello world"));
      break;
    default:
      body = new Uint8Array(0);
  }

  return { compress, code, headers, body };
}

async function decodeTest(msg: TestResp) {
  // 开始编码
  // 1、b1
  const b1 = Uint8Array.of(msg.compress ? 1 : 0);
  // 2、b3
  const paramBuf = await str2buf(
    JSON.stringify({ code: msg.code, headers: msg.headers })
  );
  const b3 = new Uint8Array(paramBuf);
  // 3、b2
  const b2view = new DataView(new ArrayBuffer(4));
  b2view.setUint32(0, b3.byteLength);
  const b2 = new Uint8Array(b2view.buffer);
  // 4、b4
  const b4 = msg.body;

  let dataPart = new Uint8Array(b2.byteLength + b3.byteLength + b4.byteLength);
  let offset = 0;
  for (let b of [b2, b3, b4]) {
    dataPart.set(b, offset);
    offset += b.byteLength;
  }

  if (msg.compress) {
    dataPart = zlib.deflate(dataPart);
  }

  let bin = new Uint8Array(b1.byteLength + dataPart.byteLength);
  offset = 0;
  for (let b of [b1, dataPart]) {
    bin.set(b, offset);
    offset += b.byteLength;
  }

  const result = await decode(bin);
  expect(result.code).toBe(msg.code);
  expect(result.headers).toMatchObject(msg.headers);
  expect(_.isEqual(result.body, msg.body)).toBe(true);
  
}

// Test decoding logic
describe("Test response message decoding", () => {
  test("type-1", async () => {
    const msg = await mockResponseMessage(1);
    await decodeTest(msg);
  });
  test("type-2", async () => {
    const msg = await mockResponseMessage(2);
    await decodeTest(msg);
  });
  test("type-3", async () => {
    const msg = await mockResponseMessage(3);
    await decodeTest(msg);
  });
  test("type-4", async () => {
    const msg = await mockResponseMessage(4);
    await decodeTest(msg);
  });
  test("type-5", async () => {
    const msg = await mockResponseMessage(5);
    await decodeTest(msg);
  });
});
