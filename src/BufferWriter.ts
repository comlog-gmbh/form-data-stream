import {Writable} from "stream";

class BufferWriter extends Writable {
	private data : Buffer = Buffer.alloc(0);
	length: number = this.data.length;

	constructor() { super(); }

	toBuffer() { return this.data; }

	writeJSON (obj: any) {
		this.write(JSON.stringify(obj));
	}

	write(chunk: any): boolean {
		// @ts-ignore
		this._write(chunk, this._writableState.encoding);
		return true;
	}

	_write (chunk: any, encoding: string, done: Function) {
		if (typeof chunk == 'string') chunk = Buffer.from(chunk);
		this.data = Buffer.concat([this.data, chunk]);
		this.length = this.data.length;
		if (done) done();
	}

	toString(encoding? : BufferEncoding | undefined, start?: number, end?: number) {
		return this.data.toString(encoding, start, end);
	}
}

export = BufferWriter;