/// <reference types="node" />
import { Writable } from "stream";
import { Readable } from "stream";
import { FormDataItem } from './FormDataItem';
import EventEmitter from "events";
export declare class FormDataStream extends EventEmitter {
    private contentType;
    private boundary;
    private defaultMimeType;
    private data;
    private writable?;
    constructor(data?: any);
    toString(encoding?: BufferEncoding): string;
    toJSON(replacer?: any, space?: any): string;
    forEach(fn: (val: any, key: string) => boolean | void): void;
    /**
     * Get all field names set
     * @return {Array}
     */
    keys(): string[];
    end(ignoreWrtier?: boolean): void;
    /**
     * get field
     * @param {string} fname
     * @return any
     */
    get(fname: string): any;
    /**
     * Set field
     * @param {string} fname
     * @param {number|string|boolean|Readable|FormDataItem|any} value Value or Synchronous Stream
     */
    set(fname: string, value: number | string | boolean | Readable | FormDataItem | any): any;
    /**
     * Delete field
     * @param {string} fname
     */
    delete(fname: string): void;
    /**
     * Clear all fields and files
     */
    clear(): void;
    /**
     * Set file to upload
     * @param {string} fname Fieldname
     * @param {string|FormDataItem|Readable} filepath Filepath or Stream
     * @param {string} [filename] File name for upload. Good way for streams.
     * @param {string} [contentType] File content time. Default: binary/octet-stream
     */
    setFile(fname: string, filepath: string | FormDataItem | Readable, filename?: string, contentType?: string): any;
    /**
     * Set ContentType manually.
     * @param {string} [contentType] Default: auto
     */
    setContentType(contentType?: string): void;
    /**
     * Get content type for current dataset.
     * Returns your ContentType if set manually.
     */
    getContentType(): string;
    private _getFields;
    /**
     * Calculate content length
     * @return number -1 is unknown
     */
    getContentLength(): number;
    /**
     * Generate / update headers
     * @param {{}} [headers]
     */
    headers(headers?: any): Object | any;
    _pipeFormDataSync(writable: Writable | any): void;
    _pipeFormData(writable: Writable | any, cb: (err: Error | null) => void): void;
    _pipeFormURL(writable: Writable | any, cb: (err: Error | null) => void): void;
    _pipeFormURLSync(writable: Writable | any): void;
    _pipeFormJSON(writable: Writable | any, cb: (err: Error | null) => void): void;
    _pipeFormJSONSync(writable: Writable | any): void;
    /**
     * Piping data to requiest (Writable)
     * @param {Writable|any} writable
     * @param {(err: Error|null)} [cb]
     */
    pipe(writable: Writable | any, cb?: (err: Error | null) => void): Writable | any;
    /**
     * Piping data to requiest (Writable) synchronous
     * @param {Writable|any} writable
     */
    pipeSync(writable: Writable | any): Writable | any;
}
