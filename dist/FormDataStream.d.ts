/// <reference types="node" />
import { Writable } from "stream";
import { Readable } from "stream";
import { FormDataItem } from './FormDataItem';
import EventEmitter from "events";
declare class FormDataStream extends EventEmitter {
    private contentType;
    private boundary;
    private defaultMimeType;
    private data;
    private writable?;
    constructor(data?: any);
    toString(encoding?: BufferEncoding): string;
    forEach(fn: (val: any, key: string) => boolean | void): void;
    /**
     * Get all field names set
     * @return {Array}
     */
    keys(): string[];
    end(): void;
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
    _pipeFormDataSync(writable: Writable): void;
    _pipeFormData(writable: Writable, cb: (err: Error | null) => void): void;
    _pipeFormURL(writable: Writable, cb: (err: Error | null) => void): void;
    _pipeFormURLSync(writable: Writable): void;
    _pipeFormJSON(writable: Writable, cb: (err: Error | null) => void): void;
    _pipeFormJSONSync(writable: Writable): void;
    /**
     * Piping data to requiest (Writable)
     * @param {Writable} writable
     * @param {(err: Error|null)} [cb]
     */
    pipe(writable: Writable, cb?: (err: Error | null) => void): Writable;
    /**
     * Piping data to requiest (Writable) synchronous
     * @param {Writable} writable
     */
    pipeSync(writable: Writable): Writable;
}
export = FormDataStream;
