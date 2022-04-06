import {Writable} from "stream";
import path from "path";
import * as fs from "fs";
import BufferWriter from "./BufferWriter";
import URLWriter from "./URLWriter";
import {Readable} from "stream";
import {FormData, FormDataItem, TYPE_FILE, TYPE_FILE_STREAM, TYPE_STREAM, TYPE_VAR} from './FormDataItem';

function forEachObjectAsync(obj: any, handle: (val: any, key: any, next:() => void) => boolean|void, end: () => void) {
	if (!obj) end();
	let keys = Object.keys(obj);
	let _loop = function () {
		if (keys.length == 0) end();
		let key = keys.shift();
		if (typeof key !== 'undefined') {
			handle(obj[key], key, _loop);
		}
	}

	_loop();
}

function forEachObjectSync(obj: any, handle: (val: any, key: any) => boolean|void) {
	if (!obj) return;
	for (let key in obj) {
		if (handle(obj[key], key) === false) break;
	}
}


class FormDataStream {
	private contentType = 'auto';
	private boundary: string;
	private defaultMimeType = 'binary/octet-stream';
	private data: FormData = {};

	constructor(data?: any) {
		this.boundary = '----FormDataStream'+(new Date()).getTime().toString(36) + Math.random().toString(36).slice(2);
		if (data && typeof data == 'object') {
			for (let i in data) this.set(i, data[i]);
		}
	}

	toString(encoding?: BufferEncoding) {
		let writer = new BufferWriter();
		this.pipe(writer);
		return writer.toString(encoding);
	}

	forEach(fn: (val: any, key: string) => boolean|void) {
		for (let i in this.data) {
			let res = fn(this.data[i], i);
			if (res === false) break;
		}
	}

	/**
	 * get field
	 * @param {string} fname
	 * @return any
	 */
	get(fname: string): any {
		let res = this.data[fname];
		if (res) return res.value;
		return res;
	}

	/**
	 * Set field
	 * @param {string} fname
	 * @param {number|string|boolean|Readable|FormDataItem|any} value Value or Synchronous Stream
	 */
	set(fname: string, value: number|string|boolean|Readable|FormDataItem|any) {
		let item: any = {type: TYPE_VAR, value: ''};
		if (typeof value == 'object') {
			if (value.type && value.value) {
				item = value;
			}
			else if (value instanceof Readable) {
				item.value = value;
				item.type = TYPE_STREAM;
			}
			else {
				item.value = value;
			}
		}
		else {
			item.value = value;
		}

		return this.data[fname] = item;
	}

	delete(fname: string) {
		delete this.data[fname];
	}

	clear() {
		this.data = {};
	}

	setFile(fname: string, filepath: string|FormDataItem|Readable, filename?:string, contentType: string = this.defaultMimeType) {
		let item: FormDataItem = {
			type: TYPE_FILE,
			value: '',
			contentType: contentType,
			filename: filename
		};

		if (typeof filepath == 'string') {
			item.value = filepath;
		}
		else if (filepath instanceof Readable) {
			if (!item.filename) {
				// @ts-ignore
				if (filepath.filepath) item.filename = path.basename(filepath.filepath);
				else item.filename = (new Date()).getTime().toString(36) + Math.random().toString(36).slice(2);
			}

			item.value = filepath;
			item.type = TYPE_FILE_STREAM;
		}
		else if (!filepath.type || !filepath.value) {
			item.value = filepath.value;
		}

		if (!item.filename) {
			if (typeof item.value == 'string')
				item.filename = path.basename(item.value);
			else
				item.filename = (new Date()).getTime().toString(36) + Math.random().toString(36).slice(2);
		}

		return this.set(fname, item);
	}

	setContentType(contentType: string) {
		if (contentType.toUpperCase().indexOf('BOUNDARY=') > -1) {
			let m = contentType.match(/.*BOUNDARY=([^;$]+).*/i)
			if (m) this.boundary = m[1].trim();
		}
		this.contentType = contentType;
	}

