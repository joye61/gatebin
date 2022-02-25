import { type FileItem } from "./post";
export declare function str2buf(str: string): Promise<ArrayBuffer>;
export declare function buf2str(buffer: Uint8Array): Promise<string>;
export interface ParamsTypeData {
    params: Record<string, string>;
    files: FileItem[];
}
export declare function toParamsFiles(input: FormData | URLSearchParams | Record<string, string | File>): Promise<ParamsTypeData>;
