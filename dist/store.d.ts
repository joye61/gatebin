import { type Cookie } from "./post";
export interface CookieStoreItem extends Cookie {
    startTime: number;
}
export declare function getValuesByKey(key: string): {
    localValue: Record<string, CookieStoreItem>;
    sessionValue: Record<string, CookieStoreItem>;
};
export declare function addCookiesByUrl(url: string, items: Array<Cookie>): void;
export declare function getCookiesByUrl(url: string): CookieStoreItem[];
