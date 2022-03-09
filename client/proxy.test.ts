import { str2buf } from "./buffer";
import { ProxyResponse, createRequestMessage, request } from "./proxy";
import isEqual from "lodash/isEqual";
import { type RequestOption } from "./types";
import { CtypeName, Ctypes } from "./mime";

describe("Test response parse", () => {
  test("response as text", async () => {
    const text = "hello world";
    const body = new Uint8Array(await str2buf(text));
    const pr = new ProxyResponse({
      code: 200,
      headers: {},
      body,
    });
    const result = await pr.text();
    expect(result).toBe(text);
  });

  test("response as json", async () => {
    const json = {
      a: 1,
      b: 2,
      c: "中国",
      d: {
        a: 2,
        b: [1, 2],
      },
      e: undefined,
      f: false,
      g: null,
    };
    const body = new Uint8Array(await str2buf(JSON.stringify(json)));
    const pr = new ProxyResponse({
      code: 200,
      headers: {},
      body,
    });
    const result = await pr.json();
    expect(result).toEqual(json);
  });

  test("response as blob", async () => {
    const blob = new Blob([Uint8Array.of(1, 2, 3)]);
    const buf = await blob.arrayBuffer();
    const body = new Uint8Array(buf);
    const pr = new ProxyResponse({
      code: 200,
      headers: {},
      body,
    });
    const result = await pr.blob();
    const resultBuf = await result.arrayBuffer();
    expect(isEqual(resultBuf, buf)).toBe(true);
  });

  test("response as arrayBuffer", async () => {
    const body = Uint8Array.of(1, 2, 3);
    const pr = new ProxyResponse({
      code: 200,
      headers: {},
      body,
    });
    const result = await pr.arrayBuffer();
    expect(isEqual(result, body.buffer)).toBe(true);
  });

  test("response as blobUrl", async () => {
    const blob = new Blob([Uint8Array.of(1, 2, 3)]);
    const blobUrl = URL.createObjectURL(blob);
    const bodyBuf = await blob.arrayBuffer();
    const body = new Uint8Array(bodyBuf);
    const pr = new ProxyResponse({
      code: 200,
      headers: {},
      body,
    });
    const result = await pr.blobUrl();
    expect(result).toEqual(blobUrl);
  });
});

async function createRequestOption(type: number) {
  const option: Partial<RequestOption> = {
    method: "POST",
    compress: true,
  };
  switch (type) {
    case 1: {
      const data = new FormData();
      data.set("a", "1");
      data.set("b", "你好");
      option.body = data;
      break;
    }

    case 2: {
      const fileBuf = await str2buf("hello world");
      const file = new File([fileBuf], "test.txt");
      const data = new FormData();
      data.set("a", "1");
      data.set("b", "你好");
      data.set("c", file);
      option.body = data;
      break;
    }

    case 3: {
      const data = new URLSearchParams();
      data.set("a", "1");
      data.set("b", "你好");
      option.body = data;
    }
    case 4: {
      option.body = {
        a: 1,
        b: "你好",
      } as any;
      break;
    }
    case 5: {
      const fileBuf = await str2buf("hello world");
      const file = new File([fileBuf], "test.txt");
      option.body = {
        a: 1,
        b: "你好",
        c: file,
      } as any;
      break;
    }
    case 6: {
      option.headers = {
        [CtypeName]: "application/json",
      };
      option.body = {
        a: "1",
        b: "你好",
      } as any;
      break;
    }
    case 7: {
      const fileBuf = await str2buf("hello world");
      const file = new File([fileBuf], "test.txt");
      option.headers = {
        [CtypeName]: "application/json",
      };
      option.body = {
        a: 1,
        b: "你好",
        c: file,
      } as any;
      break;
    }
    case 8: {
      option.body = "你好，好好";
      break;
    }
    case 9: {
      option.headers = {
        [CtypeName]: "application/json",
      };
      option.body = JSON.stringify({ a: 1 });
      break;
    }
    case 10: {
      option.body = new Blob([Uint8Array.of(1, 2)]);
      break;
    }
    case 11: {
      const buf = await str2buf(JSON.stringify({ a: 1, b: 2 }));
      option.body = new Blob([buf], { type: Ctypes.JSON });
      break;
    }
  }
  return option;
}

