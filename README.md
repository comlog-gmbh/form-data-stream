# form-data-stream
Supports application/x-www-form-urlencoded, multipart/form-data and application/json.
Synchronous and asynchronous methods. 

> Content-length not supported for streams but streams are supported

## Examples
### Simple POST Request
```javascript
const https = require('https');
const {FormDataStream} = require('form-data-stream');

var postData = new FormDataStream();
postData.set('test1', 'abcöäü§$%&');
postData.set('test2', 'yyyyyy');
postData.set('test[]', '11111');
postData.set('test[]', '22222');

var options = {
	method: 'POST',
	headers: postData.headers()
};

var req = https.request('https://localhost/upload.php', options);

req.on('response', function (res) {
	// ... do somthing
});

// Write date
postData.pipe(req);
```

### Komplex POST Request
```javascript
const https = require('https');
const {FormDataStream} = require('form-data-stream');

var postData = new FormDataStream();
postData.set('test1', 'abcöäü§$%&');
postData.set('test2', ['abc', 'xyz']);
postData.set('test3', {sub1: 'abc', sub2: 'xyz'});
postData.set('test4', ['abc', {sub1: 'abc', sub2: 'xyz'}]);
postData.set('test5', {sub1: 'abc', sub2: [123, false, null, undefined]});

var options = {
	method: 'POST',
	headers: postData.headers()
};

var req = https.request('https://localhost/upload.php', options);

req.on('response', function (res) {
	// ... do somthing
});

// Write date
postData.pipe(req);
```

### Upload file Request
```javascript
const https = require('https');
const {FormDataStream} = require('form-data-stream');

var postData = new FormDataStream();
postData.set('test1', 'abcöäü§$%&');
postData.setFile('file', './upload.txt');

var options = {
	method: 'POST',
	headers: postData.headers()
};

var req = https.request('https://localhost/upload.php', options);

req.on('response', function (res) {
	// ... do somthing
});

// Write date
postData.pipe(req);
```

### Field data from stream
```javascript
const https = require('https');
const {FormDataStream} = require('form-data-stream');

var postData = new FormDataStream();
var stream = fs.createReadStream('./upload.txt');
postData.set('field_name', stream);

var options = {
	method: 'POST',
	headers: postData.headers()
};

var req = https.request('https://localhost/upload.php', options);

// Write date
postData.pipe(req);
```

### Syncronous
```javascript
const https = require('https');
const {FormDataStream} = require('form-data-stream');

var postData = new FormDataStream();

// Fileupload
postData.setFile('file', './upload.txt');

// File from stream
// Sync stream required
var StreamSync = require('stream-sync');
let stream = new StreamSync.FileReadStreamSync('./upload.txt');
postData.setFile('file2', stream);

// Field from stream
var StreamSync = require('stream-sync');
let fstream = new StreamSync.FileReadStreamSync('./upload.txt');
postData.set('field_from_stream', fstream);

var options = {
	method: 'POST',
	headers: postData.headers()
};

var req = https.request('https://localhost/upload.php', options);

// Write date
postData.pipeSync(req);
// pipeSync does not end the request
req.end();
```