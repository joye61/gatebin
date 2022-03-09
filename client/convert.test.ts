import { str2buf } from "./buffer";
import { toParamsFiles } from "./convert";

describe("FormData | URLSearchParams | JSON sperate test", () => {
  test("FormData", async () => {
    const fileBuf = await str2buf("hello world");
    const file = new File([fileBuf], "test.txt");
    const data = new FormData();
    data.set("a", "1");
    data.set("b", "你好");
    data.set("c", file);
    const res = await toParamsFiles(data as any);
    expect(res.params).toEqual({
      a: "1",
      b: "你好",
    });
    expect(res.files.length).toBe(1);
    expect(res.files[0]).toEqual({
      key: "c",
      name: "test.txt",
      size: file.size,
      data: new Uint8Array(fileBuf),
    });
  });

  test("URLSearchParams", async () => {
    const data = new URLSearchParams();
    data.set("a", "1");
    data.set("b", "你好");
    const res = await toParamsFiles(data);
    expect(res.files.length).toBe(0);
    expect(res.params).toEqual({
      a: "1",
      b: "你好",
    });
  });

  test("JSON", async () => {
    const fileBuf = await str2buf("hello world");
    const file = new File([fileBuf], "test.txt");
    const data: any = {
      a: "1",
      b: "你好",
      c: file,
      d: 1,
      e: true,
      f: undefined,
      g: null,
      h: { a: 1 },
    };
    const res = await toParamsFiles(data);
    expect(res.files.length).toBe(1);
    expect(res.files[0]).toEqual({
      key: "c",
      name: "test.txt",
      size: file.size,
      data: new Uint8Array(fileBuf),
    });
    expect(res.params).toEqual({
      a: "1",
      b: "你好",
      d: "1",
      e: "true",
      f: "undefined",
      g: "null",
      h: "[object Object]",
    });
  });
});
