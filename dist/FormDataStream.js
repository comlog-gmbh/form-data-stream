"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormDataStream = void 0;
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
const BufferWriter_1 = __importDefault(require("./BufferWriter"));
const URLWriter_1 = __importDefault(require("./URLWriter"));
const stream_1 = require("stream");
const FormDataItem_1 = require("./FormDataItem");
const events_1 = __importDefault(require("events"));
function forEachObjectAsync(obj, handle, end) {
    if (!obj)
        end();
    let keys = Object.keys(obj);
    let _loop = function () {
        if (keys.length == 0) {
            end();
        }
        let key = keys.shift();
        if (typeof key !== 'undefined') {
            handle(obj[key], key, _loop);
        }
    };
    _loop();
}
function forEachObjectSync(obj, handle) {
    if (!obj)
        return;
    for (let key in obj) {
        if (handle(obj[key], key) === false)
            break;
    }
}
class FormDataStream extends events_1.default {
    constructor(data) {
        super();
        this.contentType = 'auto';
        this.defaultMimeType = 'binary/octet-stream';
        this.data = {};
        this.boundary = '----FormDataStream' + (new Date()).getTime().toString(36) + Math.random().toString(36).slice(2);
        if (data && typeof data == 'object') {
            for (let i in data)
                this.set(i, data[i]);
        }
    }
    toString(encoding) {
        let writer = new BufferWriter_1.default();
        this.pipeSync(writer);
        return writer.toString(encoding);
    }
    toJSON(replacer, space) {
        let obj = {};
        this.forEach(function (item, fname) {
            obj[fname] = item.value;
        });
        return JSON.stringify(obj, replacer, space);
    }
    forEach(fn) {
        for (let i in this.data) {
            let res = fn(this.data[i], i);
            if (res === false)
                break;
        }
    }
    /**
     * Get all field names set
     * @return {Array}
     */
    keys() {
        return Object.keys(this.data);
    }
    end(ignoreWrtier) {
        if (!ignoreWrtier && this.writable)
            this.writable.end();
        this.emit('end');
    }
    /**
     * get field
     * @param {string} fname
     * @return any
     */
    get(fname) {
        let res = this.data[fname];
        if (res)
            return res.value;
        return res;
    }
    /**
     * Set field
     * @param {string} fname
     * @param {number|string|boolean|Readable|FormDataItem|any} value Value or Synchronous Stream
     */
    set(fname, value) {
        let item = { type: FormDataItem_1.TYPE_VAR, value: '' };
        if (typeof value == 'object') {
            if (value.type && value.value) {
                item = value;
            }
            else if (value instanceof stream_1.Readable) {
                item.value = value;
                item.type = FormDataItem_1.TYPE_STREAM;
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
    /**
     * Delete field
     * @param {string} fname
     */
    delete(fname) {
        delete this.data[fname];
    }
    /**
     * Clear all fields and files
     */
    clear() {
        this.data = {};
    }
    /**
     * Set file to upload
     * @param {string} fname Fieldname
     * @param {string|FormDataItem|Readable} filepath Filepath or Stream
     * @param {string} [filename] File name for upload. Good way for streams.
     * @param {string} [contentType] File content time. Default: binary/octet-stream
     */
    setFile(fname, filepath, filename, contentType = this.defaultMimeType) {
        let item = {
            type: FormDataItem_1.TYPE_FILE,
            value: '',
            contentType: contentType,
            filename: filename
        };
        if (typeof filepath == 'string') {
            item.value = filepath;
        }
        else if (filepath instanceof stream_1.Readable) {
            if (!item.filename) {
                // @ts-ignore
                if (filepath.filepath)
                    item.filename = path_1.default.basename(filepath.filepath);
                // @ts-ignore
                else if (filepath.path)
                    item.filename = path_1.default.basename(filepath.path);
                else
                    item.filename = (new Date()).getTime().toString(36) + Math.random().toString(36).slice(2);
            }
            item.value = filepath;
            item.type = FormDataItem_1.TYPE_FILE_STREAM;
        }
        else if (!filepath.type || !filepath.value) {
            item.value = filepath.value;
        }
        if (!item.filename) {
            if (typeof item.value == 'string')
                item.filename = path_1.default.basename(item.value);
            else
                item.filename = (new Date()).getTime().toString(36) + Math.random().toString(36).slice(2);
        }
        return this.set(fname, item);
    }
    /**
     * Set ContentType manually.
     * @param {string} [contentType] Default: auto
     */
    setContentType(contentType = 'auto') {
        if (contentType.toUpperCase().indexOf('BOUNDARY=') > -1) {
            let m = contentType.match(/.*BOUNDARY=([^;$]+).*/i);
            if (m)
                this.boundary = m[1].trim();
        }
        this.contentType = contentType;
    }
    /**
     * Get content type for current dataset.
     * Returns your ContentType if set manually.
     */
    getContentType() {
        let res = this.contentType;
        let _this = this;
        if (this.contentType === 'auto') {
            this.forEach(function (val, key) {
                if (val.type == FormDataItem_1.TYPE_FILE || val.type == FormDataItem_1.TYPE_FILE_STREAM || val.type == FormDataItem_1.TYPE_STREAM) {
                    res = 'multipart/form-data; boundary=' + _this.boundary;
                    return;
                }
            });
            if (res == 'auto')
                res = 'application/x-www-form-urlencoded';
        }
        return res;
    }
    _getFields(fname, value) {
        let res = {};
        let type = typeof value;
        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                let sub_res = this._getFields(fname + '[' + i + ']', value[i]);
                for (let si in sub_res) {
                    res[si] = sub_res[si];
                }
            }
        }
        else if (type == 'string' || type == 'number') {
            res[fname] = value + '';
        }
        else if (type == 'boolean') {
            res[fname] = value.toString();
        }
        else if (value === null || type == 'undefined') {
            res[fname] = '';
        }
        else if (type == 'object') {
            if (value instanceof stream_1.Readable) {
                res[fname] = value;
            }
            else {
                for (let i in value) {
                    let sub_res = this._getFields(fname + '[' + i + ']', value[i]);
                    for (let si in sub_res) {
                        res[si] = sub_res[si];
                    }
                }
            }
        }
        else {
            res[fname] = value + '';
        }
        return res;
    }
    /**
     * Calculate content length
     * @return number -1 is unknown
     */
    getContentLength() {
        let _this = this;
        let ct = this.getContentType();
        let res = 0;
        let countable = true;
        this.forEach(function (row, fname) {
            if (row.type == FormDataItem_1.TYPE_STREAM) {
                countable = false;
                return false;
            }
        });
        if (!countable)
            return -1;
        if (ct.indexOf('form-data') > -1) {
            this.forEach(function (row, fname) {
                if (row.type == FormDataItem_1.TYPE_FILE_STREAM) {
                    countable = false;
                    return false;
                }
            });
            if (!countable)
                return -1;
            let br = 2;
            let bp = 2;
            //----FormDataStream...\r\n
            let blen = Buffer.byteLength(this.boundary);
            this.forEach(function (row, fname) {
                let fields = _this._getFields(fname, row.value);
                forEachObjectSync(fields, function (val, key) {
                    res += bp + blen + br;
                    if (row.type == FormDataItem_1.TYPE_FILE) {
                        //Content-Disposition: form-data; name="FieldName"; filename="FileName.bin"\r\n
                        //Content-Type: application/vnd.ms-excel\r\n
                        //\r\n
                        //FileContent\r\n
                        res += 38 + Buffer.byteLength(key) + 13 + Buffer.byteLength(row.filename + '') + 1 + br;
                        res += 14 + Buffer.byteLength(row.contentType + '') + br + br;
                        try {
                            res += fs.statSync(val).size;
                        }
                        catch (e) { }
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
                    if (!first)
                        res += 1;
                    else
                        first = false;
                    res += Buffer.byteLength(encodeURIComponent(key)) + 1;
                    if (row.type == FormDataItem_1.TYPE_FILE || row.type == FormDataItem_1.TYPE_FILE_STREAM) {
                        res += Buffer.byteLength(encodeURIComponent(row.filename + ''));
                    }
                    else {
                        res += Buffer.byteLength(encodeURIComponent(val));
                    }
                });
            });
        }
        else if (ct.indexOf('application/json') > -1) {
            let obj = {};
            this.forEach(function (row, fname) {
                if (row.type == FormDataItem_1.TYPE_FILE || row.type == FormDataItem_1.TYPE_FILE_STREAM) {
                    obj[fname] = row.filename;
                }
                else {
                    obj[fname] = row.value;
                }
            });
            let data = JSON.stringify(obj);
            res = Buffer.byteLength(data);
        }
        return res;
    }
    /**
     * Generate / update headers
     * @param {{}} [headers]
     */
    headers(headers) {
        let res = {};
        if (headers && typeof headers == 'object')
            for (let i in headers) {
                res[(i + '').trim().toLowerCase()] = headers[i];
            }
        res['content-type'] = this.getContentType() + (res['content-type'] ? '; ' + res['content-type'] : '');
        let ContentLength = this.getContentLength();
        if (ContentLength > -1) {
            res['content-length'] = ContentLength;
        }
        else {
            res["connection"] = 'close';
            res["transfer-encoding"] = 'chunked';
            delete res['content-length'];
        }
        return res;
    }
    _pipeFormDataSync(writable) {
        let _this = this;
        this.writable = writable;
        let br = "\r\n";
        let bp = '--';
        this.forEach(function (row, fname) {
            let fields = _this._getFields(fname, row.value);
            forEachObjectSync(fields, function (val, key) {
                writable.write(bp + _this.boundary + br);
                if (row.type == FormDataItem_1.TYPE_FILE) {
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
                else if (row.type == FormDataItem_1.TYPE_FILE_STREAM) {
                    writable.write('Content-Disposition: form-data; name="' + key + '"; filename="' + row.filename + '"' + br);
                    writable.write('Content-Type: ' + row.contentType + br + br);
                    row.value.pipe(writable);
                    writable.write(br);
                }
                else if (row.type == FormDataItem_1.TYPE_STREAM) {
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
    _pipeFormData(writable, cb) {
        let _this = this;
        this.writable = writable;
        let br = "\r\n";
        let bp = '--';
        let _end = function (err) {
            writable.write(bp + _this.boundary + bp + br);
            cb(typeof err == 'undefined' ? null : err);
        };
        forEachObjectAsync(this.data, function (row, fname, rnext) {
            forEachObjectAsync(_this._getFields(fname, row.value), function (val, key, next) {
                writable.write(bp + _this.boundary + br);
                if (row.type == FormDataItem_1.TYPE_FILE || row.type == FormDataItem_1.TYPE_FILE_STREAM || row.type == FormDataItem_1.TYPE_STREAM) {
                    if (row.type == FormDataItem_1.TYPE_FILE || row.type == FormDataItem_1.TYPE_FILE_STREAM) {
                        writable.write('Content-Disposition: form-data; name="' + key + '"; filename="' + row.filename + '"' + br);
                        writable.write('Content-Type: ' + row.contentType + br + br);
                    }
                    else {
                        writable.write("Content-Disposition: form-data; name=\"" + key + '"' + br + br);
                    }
                    let rstream = row.type == FormDataItem_1.TYPE_FILE ? fs.createReadStream(val) : row.value;
                    rstream.on('data', function (chunk) {
                        writable.write(chunk);
                    });
                    rstream.on('end', function () {
                        if (next) {
                            writable.write(br);
                            next();
                            next = null;
                        }
                    });
                    rstream.on('error', function (err) {
                        if (next) {
                            writable.write(br);
                            next();
                            next = null;
                        }
                        _this.emit('error', err);
                    });
                }
                else {
                    writable.write("Content-Disposition: form-data; name=\"" + key + '"' + br + br);
                    writable.write(val + br);
                    if (next)
                        next();
                }
            }, rnext);
        }, _end);
    }
    _pipeFormURL(writable, cb) {
        let _this = this;
        this.writable = writable;
        let first = true;
        let _end = function (err) {
            cb(typeof err == 'undefined' ? null : err);
        };
        forEachObjectAsync(this.data, function (row, fname, rnext) {
            forEachObjectAsync(_this._getFields(fname, row.value), function (val, key, next) {
                if (!first)
                    writable.write('&');
                else
                    first = false;
                writable.write(encodeURIComponent(key) + '=');
                if (row.type == FormDataItem_1.TYPE_FILE || row.type == FormDataItem_1.TYPE_FILE_STREAM) {
                    writable.write(encodeURIComponent(row.filename + ''));
                    if (next) {
                        next();
                        next = null;
                    }
                }
                else if (row.type == FormDataItem_1.TYPE_STREAM) {
                    let rstream = row.value;
                    rstream.on('data', function (chunk) {
                        if (Buffer.isBuffer(chunk))
                            chunk = chunk.toString();
                        writable.write(encodeURIComponent(chunk));
                    });
                    rstream.on('end', function () {
                        if (next) {
                            next();
                            next = null;
                        }
                    });
                    rstream.on('error', function (err) {
                        if (next) {
                            next();
                            next = null;
                        }
                        _this.emit('error', err);
                    });
                }
                else {
                    writable.write(encodeURIComponent(val));
                    if (next) {
                        next();
                        next = null;
                    }
                }
            }, rnext);
        }, _end);
    }
    _pipeFormURLSync(writable) {
        let _this = this;
        this.writable = writable;
        let first = true;
        this.forEach(function (row, fname) {
            let fields = _this._getFields(fname, row.value);
            forEachObjectSync(fields, function (val, key) {
                if (!first)
                    writable.write('&');
                writable.write(encodeURIComponent(key) + '=');
                if (row.type == FormDataItem_1.TYPE_FILE || row.type == FormDataItem_1.TYPE_FILE_STREAM) {
                    writable.write(encodeURIComponent(row.filename + ''));
                }
                else if (row.type == FormDataItem_1.TYPE_STREAM) {
                    let buf = new URLWriter_1.default(writable);
                    row.value.on('end', function () {
                        console.info('end');
                    });
                    row.value.pipe(buf);
                }
                else {
                    writable.write(encodeURIComponent(val));
                }
                first = false;
            });
        });
    }
    _pipeFormJSON(writable, cb) {
        let _this = this;
        this.writable = writable;
        let obj = {};
        let _end = function (err) {
            writable.write(JSON.stringify(obj));
            cb(typeof err == 'undefined' ? null : err);
        };
        forEachObjectAsync(this.data, function (row, fname, rnext) {
            forEachObjectAsync(_this._getFields(fname, row.value), function (val, key, next) {
                if (row.type == FormDataItem_1.TYPE_FILE || row.type == FormDataItem_1.TYPE_FILE_STREAM) {
                    obj[fname] = row.filename;
                    if (next) {
                        next();
                        next = null;
                    }
                }
                else if (row.type == FormDataItem_1.TYPE_STREAM) {
                    let bw = new BufferWriter_1.default();
                    let rstream = row.value;
                    rstream.pipe(bw);
                    rstream.on('end', function () {
                        obj[fname] = bw.toString();
                        if (next) {
                            next();
                            next = null;
                        }
                    });
                    rstream.on('error', function (err) {
                        obj[fname] = null;
                        if (next) {
                            next();
                            next = null;
                        }
                        _this.emit('error', err);
                    });
                }
                else {
                    obj[fname] = row.value;
                    if (next) {
                        next();
                        next = null;
                    }
                }
            }, rnext);
        }, _end);
    }
    _pipeFormJSONSync(writable) {
        let _this = this;
        this.writable = writable;
        let obj = {};
        this.forEach(function (row, fname) {
            if (row.type == FormDataItem_1.TYPE_FILE || row.type == FormDataItem_1.TYPE_FILE_STREAM) {
                obj[fname] = row.filename;
            }
            else if (row.type == FormDataItem_1.TYPE_STREAM) {
                let bw = new BufferWriter_1.default();
                row.value.pipe(bw);
                obj[fname] = bw.toString();
            }
            else {
                obj[fname] = row.value;
            }
        });
        writable.write(JSON.stringify(obj));
    }
    /**
     * Piping data to requiest (Writable)
     * @param {Writable|any} writable
     * @param {(err: Error|null)} [cb]
     */
    pipe(writable, cb) {
        let ct = this.getContentType();
        let _this = this;
        this.writable = writable;
        let _endAndCb = function (err) {
            _this.end();
            if (cb)
                cb(err);
        };
        process.nextTick(function () {
            if (ct.indexOf('form-data') > -1) {
                _this._pipeFormData(writable, _endAndCb);
            }
            else if (ct.indexOf('x-www-form-urlencoded') > -1) {
                _this._pipeFormURL(writable, _endAndCb);
            }
            else if (ct.indexOf('application/json') > -1) {
                _this._pipeFormJSON(writable, _endAndCb);
            }
        });
        return writable;
    }
    /**
     * Piping data to requiest (Writable) synchronous
     * @param {Writable|any} writable
     */
    pipeSync(writable) {
        let ct = this.getContentType();
        if (ct.indexOf('form-data') > -1) {
            this._pipeFormDataSync(writable);
        }
        else if (ct.indexOf('x-www-form-urlencoded') > -1) {
            this._pipeFormURLSync(writable);
        }
        else if (ct.indexOf('application/json') > -1) {
            this._pipeFormJSONSync(writable);
        }
        this.end(true);
        return writable;
    }
}
exports.FormDataStream = FormDataStream;
//# sourceMappingURL=FormDataStream.js.map