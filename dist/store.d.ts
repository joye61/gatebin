export interface Cookie {
    name: string;
    value: string;
    path: string;
    domain: string;
    maxAge: number;
    startTime: number;
}
export interface CookieStoreItem extends Cookie {
    startTime: number;
}
export declare function getValuesByKey(key: string): {
    localValue: Record<string, CookieStoreItem>;
    sessionValue: Record<string, CookieStoreItem>;
};
export declare function addCookiesByUrl(url: string, items?: Array<string>): void;
export declare function getCookiesByUrl(url: string): CookieStoreItem[];
