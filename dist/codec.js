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
        if (typeof blob.text === "function") {
            return blob.text();
        }
        else {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.addEventListener("load", () => {
                    resolve(reader.result);
                });
                reader.readAsText(blob);
            });
        }
    });
}