	getContentType() {
		let res = this.contentType;
		let _this = this;
		if (this.contentType === 'auto') {
			this.forEach(function (val, key) {
				if (val.type == TYPE_FILE || val.type == TYPE_FILE_STREAM || val.type == TYPE_STREAM) {
					res = 'multipart/form-data; boundary='+_this.boundary;
					return;
				}
			});
			if (res == 'auto') res = 'application/x-www-form-urlencoded';
		}
		return res;
	}

	private _getFields(fname: string, value: any): { [key: string]: any; } {
		let res : { [key: string]: any; } = {};
		let type = typeof value;
		if (Array.isArray(value)) {
			for (let i=0; i < value.length; i++) {
				let sub_res = this._getFields(fname+'['+i+']', value[i]);
				for (let si in sub_res) {
					res[si] = sub_res[si];
				}
			}
		}
		else if (type == 'string' || type == 'number') {
			res[fname] = value+'';
		}
		else if (type == 'boolean') {
			res[fname] = value.toString();
		}
		else if (value === null || type == 'undefined') {
			res[fname] = '';
		}
		else if (type == 'object') {
			if (value instanceof Readable) {
				res[fname] = value;
			}
			else {
				for (let i in value) {
					let sub_res = this._getFields(fname+'['+i+']', value[i]);
					for (let si in sub_res) {
						res[si] = sub_res[si];
					}
				}
			}
		}
		else {
			res[fname] = value+'';
		}

		return res;
	}

	getContentLength(): number {
		let _this = this;
		let ct = this.getContentType();
		let res = 0;
		let countable = true;
		this.forEach(function (row, fname) {
			if (row.type == TYPE_STREAM) {
				countable = false;
				return false;
			}
		});

		if (!countable) return -1;

		if (ct.indexOf('form-data') > -1) {
			this.forEach(function (row, fname) {
				if (row.type == TYPE_FILE_STREAM) {
					countable = false;
					return false;
				}
			});

			if (!countable) return -1;

			let br = 2;
			let bp = 2;

			//----FormDataStream...\r\n
			let blen = Buffer.byteLength(this.boundary);
			this.forEach(function (row, fname) {
				let fields = _this._getFields(fname, row.value);
				forEachObjectSync(fields, function (val, key) {
					res += bp + blen + br;
					if (row.type == TYPE_FILE) {
						//Content-Disposition: form-data; name="FieldName"; filename="FileName.bin"\r\n
						//Content-Type: application/vnd.ms-excel\r\n
						//\r\n
						//FileContent\r\n
						res += 38 + Buffer.byteLength(key) + 13 + Buffer.byteLength(row.filename+'') + 1 + br;
						res += 14 + Buffer.byteLength(row.contentType+'') + br + br;
						try {
							res += fs.statSync(val).size;
						} catch (e) {}

						res += br;
					}
					else {
						//Content-Disposition: form-data; name="FieldName"\r\n
						//\r\n
						//FieldValue\r\n

						res += 38 + Buffer.byteLength(key) + 1 + br + br;
						res += Buffer.byteLength(val) + br;
					}
				});
			});
			//----FormDataStream...--\r\n
			res += bp + blen + bp + br;
		}
		else if (ct.indexOf('x-www-form-urlencoded') > -1) {
			let first = true;
			this.forEach(function (row, fname) {
				let fields = _this._getFields(fname, row.value);
				forEachObjectSync(fields, function (val, key) {
					if (!first) res += 1;
					else first = false;

					res += encodeURIComponent(key).length + 1;
					if (row.type == TYPE_FILE || row.type == TYPE_FILE_STREAM) {
						res += encodeURIComponent(row.filename+'').length;
					}
					else {
						res += encodeURIComponent(val).length;
					}
				});
			});
		}
		else if (ct.indexOf('application/json') > -1) {
			let obj: any = {};
			this.forEach(function (row, fname) {
				if (row.type == TYPE_FILE || row.type == TYPE_FILE_STREAM) {
					obj[fname] = row.filename;
				}
				else {
					obj[fname] = row.value;
				}
			});
			let data = JSON.stringify(obj);
			res = data.length;
		}
		return res;
	}

