"use strict";
const stream_1 = require("stream");
class BufferWriter extends stream_1.Writable {
    constructor() {
        super();
        this.data = Buffer.alloc(0);
        this.length = this.data.length;
    }
    toBuffer() { return this.data; }
    writeJSON(obj) {
        this.write(JSON.stringify(obj));
    }
    write(chunk) {
        // @ts-ignore
        this._write(chunk, this._writableState.encoding);
        return true;
    }
    _write(chunk, encoding, done) {
        if (typeof chunk == 'string')
            chunk = Buffer.from(chunk);
        this.data = Buffer.concat([this.data, chunk]);
        this.length = this.data.length;
        if (done)
            done();
    }
    toString(encoding, start, end) {
        return this.data.toString(encoding, start, end);
    }
}
module.exports = BufferWriter;
//# sourceMappingURL=BufferWriter.js.map