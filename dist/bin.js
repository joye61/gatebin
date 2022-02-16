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
export function buf2str(buffer) {
    return __awaiter(this, void 0, void 0, function* () {
        const blob = new Blob([buffer], { type: "text/plain" });
        return blob.text();
    });
}
export function encode(data) {
    return __awaiter(this, void 0, void 0, function* () {
        let filesMapBuf = new ArrayBuffer(0);
        let filesMap = [];
        let files = [];
        let filesTotalSize = 0;
        if (Array.isArray(data.files) && data.files.length) {
            filesMap = data.files.map((item) => {
                files.push(item.file);
                filesTotalSize += item.file.size;
                return {
                    name: item.name,
                    size: item.file.size,
                };
            });
            filesMapBuf = yield str2buf(JSON.stringify(filesMap));
        }
        if (filesMap.length) {
            data.data.filesMap = filesMap;
        }
        const dataBuf = yield str2buf(JSON.stringify(data.data));
        const buf = new ArrayBuffer(2 + dataBuf.byteLength + filesTotalSize);
        const bin = new Uint8Array(buf);
        let offset = 0;
        bin.set(Uint16Array.of(dataBuf.byteLength), offset);
        offset += 2;
        bin.set(new Uint8Array(dataBuf), offset);
        offset += dataBuf.byteLength;
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
