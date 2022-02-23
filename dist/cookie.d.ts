import { Cookie } from "./post";
export interface CookieStoreItem extends Cookie {
    setTime: number;
    storeType: "local" | "session";
}
export interface CookieStore {
    [key: string]: Array<CookieStoreItem>;
}
export declare function handleReceivedCookies(cookies?: Cookie[]): void;
export declare function getWillSendCookies(url: string): string;
