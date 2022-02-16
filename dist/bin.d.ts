export declare type FileItem = {
    name: string;
    size: number;
    file: Blob;
};
interface DataType {
    url: string;
    method: string;
    headers?: HeadersInit;
    body?: Record<string, string> | BodyInit;
    filesMap?: Array<Omit<FileItem, "file">>;
}
export interface RequestData {
    data: DataType;
    files?: Array<FileItem>;
}
export declare function str2buf(str: string): Promise<ArrayBuffer>;
export declare function buf2str(buffer: ArrayBuffer): Promise<string>;
export declare function encode(data: RequestData): Promise<Uint8Array>;
export declare function decode(data: ArrayBuffer): {};
export {};
