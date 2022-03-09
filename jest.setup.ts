import "whatwg-fetch";

// https://github.com/jsdom/jsdom/issues/2555
// Polyfill jsdom Blob.arrayBuffer
if (typeof Blob.prototype.arrayBuffer !== "function") {
  Blob.prototype.arrayBuffer = async function () {
    return new Promise<ArrayBuffer>((resolve) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        resolve(reader.result as ArrayBuffer);
      });
      reader.readAsArrayBuffer(this);
    });
  };
}

// https://github.com/jsdom/jsdom/issues/1721
// https://stackoverflow.com/questions/52968969/jest-url-createobjecturl-is-not-a-function
if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = jest.fn((blob: Blob) => blob as any);
  afterAll(() => {
    (URL.createObjectURL as jest.Mock).mockReset();
  });
}
