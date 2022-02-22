declare const process: any;

type FormDataEntry = [string, string | File];
interface FormData {
  entries: ()=>Array<FormDataEntry>;
}
interface IGatewayResponse {
  text(): Promise<string>;
  json(): Promise<Record<string, any>>;
  blob(): Promise<Blob>;
  arrayBuffer(): Promise<ArrayBuffer>;
  blobUrl(): Promise<string>;
}

