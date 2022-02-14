export declare type BodyData = Record<string, number | string | Blob | ArrayBuffer>;
export declare type Cookie = {
    value: string;
    expires: string;
    maxAge: string;
};
export interface RequestBinData {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "OPTIONS" | "PATCH" | "TRACE";
    headers?: HeadersInit;
    body?: Record<string, number | string | Blob | ArrayBuffer>;
    cookies: {
        [key: string]: string;
    };
}
export interface ResponseBinData {
    headers?: HeadersInit;
    body?: Record<string, number | string>;
    cookies?: {
        [key: string]: Cookie;
    };
}
export declare function encode(data: RequestBinData): ArrayBuffer;
export declare function decode(data: ArrayBuffer): ResponseBinData;
