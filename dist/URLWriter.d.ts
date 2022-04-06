/// <reference types="node" />
import { Writable } from "stream";
declare class URLWriter extends Writable {
    writer: Writable;
    constructor(wr: Writable);
    _write(chunk: any, encoding: BufferEncoding, callback: (error?: (Error | null)) => void): void;
}
export default URLWriter;
