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
                        filedName: item.fileName
                    });
                }
            });
        }
        params.files = filesMap;
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
        const paramsBuf = yield str2buf(JSON.stringify(params));
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
        return {};
    });
}
