# form-data-stream

## Examples
### Simple POST Request
```javascript
const https = require('https');
const {FormDataStreamSync} = require('form-data-stream');

var postData = new FormDataStreamSync();
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

// Send Request
req.end();
```

### Komplex POST Request
```javascript
const https = require('https');
const {FormDataStreamSync} = require('form-data-stream');

var postData = new FormDataStreamSync();
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

// Send Request
req.end();
```

### Upload file Request
```javascript
const https = require('https');
const {FormDataStreamSync} = require('form-data-stream');

var postData = new FormDataStreamSync();
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

// Send Request
req.end();
```

### Syncronous
```javascript
const https = require('https');
const {FormDataStreamSync} = require('form-data-stream');

var postData = new FormDataStreamSync();
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
postData.pipeSync(req);

// Send Request
req.end();
```