describe("Test create message", () => {
  test("c-1", async () => {
    const option = await createRequestOption(1);
    const result = await createRequestMessage("http://example.com", option);
    expect(result.headers[CtypeName]).toEqual(Ctypes.FormData);
    expect(result.params).toEqual({
      a: "1",
      b: "你好",
    });
    expect(result.rawBody.enabled).toBe(false);
  });
  test("c-2", async () => {
    const option = await createRequestOption(2);
    const result = await createRequestMessage("http://example.com", option);
    expect(result.headers[CtypeName]).toEqual(Ctypes.FormData);
    expect(result.params).toEqual({
      a: "1",
      b: "你好",
    });
    expect(result.rawBody.enabled).toBe(false);
    expect(result.files.length).toBe(1);
  });
  test("c-3", async () => {
    const option = await createRequestOption(3);
    const result = await createRequestMessage("http://example.com", option);
    expect(result.headers[CtypeName]).toEqual(Ctypes.UrlEncoded);
    expect(result.params).toEqual({
      a: "1",
      b: "你好",
    });
    expect(result.rawBody.enabled).toBe(false);
  });
  test("c-4", async () => {
    const option = await createRequestOption(4);
    const result = await createRequestMessage("http://example.com", option);
    expect(result.headers[CtypeName]).toEqual(Ctypes.UrlEncoded);
    expect(result.params).toEqual({
      a: "1",
      b: "你好",
    });
    expect(result.rawBody.enabled).toBe(false);
  });
  test("c-5", async () => {
    const option = await createRequestOption(5);
    const result = await createRequestMessage("http://example.com", option);
    expect(result.headers[CtypeName]).toEqual(Ctypes.FormData);
    expect(result.params).toEqual({
      a: "1",
      b: "你好",
    });
    expect(result.rawBody.enabled).toBe(false);
    expect(result.files.length).toBe(1);
  });
  test("c-6", async () => {
    const option = await createRequestOption(6);
    const result = await createRequestMessage("http://example.com", option);
    expect(result.headers[CtypeName]).toEqual(Ctypes.JSON);
    expect(result.params).toEqual({});
    expect(result.rawBody).toEqual({
      enabled: true,
      type: 0,
      bodyAsText: JSON.stringify({ a: "1", b: "你好" }),
    });
  });
  test("c-7", async () => {
    const option = await createRequestOption(7);
    const result = await createRequestMessage("http://example.com", option);
    expect(result.headers[CtypeName]).toEqual(Ctypes.FormData);
    expect(result.params).toEqual({
      a: "1",
      b: "你好",
    });
    expect(result.rawBody.enabled).toBe(false);
    expect(result.files.length).toBe(1);
  });
  test("c-8", async () => {
    const option = await createRequestOption(8);
    const result = await createRequestMessage("http://example.com", option);
    // expect(result.headers[CtypeName]).toEqual(Ctypes.JSON);
    expect(result.params).toEqual({});
    expect(result.rawBody).toEqual({
      enabled: true,
      type: 0,
      bodyAsText: "你好，好好",
    });
  });
  test("c-9", async () => {
    const option = await createRequestOption(9);
    const result = await createRequestMessage("http://example.com", option);
    expect(result.headers[CtypeName]).toEqual(Ctypes.JSON);
    expect(result.params).toEqual({});
    expect(result.rawBody).toEqual({
      enabled: true,
      type: 0,
      bodyAsText: JSON.stringify({ a: 1 }),
    });
  });
  test("c-10", async () => {
    const option = await createRequestOption(10);
    const result = await createRequestMessage("http://example.com", option);
    expect(result.headers[CtypeName]).toEqual(Ctypes.OctetStream);
    expect(result.params).toEqual({});
    expect(result.rawBody.enabled).toBe(true);
    expect(result.rawBody.type).toBe(1);
    expect(isEqual(result.rawBody.bodyAsBinary, Uint8Array.of(1, 2))).toBe(
      true
    );
  });
  test("c-11", async () => {
    const option = await createRequestOption(11);
    const result = await createRequestMessage("http://example.com", option);
    expect(result.headers[CtypeName]).toEqual(Ctypes.JSON);
    expect(result.params).toEqual({});
    expect(result.rawBody.enabled).toBe(true);
    expect(result.rawBody.type).toBe(1);
    const buf = await str2buf(JSON.stringify({ a: 1, b: 2 }));
    expect(isEqual(result.rawBody.bodyAsBinary, new Uint8Array(buf))).toBe(
      true
    );
  });
});

test("data url", async () => {
  const url = `data:text/plain;base64,${btoa("hello world")}`;
  const resp = await request(url);
  expect(resp).toBeInstanceOf(ProxyResponse);
  const result = await resp.text();
  expect(result).toBe("hello world");
});

// debug
test("Test debug", async () => {
  const _log = console.log.bind(console);
  console.log = jest.fn((...a: any[]) => {
    _log(...a);
  });
  try {
    await request("https://baidu.com", { debug: true });
    expect((console.log as jest.Mock).mock.calls.length).toBe(2);
  } catch (error) {
    expect((console.log as jest.Mock).mock.calls.length).toBe(1);
  }
  (console.log as jest.Mock).mockReset();
});
