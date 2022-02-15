var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { encode } from "./bin";
import { config } from "./config";
export function post(input, init) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield encode({
            url: "https://www.chelun.com",
            method: "GET",
            data: {
                a: 1, b: 2
            }
        });
        const b = new Blob([data]);
        const resp = yield fetch(config.gatewayUrl, {
            method: "POST",
            body: new Blob([data]),
        });
        const res = yield resp.arrayBuffer();
        console.log(res);
        return {};
    });
}
console.log(post(config.gatewayUrl), 'pp');
