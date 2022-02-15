import { encode,decode } from "./bin";
import { config } from "./config";

/**
 * 以二进制形式发送请求，参数签名同标准fetch一致
 * @param input
 * @param init
 * @returns
 */
export async function post<I, O extends object>(
  input: RequestInfo,
  init?: RequestInit
): Promise<O> {
  // 测试数据
  const data = await encode({
    data: {
      url: "https://www.chelun.com",
      method: "GET",
      params: {
        a: 1,
        b: 2,
      },
    },
  });

  // const form = new FormData();
  // form.set("data", new Blob([data], { type: "application/octet-stream" }));

  // 发送请求
  // const resp = await fetch(config.gatewayUrl, {
  //   method: "POST",
  //   body: data.buffer,
  // });

  


  // const res = await resp.arrayBuffer();
  // console.log(res,'res');

  // 解码
  const data1 = await decode(data.buffer);


  // TODO
  return {} as O;
}
