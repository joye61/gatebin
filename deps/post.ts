import { encode, decode } from "./codec";
import { config as bgConfig } from "./config";
import isPlainObject from "lodash/isPlainObject";

/**
 * 解析将要发送的数据
 * @param url
 * @param option
 * @returns
 */
function getWillSendData(url: string, option?: PostOption): WillSendData {
  // 规范化路径，处理以//开始的路径
  if (url.startsWith("//")) {
    url = window.location.protocol + url;
  }

  // 默认配置
  let config: PostOption = {
    method: "GET",
  };
  if (isPlainObject(option)) {
    config = { ...config, ...option };
  }

  // 将要发送到网关的数据
  const willSendData: WillSendData = {
    url,
    method: config.method!.toUpperCase(),
    raw: {
      sendAsRaw: false,
    },
  };

  // 设置Headers键全部小写，便于解析
  const headers: PostOption["headers"] = {};
  if (config.headers) {
    for (let key in config.headers) {
      headers[key.toLowerCase()] = config.headers[key];
    }
  }

  // 将值设置未原始待传输数据
  const setAsRaw = (content: RawInfo["content"]) => {
    willSendData.raw.sendAsRaw = true;
    willSendData.raw.content = content;
  };

  // 规范内容类型，这一步是确保Content-Type头存在且合理
  if (config.body instanceof URLSearchParams) {
    headers["content-type"] = "application/x-www-form-urlencoded";
    const params: Record<string, string> = {};
    config.body.forEach((value, key) => {
      params[key] = value;
    });
    willSendData.params = params;
  } else if (config.body instanceof FormData) {
    // FormData类型可能会包含文件上传
    headers["content-type"] = "multipart/form-data";
    const params: Record<string, string> = {};
    const files: Array<FileItem> = [];
    config.body.forEach((value, key) => {
      if (value instanceof File) {
        files.push({
          name: value.name,
          size: value.size,
          file: value,
        });
      } else {
        params[key] = value;
      }
    });
    willSendData.params = params;
    willSendData.files = files;
  } else if (config.body instanceof Blob) {
    // Blob类型优先读取自带类型，如果没有，则当做原始二进制
    if (config.body.type) {
      headers["content-type"] = config.body.type;
    } else {
      headers["content-type"] = "application/octet-stream";
    }
    setAsRaw(config.body);
  } else if (isPlainObject(config.body)) {
    // JSON对象类型要么以json形式发送，要么以URLSearchParams发送
    if (
      headers["content-type"] &&
      /^application\/json/.test(headers["content-type"])
    ) {
      headers["content-type"] = "application/json";
      setAsRaw(JSON.stringify(config.body));
    } else {
      headers["content-type"] = "application/x-www-form-urlencoded";
      willSendData.params = config.body as Record<string, string>;
    }
  } else if (typeof config.body === "string") {
    // 字符串类型
    headers["content-type"] = "text/plain";
    setAsRaw(config.body);
  } else {
    // 其余类型都当做原始二进制
    headers["content-type"] = "application/octet-stream";
    setAsRaw(config.body as RawInfo["content"]);
  }

  // 更新headers
  willSendData.headers = headers;
  return willSendData;
}

/**
 * 以二进制形式发送请求
 * @param input
 * @param init
 * @returns
 */
export async function POST<T>(url: string, option?: PostOption): Promise<T> {
  // 解析输入数据
  const willSendData = getWillSendData(url, option);

  // 编码数据
  const data = await encode(willSendData);

  // 发送请求到网关
  const response = await fetch(bgConfig.gatewayUrl, {
    method: "POST",
    body: data.buffer,
  });

  // 数据解码并将解码结果返回
  const result = await response.arrayBuffer();
  return decode<T>(result);
}
