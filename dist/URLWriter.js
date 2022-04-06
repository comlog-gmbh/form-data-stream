"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
class URLWriter extends stream_1.Writable {
    constructor(wr) {
        super();
        this.writer = wr;
    }
    _write(chunk, encoding, callback) {
        // @ts-ignore
        if (Buffer.isBuffer(chunk) && encoding != 'buffer') {
            chunk = chunk.toString(encoding);
        }
        console.info('write: ' + chunk);
        this.writer.write(encodeURIComponent(chunk));
        if (callback)
            callback();
    }
}
exports.default = URLWriter;
//# sourceMappingURL=URLWriter.js.map