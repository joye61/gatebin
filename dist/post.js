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
import { buf2str } from "./codec";
import { config as bgConfig } from "./config";
import isPlainObject from "lodash/isPlainObject";
import isTypedArray from "lodash/isTypedArray";
import typeParse from "content-type";
import { CtypeName, Ctypes } from "./type";
import { getWillSendCookies, handleReceivedCookies } from "./cookie";
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
        if (url.startsWith("//")) {
            url = window.location.protocol + url;
        }
        const defaultOption = {
            method: "GET",
        };
        if (isPlainObject(option)) {
            option = Object.assign(Object.assign({}, defaultOption), option);
        }
        else {
            option = defaultOption;
        }
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
        }
        else if (option.body instanceof FormData) {
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
        }
        else if (isPlainObject(option.body)) {
            if (userCtype === Ctypes.Json) {
                message.headers[CtypeName] = Ctypes.Json;
                rawBody.enabled = true;
                rawBody.type = 0;
                rawBody.asPlain = JSON.stringify(option.body);
            }
            else if (userCtype === Ctypes.FormData) {
                message.headers[CtypeName] = Ctypes.FormData;
                message.params = normalizeParams(option.body);
            }
            else {
                message.headers[CtypeName] = Ctypes.UrlEncoded;
                message.params = normalizeParams(option.body);
            }
        }
        else if (typeof option.body === "string") {
            message.headers[CtypeName] = Ctypes.Text;
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
            message.headers[CtypeName] = Ctypes.Text;
            rawBody.enabled = true;
            rawBody.type = 0;
            rawBody.asPlain = String(option.body);
        }
        const cookies = getWillSendCookies(url);
        if (cookies) {
            message.headers["cookie"] = cookies;
        }
        return message;
    });
}
export class GatewayResponse {
    constructor(body, ctype) {
        this.body = body;
        this.ctype = ctype;
    }
    text() {
        return __awaiter(this, void 0, void 0, function* () {
            return buf2str(this.body.buffer);
        });
    }
    json() {
        return __awaiter(this, void 0, void 0, function* () {
            const str = yield buf2str(this.body.buffer);
            return JSON.parse(str);
        });
    }
    blob() {
        return __awaiter(this, void 0, void 0, function* () {
            let option = {};
            if (this.ctype) {
                option.type = this.ctype;
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
}
export function POST(url, option) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const payload = yield createRequestMessage(url, option);
        const message = pbRoot.lookupType("main.RequestMessage");
        const verifyErr = message.verify(payload);
        if (verifyErr) {
            throw new Error(`Message verification failure: ${verifyErr}`);
        }
        const pbMessage = message.create(payload);
        const buffer = message.encode(pbMessage).finish();
        const response = yield fetch(bgConfig.gatewayUrl, {
            method: "POST",
            body: buffer,
        });
        const protobuf = yield response.arrayBuffer();
        const respMessage = pbRoot.lookupType("main.ResponseMessage");
        const respPbMessage = respMessage.decode(new Uint8Array(protobuf));
        const result = respMessage.toObject(respPbMessage);
        if (process.env.NODE_ENV !== "production") {
            console.log("Remote Response: \n\n", result, "\n\n");
        }
        handleReceivedCookies(result.cookies);
        const ctype = ((_a = result.headers[CtypeName]) === null || _a === void 0 ? void 0 : _a.value[0]) || "";
        const gresp = new GatewayResponse(result.body, ctype);
        return gresp;
    });
}
