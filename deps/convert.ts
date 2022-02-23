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
