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
  const gatewayUrl = config.gatewayUrl;
  
  // data = ...
  // fetch(gatewayUrl, "POST", encode(data))

  // TODO
  console.log("here we go");
  return {} as O;
}
