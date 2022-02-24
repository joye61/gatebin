export interface Cookie {
    name: string;
    value: string;
    path: string;
    domain: string;
    maxAge: number;
    startTime: number;
}
export declare function getValuesByKey(key: string): {
    localValue: Record<string, Cookie>;
    sessionValue: Record<string, Cookie>;
};
export declare function addCookiesByUrl(url: string, items?: Array<string>): void;
export declare function getCookiesByUrl(url: string): Cookie[];
