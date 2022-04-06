export declare const TYPE_VAR = "field";
export declare const TYPE_FILE = "file";
export declare const TYPE_STREAM = "stream";
export declare const TYPE_FILE_STREAM = "file-stream";
export interface FormDataItem {
    type: string;
    value: any;
    filename?: string;
    contentType?: string;
}
export interface FormData {
    [key: string]: any;
}
