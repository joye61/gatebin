export declare type BodyData = Record<string, number | string | Blob | ArrayBuffer>;
export declare type Cookie = {
    value: string;
    expires: string;
    maxAge: string;
};
export declare type FileItem = {
    name: string;
    length: number;
    file: Blob;
};
export interface RequestBinData {
    url: string;
    method: string;
    headers?: HeadersInit;
    data?: Record<string, number | string | Blob | ArrayBuffer>;
    cookies?: {
        [key: string]: string;
    };
    files?: Array<FileItem>;
}
export interface ResponseBinData {
    headers?: HeadersInit;
    body?: Record<string, number | string>;
    cookies?: {
        [key: string]: Cookie;
    };
}
export declare function str2buf(str: string): Promise<ArrayBuffer>;
export declare function encode(data: RequestBinData): Promise<Uint8Array>;
export declare function decode(data: ArrayBuffer): ResponseBinData;
