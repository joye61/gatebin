var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { encode, decode } from "./codec";
import { config as bgConfig } from "./config";
import isPlainObject from "lodash/isPlainObject";
function getWillSendData(url, option) {
    if (url.startsWith("//")) {
        url = window.location.protocol + url;
    }
    let config = {
        method: "GET",
    };
    if (isPlainObject(option)) {
        config = Object.assign(Object.assign({}, config), option);
    }
    const willSendData = {
        url,
        method: config.method.toUpperCase(),
        raw: {
            sendAsRaw: false,
        },
    };
    const headers = {};
    if (config.headers) {
        for (let key in config.headers) {
            headers[key.toLowerCase()] = config.headers[key];
        }
    }
    const setAsRaw = (content) => {
        willSendData.raw.sendAsRaw = true;
        willSendData.raw.content = content;
    };
    if (config.body instanceof URLSearchParams) {
        headers["content-type"] = "application/x-www-form-urlencoded";
        const params = {};
        config.body.forEach((value, key) => {
            params[key] = value;
        });
        willSendData.params = params;
    }
    else if (config.body instanceof FormData) {
        headers["content-type"] = "multipart/form-data";
        const params = {};
        const files = [];
        config.body.forEach((value, key) => {
            if (value instanceof File) {
                files.push({
                    filedName: key,
                    size: value.size,
                    file: value,
                    fileName: value.name,
                });
            }
            else {
                params[key] = value;
            }
        });
        willSendData.params = params;
        willSendData.files = files;
    }
    else if (config.body instanceof Blob) {
        if (config.body.type) {
            headers["content-type"] = config.body.type;
        }
        else {
            headers["content-type"] = "application/octet-stream";
        }
        setAsRaw(config.body);
    }
    else if (isPlainObject(config.body)) {
        const ctype = headers["content-type"];
        if (ctype === "application/json") {
            headers["content-type"] = "application/json";
            setAsRaw(JSON.stringify(config.body));
        }
        else if (ctype === "multipart/form-data") {
            headers["content-type"] = "multipart/form-data";
            willSendData.params = config.body;
        }
        else {
            headers["content-type"] = "application/x-www-form-urlencoded";
            willSendData.params = config.body;
        }
    }
    else if (typeof config.body === "string") {
        headers["content-type"] = "text/plain";
        setAsRaw(config.body);
    }
    else {
        headers["content-type"] = "application/octet-stream";
        setAsRaw(config.body);
    }
    willSendData.headers = headers;
    return willSendData;
}
export function POST(url, option) {
    return __awaiter(this, void 0, void 0, function* () {
        const willSendData = getWillSendData(url, option);
        const data = yield encode(willSendData);
        const response = yield fetch(bgConfig.gatewayUrl, {
            method: "POST",
            body: data.buffer,
        });
        const result = yield response.arrayBuffer();
        return decode(result);
    });
}
