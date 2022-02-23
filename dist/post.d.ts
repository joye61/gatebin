export interface PostOption {
    body?: XMLHttpRequestBodyInit | Record<string, string>;
    headers?: Record<string, string>;
    method?: string;
    compress?: boolean;
}
export interface FileItem {
    key: string;
    name?: string;
    data: Uint8Array;
}
export interface RawBody {
    enabled: boolean;
    type?: 0 | 1;
    asPlain?: string;
    asBinary?: Uint8Array;
}
export interface RequestMessage {
    url: string;
    method: string;
    headers: Record<string, string>;
    params: Record<string, string>;
    rawBody: RawBody;
    files: FileItem[];
}
export interface Cookie {
    name: string;
    value: string;
    path: string;
    domain: string;
    expires: string;
    maxAge: number;
    raw: string;
}
interface HeaderValue {
    value: string[];
}
interface ResponseMessage {
    code: number;
    headers: Record<string, HeaderValue>;
    cookies: Cookie[];
    body: Uint8Array;
}
export declare class GatewayResponse implements IGatewayResponse {
    message: ResponseMessage;
    code: number;
    body: Uint8Array;
    headers: Record<string, HeaderValue>;
    constructor(message: ResponseMessage);
    text(): Promise<string>;
    json(): Promise<Record<string, any>>;
    blob(): Promise<Blob>;
    arrayBuffer(): Promise<ArrayBuffer>;
    blobUrl(): Promise<string>;
    download(name?: string): Promise<void>;
}
export declare function POST(url: string, option?: PostOption): Promise<IGatewayResponse>;
export {};
