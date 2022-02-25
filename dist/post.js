var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import pbRoot from "./message";
import zlib from "pako";
import { buf2str } from "./convert";
import { config } from "./config";
import isPlainObject from "lodash/isPlainObject";
import isTypedArray from "lodash/isTypedArray";
import typeParse from "content-type";
import { CtypeName, Ctypes } from "./type";
import { addCookiesByUrl, getCookiesByUrl } from "./cookie";
function normalizeParams(input) {
    const output = {};
    if (isPlainObject(input)) {
        for (let key in input) {
            output[key] = String(input[key]);
        }
    }
    return output;
}
function createRequestMessage(url, option) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const message = {
            url,
            method: (_b = (_a = option.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()) !== null && _b !== void 0 ? _b : "GET",
            headers: {},
            params: {},
            rawBody: {
                enabled: false,
            },
            files: [],
        };
        const rawBody = message.rawBody;
        if (option.headers) {
            for (let key in option.headers) {
                message.headers[key.toLowerCase()] = option.headers[key];
            }
        }
        let userCtype = "";
        if (message.headers[CtypeName]) {
            const parseResult = typeParse.parse(message.headers[CtypeName] || "");
            userCtype = parseResult.type;
        }
        if (option.body instanceof URLSearchParams) {
            message.headers[CtypeName] = Ctypes.UrlEncoded;
            const params = {};
            for (const [key, value] of option.body) {
                params[key] = String(value);
            }
            message.params = params;
        }
        else if (option.body instanceof FormData) {
            console.log(555);
            message.headers[CtypeName] = Ctypes.FormData;
            const params = {};
            const files = [];
            for (const [key, value] of option.body.entries()) {
                if (value instanceof File) {
                    const buf = yield value.arrayBuffer();
                    files.push({
                        key,
                        name: value.name,
                        data: new Uint8Array(buf),
                    });
                }
                else {
                    params[key] = String(key);
                }
            }
            message.params = params;
            message.files = files;
        }
        else if (isPlainObject(option.body)) {
            const params = {};
            const files = [];
            for (let key in option.body) {
                const value = option.body[key];
                if (value instanceof File) {
                    const buf = yield value.arrayBuffer();
                    files.push({
                        key,
                        name: value.name,
                        data: new Uint8Array(buf),
                    });
                }
                else {
                    params[key] = value;
                }
            }
            if (files.length) {
                message.headers[CtypeName] = Ctypes.FormData;
                message.params = normalizeParams(params);
                message.files = files;
            }
            else {
                if (userCtype === Ctypes.Json) {
                    message.headers[CtypeName] = Ctypes.Json;
                    rawBody.enabled = true;
                    rawBody.type = 0;
                    rawBody.asPlain = JSON.stringify(params);
                }
                else if (userCtype === Ctypes.FormData) {
                    message.headers[CtypeName] = Ctypes.FormData;
                    message.params = normalizeParams(params);
                }
                else {
                    message.headers[CtypeName] = Ctypes.UrlEncoded;
                    message.params = normalizeParams(params);
                }
            }
        }
        else if (typeof option.body === "string") {
            message.headers[CtypeName] = Ctypes.Plain;
            rawBody.enabled = true;
            rawBody.type = 0;
            rawBody.asPlain = option.body;
        }
        else if (option.body instanceof Blob) {
            if (option.body.type) {
                message.headers[CtypeName] = option.body.type;
            }
            else {
                message.headers[CtypeName] = Ctypes.OctetStream;
            }
            const buf = yield option.body.arrayBuffer();
            rawBody.enabled = true;
            rawBody.type = 1;
            rawBody.asBinary = new Uint8Array(buf);
        }
        else if (option.body instanceof ArrayBuffer) {
            message.headers[CtypeName] = Ctypes.OctetStream;
            rawBody.enabled = true;
            rawBody.type = 1;
            rawBody.asBinary = new Uint8Array(option.body);
        }
        else if (isTypedArray(option.body)) {
            message.headers[CtypeName] = Ctypes.OctetStream;
            rawBody.enabled = true;
            rawBody.type = 1;
            rawBody.asBinary = new Uint8Array(option.body.buffer);
        }
        else {
            if (userCtype) {
                message.headers[CtypeName] = userCtype;
            }
            else {
                message.headers[CtypeName] = Ctypes.Plain;
            }
            rawBody.enabled = true;
            rawBody.type = 0;
            rawBody.asPlain = option.body ? String(option.body) : "";
        }
        const cookies = getCookiesByUrl(url);
        if (cookies.length) {
            let cookieArr = [];
            cookies.forEach((item) => {
                cookieArr.push(`${item.name}=${item.value}`);
            });
            message.headers["cookie"] = cookieArr.join("; ");
        }
        return message;
    });
}
export class GatewayResponse {
    constructor(message) {
        this.message = message;
        this.code = message.code;
        this.body = message.body;
        this.headers = message.headers;
    }
    text() {
        return __awaiter(this, void 0, void 0, function* () {
            return buf2str(this.body);
        });
    }
    json() {
        return __awaiter(this, void 0, void 0, function* () {
            const str = yield this.text();
            return JSON.parse(str);
        });
    }
    blob() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let option = {};
            const contentType = ((_a = this.headers[CtypeName]) === null || _a === void 0 ? void 0 : _a.value[0]) || "";
            if (contentType) {
                option.type = contentType;
            }
            return new Blob([this.body], option);
        });
    }
    arrayBuffer() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.body.buffer;
        });
    }
    blobUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            const blob = yield this.blob();
            return URL.createObjectURL(blob);
        });
    }
    download(name) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const url = yield this.blobUrl();
            const link = document.createElement("a");
            let finalName = name !== null && name !== void 0 ? name : "download";
            const disposition = (_a = this.headers["content-disposition"]) === null || _a === void 0 ? void 0 : _a.value;
            if (Array.isArray(disposition)) {
                const regRes = disposition[0].match(/filename\=\"(.*?)\"/);
                if (regRes === null || regRes === void 0 ? void 0 : regRes[1]) {
                    name = regRes[1];
                }
            }
            link.download = finalName;
            link.href = url;
            link.click();
            window.setTimeout(() => {
                link.remove();
            }, 0);
        });
    }
}
export function POST(url, option) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        if (!url) {
            throw new Error("The request url cannot be empty");
        }
        if (/^data\:(.+)?(;base64)?,/.test(url) || /^blob\:/.test(url)) {
            const fetchRes = yield fetch(url);
            const fetchBuf = yield fetchRes.arrayBuffer();
            const dataResult = {
                code: 200,
                headers: {},
                body: new Uint8Array(fetchBuf),
            };
            return new GatewayResponse(dataResult);
        }
        if (url.startsWith("//")) {
            url = window.location.protocol + url;
        }
        const defaultOption = {
            method: "GET",
            compress: true,
        };
        if (isPlainObject(option)) {
            option = Object.assign(Object.assign({}, defaultOption), option);
        }
        else {
            option = defaultOption;
        }
        const payload = yield createRequestMessage(url, option);
        if (config.debug) {
            console.log("%cRequest Message", "background-color:blue;color:#fff;padding:1px 5px", "\n\n", payload, "\n\n");
        }
        const message = pbRoot.lookupType("main.RequestMessage");
        const verifyErr = message.verify(payload);
        if (verifyErr) {
            throw new Error(`Message verification failure: ${verifyErr}`);
        }
        const pbMessage = message.create(payload);
        const buffer = message.encode(pbMessage).finish();
        if (!config.entry) {
            throw new Error(`Gateway entry address cannot be empty`);
        }
        let finalBuffer;
        if (option.compress) {
            const zlibBuffer = zlib.deflate(buffer);
            finalBuffer = new Uint8Array(1 + zlibBuffer.byteLength);
            finalBuffer.set(Uint8Array.of(1), 0);
            finalBuffer.set(zlibBuffer, 1);
        }
        else {
            finalBuffer = new Uint8Array(1 + buffer.byteLength);
            finalBuffer.set(Uint8Array.of(0), 0);
            finalBuffer.set(buffer, 1);
        }
        const response = yield fetch(config.entry, {
            method: "POST",
            body: finalBuffer,
        });
        let responseBuf = yield response.arrayBuffer();
        let protobuf = new Uint8Array(responseBuf);
        if (option.compress) {
            protobuf = zlib.inflate(protobuf);
        }
        const respMessage = pbRoot.lookupType("main.ResponseMessage");
        const respPbMessage = respMessage.decode(new Uint8Array(protobuf));
        const result = respMessage.toObject(respPbMessage);
        if (config.debug) {
            const debugResult = result;
            const resTypeRaw = (_c = (_b = (_a = result.headers[CtypeName]) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : "";
            const { type } = typeParse.parse(resTypeRaw);
            if (type === Ctypes.Json) {
                const text = yield buf2str(result.body);
                try {
                    debugResult.bodyAsJson = JSON.parse(text);
                }
                catch (error) {
                    debugResult.bodyAsJson = error.message;
                }
            }
            console.log("%cResponse Message", "background-color:blue;color:#fff;padding:1px 5px", "\n\n", debugResult, "\n\n");
        }
        addCookiesByUrl(url, (_e = (_d = result.headers) === null || _d === void 0 ? void 0 : _d["set-cookie"]) === null || _e === void 0 ? void 0 : _e.value);
        return new GatewayResponse(result);
    });
}
