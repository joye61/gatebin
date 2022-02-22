export interface PostOption {
    body?: XMLHttpRequestBodyInit | Record<string, string>;
    headers?: Record<string, string>;
    method?: string;
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
export declare class GatewayResponse implements IGatewayResponse {
    body: Uint8Array;
    ctype: string;
    constructor(body: Uint8Array, ctype: string);
    text(): Promise<string>;
    json(): Promise<Record<string, any>>;
    blob(): Promise<Blob>;
    arrayBuffer(): Promise<ArrayBuffer>;
    blobUrl(): Promise<string>;
}
export declare function POST(url: string, option?: PostOption): Promise<IGatewayResponse>;
