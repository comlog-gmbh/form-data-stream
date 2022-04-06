import {Writable} from "stream";

class URLWriter extends Writable {
	writer: Writable;

	constructor(wr: Writable) {
		super();
		this.writer = wr;
	}

	_write(chunk: any, encoding: BufferEncoding, callback: (error?: (Error | null)) => void) {
		// @ts-ignore
		if (Buffer.isBuffer(chunk) && encoding != 'buffer') {
			chunk = chunk.toString(encoding);
		}
		console.info('write: '+chunk);
		this.writer.write(encodeURIComponent(chunk));
		if (callback) callback();
	}
}
export default URLWriter;