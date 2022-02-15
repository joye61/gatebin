var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function str2buf(str) {
    return __awaiter(this, void 0, void 0, function* () {
        const blob = new Blob([str], { type: "text/plain" });
        return blob.arrayBuffer();
    });
}
export function encode(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const urlBuf = yield str2buf(data.url);
        const methodBuf = yield str2buf(data.method);
        let headersBuf = new ArrayBuffer(0);
        if (data.headers) {
            headersBuf = yield str2buf(JSON.stringify(data.headers));
        }
        let dataBuf = new ArrayBuffer(0);
        if (data.data) {
            dataBuf = yield str2buf(JSON.stringify(data.data));
        }
        let cookiesBuf = new ArrayBuffer(0);
        if (data.cookies) {
            cookiesBuf = yield str2buf(JSON.stringify(data.cookies));
        }
        let filesMapBuf = new ArrayBuffer(0);
        let files = [];
        if (Array.isArray(data.files) && data.files.length) {
            const filesMap = data.files.map((item) => {
                files.push(item.file);
                return {
                    name: item.name,
                    length: item.file.size,
                };
            });
            filesMapBuf = yield str2buf(JSON.stringify(filesMap));
        }
        const headerLen = 11;
        const contentLen = urlBuf.byteLength +
            methodBuf.byteLength +
            headersBuf.byteLength +
            dataBuf.byteLength +
            cookiesBuf.byteLength +
            filesMapBuf.byteLength;
        const filesLen = files.reduce((prev, file) => prev + file.size, 0);
        const buf = new ArrayBuffer(headerLen + contentLen + filesLen);
        const bin = new Uint8Array(buf);
        let offset = 0;
        bin.set(Uint16Array.of(urlBuf.byteLength), offset);
        offset += 2;
        bin.set(Uint8Array.of(methodBuf.byteLength), offset);
        offset += 1;
        bin.set(Uint16Array.of(headersBuf.byteLength), offset);
        offset += 2;
        bin.set(Uint16Array.of(dataBuf.byteLength), offset);
        offset += 2;
        bin.set(Uint16Array.of(cookiesBuf.byteLength), offset);
        offset += 2;
        bin.set(Uint16Array.of(filesMapBuf.byteLength), offset);
        offset += 2;
        bin.set(new Uint8Array(urlBuf), offset);
        offset += urlBuf.byteLength;
        bin.set(new Uint8Array(methodBuf), offset);
        offset += methodBuf.byteLength;
        bin.set(new Uint8Array(headersBuf), offset);
        offset += headersBuf.byteLength;
        bin.set(new Uint8Array(dataBuf), offset);
        offset += dataBuf.byteLength;
        bin.set(new Uint8Array(cookiesBuf), offset);
        offset += cookiesBuf.byteLength;
        bin.set(new Uint8Array(filesMapBuf), offset);
        offset += filesMapBuf.byteLength;
        for (let file of files) {
            const fileBuf = yield file.arrayBuffer();
            bin.set(new Uint8Array(fileBuf), offset);
            offset += fileBuf.byteLength;
        }
        return bin;
    });
}
export function decode(data) {
    return {};
}