	/**
	 * Generate headers
	 * @param headers
	 */
	headers(headers?: any): Object|any {
		let res: any = {};
		if (headers && typeof headers == 'object') for (let i in headers) {
			res[(i+'').trim().toLowerCase()] = headers[i];
		}

		res['content-type'] = this.getContentType() + (res['content-type'] ? '; '+res['content-type'] : '');
		let ContentLength = this.getContentLength();
		if (ContentLength > -1) {
			res['content-length'] = ContentLength;
		}
		else {
			res["connection"] = 'close';
			res["transfer-encoding"] = 'chunked';
			delete res['content-length'];
		}

		return res
	}

	_pipeFormDataSync(writable: Writable) {
		let _this = this;
		let br = "\r\n";
		let bp = '--';

		this.forEach(function (row, fname) {
			let fields = _this._getFields(fname, row.value);
			forEachObjectSync(fields, function (val, key) {
				writable.write(bp + _this.boundary + br);
				if (row.type == TYPE_FILE) {
					writable.write('Content-Disposition: form-data; name="' + key + '"; filename="' + row.filename + '"' + br);
					writable.write('Content-Type: ' + row.contentType + br + br);
					let fd = fs.openSync(val, 'r');
					let buf = Buffer.alloc(4096);
					let pos = 0;
					let len = 0;
					do {
						len = fs.readSync(fd, buf);
						pos = pos + len;
						writable.write(buf.slice(0, len));
					} while (len > 0);

					writable.write(br);
				}
				else if (row.type == TYPE_FILE_STREAM) {
					writable.write('Content-Disposition: form-data; name="' + key + '"; filename="' + row.filename + '"' + br);
					writable.write('Content-Type: ' + row.contentType + br + br);
					row.value.pipe(writable);
					writable.write(br);
				}
				else if (row.type == TYPE_STREAM) {
					writable.write("Content-Disposition: form-data; name=\"" + key + '"' + br + br);
					row.value.pipe(writable);
					writable.write(br);
				}
				else {
					writable.write("Content-Disposition: form-data; name=\"" + key + '"' + br + br);
					writable.write(val + br);
				}
			});
		});
		//----FormDataStream...--\r\n
		writable.write(bp + this.boundary + bp + br);
	}

