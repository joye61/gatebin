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
  
  let url:string = 'https://www.chelun.com'
  
  let path: string 
  if(typeof input == 'string'){
    path = url+ "/" + input.replace(/^\/*|\/*$/g, "");
   
  }

  
 console.log(input,init?.body,'par')
 
 
  // 测试数据
  const data = await encode({
    data: {
      url:typeof input == 'string' ? url+ "/" + input.replace(/^\/*|\/*$/g, "") : input.url,
      method:init?.method || 'GET',
      params: typeof init?.body == 'string' ? JSON.parse(init?.body) : init?.body,
    },

  });

 
  const form = new FormData();
  form.set("data", new Blob([data], { type: "application/octet-stream" }));

  // 发送请求
  const resp = await fetch(config.gatewayUrl, {
    method: "POST",
    body: data.buffer,
  });

  


  const res = await resp.arrayBuffer();
  console.log(res,'res');

 
  // TODO
  return {} as O;
}

post('/to',{method: "GET", body: JSON.stringify({a:1,b:2,})})