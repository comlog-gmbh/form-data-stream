/// <reference types="node" />
import { Writable } from "stream";
declare class BufferWriter extends Writable {
    private data;
    length: number;
    constructor();
    toBuffer(): Buffer;
    writeJSON(obj: any): void;
    write(chunk: any): boolean;
    _write(chunk: any, encoding: string, done: Function): void;
    toString(encoding?: BufferEncoding | undefined, start?: number, end?: number): string;
}
export = BufferWriter;
