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
    delete(fname: string): void;
    clear(): void;
    setFile(fname: string, filepath: string | FormDataItem | Readable, filename?: string, contentType?: string): any;
    setContentType(contentType: string): void;
    getContentType(): string;
    private _getFields;
    getContentLength(): number;
    /**
     * Generate headers
     * @param headers
     */
    headers(headers?: any): Object | any;
    _pipeFormDataSync(writable: Writable): void;
    _pipeFormData(writable: Writable, cb: (err: Error | null) => void): void;
    _pipeFormURL(writable: Writable, cb: (err: Error | null) => void): void;
    _pipeFormURLSync(writable: Writable): void;
    _pipeFormJSON(writable: Writable, cb: (err: Error | null) => void): void;
    _pipeFormJSONSync(writable: Writable): void;
    pipe(writable: Writable, cb?: (err: Error | null) => void): Writable;
    pipeSync(writable: Writable): Writable;
}
export = FormDataStream;
