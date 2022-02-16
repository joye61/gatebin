export declare type FileItem = {
    name: string;
    size: number;
    file: Blob;
};
interface DataType {
    url: string;
    method: string;
    headers?: HeadersInit;
    params?: Record<string, number | string | boolean | null>;
    filesMap?: Array<Omit<FileItem, "file">>;
}
export interface RequestData {
    data: DataType;
    files?: Array<FileItem>;
}
export declare function str2buf(str: string): Promise<ArrayBuffer>;
export declare function encode(data: RequestData): Promise<Uint8Array>;
export declare function decode(data: ArrayBuffer): {};
export {};
