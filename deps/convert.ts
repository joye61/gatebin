import { type FileItem } from "./post";

/**
 * 字符串转ArrayBuffer
 * @param str
 * @returns
 */
export async function str2buf(str: string): Promise<ArrayBuffer> {
  const blob = new Blob([str], { type: "text/plain" });
  return blob.arrayBuffer();
}

/**
 * ArrayBuffer转字符串
 * @param buffer
 * @returns
 */
export async function buf2str(buffer: Uint8Array): Promise<string> {
  const blob = new Blob([buffer], { type: "text/plain" });
  if (typeof blob.text === "function") {
    return blob.text();
  } else {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        resolve(reader.result as string);
      });
      reader.readAsText(blob);
    });
  }
}

export interface ParamsTypeData {
  params: Record<string, string>;
  files: FileItem[];
}

/**
 * 提取用户输入数据，将输入数据转换为对象和文件列表
 * @param input
 * @returns
 */
export async function toParamsFiles(
  input: FormData | URLSearchParams | Record<string, string | File>
): Promise<ParamsTypeData> {
  const params: Record<string, string> = {};
  const files: FileItem[] = [];

  // 用键值填充数据
  const fillValueFromKV = async (key: string, value: string | File) => {
    if (value instanceof File) {
      const buf = await value.arrayBuffer();
      files.push({
        key,
        name: value.name,
        data: new Uint8Array(buf),
      });
    } else {
      params[key] = String(value);
    }
  };

  // 如果是FormData类型
  if (input instanceof FormData) {
    for (const [key, value] of input.entries()) {
      await fillValueFromKV(key, value);
    }
  }

  // 如果是URLSearchParams类型
  else if (input instanceof URLSearchParams) {
    for (const [key, value] of input) {
      params[key] = String(value);
    }
  }

  // 如果是Record<string, string | File>类型
  else {
    for (let key in input) {
      const value = input[key];
      await fillValueFromKV(key, value);
    }
  }

  return { params, files };
}
