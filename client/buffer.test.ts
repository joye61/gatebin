import { buf2str, encode, str2buf } from "./buffer";
import { BinParam, FileItem, RawBody, type RequestMessage } from "./types";
import zlib from "pako";
import _ from "lodash";

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
  expect(t1.byteLength).toBeGreaterThan(0);
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

  // 读取文件列表
}

describe("Test request message encoding", () => {
  test("type-1", async () => {
    const msg = await mockdata(1);
    await encodeTest(msg);
  });
  test("type-2", async () => {
    const msg = await mockdata(2);
    await encodeTest(msg);
  });
  test("type-3", async () => {
    const msg = await mockdata(3);
    await encodeTest(msg);
  });
  test("type-4", async () => {
    const msg = await mockdata(4);
    await encodeTest(msg);
  });
  test("type-5", async () => {
    const msg = await mockdata(5);
    await encodeTest(msg);
  });
  test("type-6", async () => {
    const msg = await mockdata(6);
    await encodeTest(msg);
  });
  test("type-7", async () => {
    const msg = await mockdata(7);
    await encodeTest(msg);
  });
  test("type-8", async () => {
    const msg = await mockdata(8);
    await encodeTest(msg);
  });
  test("type-9", async () => {
    const msg = await mockdata(9);
    await encodeTest(msg);
  });
});

// Test decoding logic
test("Test response message decode logic", async () => {});
