export declare function str2buf(str: string): Promise<ArrayBuffer>;
export declare function buf2str(buffer: ArrayBuffer): Promise<string>;
export declare function encode(data: WillSendData): Promise<Uint8Array>;
export declare function decode<T>(data: ArrayBuffer): Promise<T>;
