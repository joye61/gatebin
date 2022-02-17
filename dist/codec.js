var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import isTypedArray from "lodash/isTypedArray";
import zlib from "pako";
export function str2buf(str) {
    return __awaiter(this, void 0, void 0, function* () {
        const blob = new Blob([str], { type: "text/plain" });
        return blob.arrayBuffer();
    });
}
export function buf2str(buffer) {
    return __awaiter(this, void 0, void 0, function* () {
        const blob = new Blob([buffer], { type: "text/plain" });
        return blob.text();
    });
}
export function encode(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const params = {
            url: data.url,
            method: data.method.toUpperCase(),
            headers: data.headers,
            params: data.params,
            raw: {
                sendAsRaw: data.raw.sendAsRaw,
            },
        };
        let filesMap = [];
        let files = [];
        let filesTotalSize = 0;
        if (Array.isArray(data.files) && data.files.length) {
            data.files.forEach((item) => {
                if (item.file instanceof File) {
                    files.push(item.file);
                    filesTotalSize += item.file.size;
                    filesMap.push({
                        fileName: item.filedName,
                        size: item.file.size,
                        filedName: item.fileName,
                    });
                }
            });
        }
        if (filesMap.length > 0) {
            params.files = filesMap;
        }
        let rawSize = 0;
        let rawBuf = new ArrayBuffer(0);
        if (data.raw.sendAsRaw) {
            let content = data.raw.content;
            if (typeof content === "string") {
                rawBuf = yield str2buf(content);
            }
            else if (content instanceof Blob) {
                rawBuf = yield content.arrayBuffer();
            }
            else if (content instanceof ArrayBuffer) {
                rawBuf = content;
            }
            else if (isTypedArray(content)) {
                rawBuf = content.buffer;
            }
            rawSize = rawBuf.byteLength;
        }
        params.raw.size = rawSize;
        const paramsStr = JSON.stringify(params);
        const paramsBuf = zlib.deflate(paramsStr);
        const buf = new ArrayBuffer(2 + paramsBuf.byteLength + rawBuf.byteLength + filesTotalSize);
        const bin = new Uint8Array(buf);
        let offset = 0;
        const paramsLenBuf = new ArrayBuffer(2);
        const dataView = new DataView(paramsLenBuf);
        dataView.setUint16(0, paramsBuf.byteLength);
        bin.set(new Uint8Array(paramsLenBuf), offset);
        offset += 2;
        bin.set(new Uint8Array(paramsBuf), offset);
        offset += paramsBuf.byteLength;
        bin.set(new Uint8Array(rawBuf), offset);
        offset += rawBuf.byteLength;
        for (let file of files) {
            const fileBuf = yield file.arrayBuffer();
            bin.set(new Uint8Array(fileBuf), offset);
            offset += fileBuf.byteLength;
        }
        return bin;
    });
}
export function decode(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const bin = new Uint8Array(data);
        const view = new DataView(bin.subarray(0, 2).buffer);
        const paramsLen = view.getUint16(0);
        const zlibBuf = bin.subarray(2, 2 + paramsLen);
        let paramsBuf = new Uint8Array(0);
        try {
            paramsBuf = zlib.inflate(zlibBuf);
        }
        catch (error) { }
        const bufStr = yield buf2str(paramsBuf.buffer);
        const params = JSON.parse(bufStr);
        const body = bin.subarray(2 + paramsLen, params.contentLength);
        const result = {
            params,
            body,
        };
        return result;
    });
}