	_pipeFormData(writable: Writable, cb: (err: Error|null) => void) {
		let _this = this;
		let br = "\r\n";
		let bp = '--';

		let _end = function (err?: Error|null) {
			writable.write(bp + _this.boundary + bp + br);
			cb(typeof err == 'undefined' ? null : err);
		};

		forEachObjectAsync(
			this.data,
			function (row: FormDataItem, fname: string, rnext: () => void) {
				forEachObjectAsync(
					_this._getFields(fname, row.value),
					function (val: any, key: string, next: Function|null) {
						writable.write(bp + _this.boundary + br);
						if (row.type == TYPE_FILE) {
							writable.write('Content-Disposition: form-data; name="' + key + '"; filename="' + row.filename + '"' + br);
							writable.write('Content-Type: ' + row.contentType + br + br);
							let rs = fs.createReadStream(val);
							rs.pipe(writable);
							writable.write(br);
							if (next) next();
						}
						else if (row.type == TYPE_FILE_STREAM) {
							writable.write('Content-Disposition: form-data; name="' + key + '"; filename="' + row.filename + '"' + br);
							writable.write('Content-Type: ' + row.contentType + br + br);
							row.value.pipe(writable);
							writable.write(br);
							if (next) next();
						}
						else if (row.type == TYPE_STREAM) {
							writable.write("Content-Disposition: form-data; name=\"" + key + '"' + br + br);
							row.value.pipe(writable);
							writable.write(br);
							if (next) next();
						}
						else {
							writable.write("Content-Disposition: form-data; name=\"" + key + '"' + br + br);
							writable.write(val + br);
							if (next) next();
						}
					},
					rnext
				);
			},
			_end
		)


		/*this.forEach(function (row, fname) {
			_this._getFields(fname, row.value).forEach(function (val, key) {
				writable.write(bp + _this.boundary + br);
				if (row.type == TYPE_FILE) {
					writable.write('Content-Disposition: form-data; name="' + key + '"; filename="' + row.filename + '"' + br);
					writable.write('Content-Type: ' + row.contentType + br + br);
					let fd = fs.openSync(val, 'r');
					let buf = Buffer.alloc(4096);
					let pos = 0;
					let len = 0;
					do {
						len = fs.readSync(fd, buf);
						pos = pos + len;
						writable.write(buf.slice(0, len));
					} while (len > 0);

					writable.write(br);
				}
				else if (row.type == TYPE_FILE_STREAM) {
					writable.write('Content-Disposition: form-data; name="' + key + '"; filename="' + row.filename + '"' + br);
					writable.write('Content-Type: ' + row.contentType + br + br);
					row.value.pipe(writable);
					writable.write(br);
				}
				else if (row.type == TYPE_STREAM) {
					writable.write("Content-Disposition: form-data; name=\"" + key + '"' + br + br);
					row.value.pipe(writable);
					writable.write(br);
				}
				else {
					writable.write("Content-Disposition: form-data; name=\"" + key + '"' + br + br);
					writable.write(val + br);
				}
			});
		})
		//----FormDataStream...--\r\n
		writable.write(bp + this.boundary + bp + br);
		 */
	}

	_pipeFormURL(writable: Writable) {
		let _this = this;
		let first = true;
		this.forEach(function (row, fname) {
			let fields = _this._getFields(fname, row.value);
			forEachObjectSync(fields, function (val, key) {
				if (!first) writable.write('&');
				writable.write(encodeURIComponent(key)+'=');

				if (row.type == TYPE_FILE || row.type == TYPE_FILE_STREAM) {
					writable.write(encodeURIComponent(row.filename + ''));
				}
				else if (row.type == TYPE_STREAM) {
					let buf = new URLWriter(writable);
					row.value.pipe(buf);
				}
				else {
					writable.write(encodeURIComponent(val));
				}

				first = false;
			});
		});
	}

	_pipeFormJSON(writable: Writable) {
		let _this = this;
		let obj: any = {};
		this.forEach(function (row, fname) {
			if (row.type == TYPE_FILE || row.type == TYPE_FILE_STREAM) {
				obj[fname] = row.filename;
			}
			else if (row.type == TYPE_STREAM) {
				let bw = new BufferWriter();
				row.value.pipe(bw);
				obj[fname] = bw.toString();
			}
			else {
				obj[fname] = row.value;
			}
		});
		writable.write(JSON.stringify(obj));
	}

	pipe(writable: Writable, cb?: (err: Error|null) => void): Writable {
		let ct = this.getContentType();
		if (ct.indexOf('form-data') > -1) {
			this._pipeFormData(writable, function (err) {
				if (cb) cb(err);
			});
		}
		else if (ct.indexOf('x-www-form-urlencoded') > -1) {
			this._pipeFormURL(writable);
			if (cb) cb(null);
		}
		else if (ct.indexOf('application/json') > -1) {
			this._pipeFormJSON(writable);
			if (cb) cb(null);
		}

		return writable;
	}

	pipeSync(writable: Writable): Writable {
		let ct = this.getContentType();
		if (ct.indexOf('form-data') > -1) {
			this._pipeFormDataSync(writable);
		}
		else if (ct.indexOf('x-www-form-urlencoded') > -1) {
			this._pipeFormURL(writable);
		}
		else if (ct.indexOf('application/json') > -1) {
			this._pipeFormJSON(writable);
		}
		return writable;
	}
}

export = FormDataStream;