import { encode } from "./bin";
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
    url: "https://www.chelun.com",
    method: "GET",
    data: {
      a:1,b:2
    }
  });

  const b = new Blob([data]);

  // 发送请求
  const resp = await fetch(config.gatewayUrl, {
    method: "POST",
    body: new Blob([data]),
  });
  const res = await resp.arrayBuffer();
  console.log(res);

  // TODO
  return {} as O;
}
