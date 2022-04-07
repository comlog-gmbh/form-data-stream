const fs = require("fs");
var StreamSync = require('stream-sync');

// Sync file upload via stream
const http = require('http');
const {FormDataStream} = require('../');
const BufferWriter = require("../dist/BufferWriter");

var postData = new FormDataStream();
//postData.set('test1', 'abcöäü§$%&');
//postData.set('test2', ['abc', 'xyz']);
//postData.set('test3', {sub1: 'abc', sub2: 'xyz'});
//postData.set('test4', ['abc', {sub1: 'abc', sub2: 'xyz'}]);
postData.set('input', 'test+üöälpokokasd+test');
//let rs1 = new StreamSync.FileReadStreamSync('./upload.txt');
let rs1 = new fs.createReadStream('./upload.txt');
rs1.setEncoding('utf8');
postData.setFile('text', rs1);
/*let rs2 = new StreamSync.FileReadStreamSync('./upload.txt');
postData.setFile('file', rs2);*/

//postData.setContentType('application/json');
//postData.setContentType('application/x-www-form-urlencoded');

var options = {
	method: 'POST',
	headers: postData.headers()
};
console.info('--- headers ---');
console.info(options.headers);
//console.info('--- data ---');
//console.info(postData.toString());

var req = http.request('http://localtest.speedorder.de/ar/index.php', options);

req.on('response', function (res) {
	var data = '';

	res.on('data', function (chunk) {
		data += chunk;
	});

	res.on('end', function () {
		console.info('--- response ---', data);
	});
});

let str = new BufferWriter();

postData.pipe(req);

postData.on('end', function () {
	console.info(str.toString());
})

//req.end();
/**/

/*
// Sync file upload
const https = require('https');
const {FormDataStreamSync} = require('../');

var postData = new FormDataStreamSync();
//postData.set('test1', 'abcöäü§$%&');
//postData.set('test2', ['abc', 'xyz']);
//postData.set('test3', {sub1: 'abc', sub2: 'xyz'});
//postData.set('test4', ['abc', {sub1: 'abc', sub2: 'xyz'}]);
postData.set('test5', {sub1: 'abc', sub2: [123, false, null, undefined]});
postData.setFile('file', './upload.txt');
//postData.setContentType('application/json');

var options = {
	method: 'POST',
	headers: {
		'content-type': postData.getContentType(),
		'content-length': postData.getContentLength()
	}
};
console.info('--- headers ---', options.headers);
console.info('--- data ---', postData.toString());

var req = https.request('https://localtest.speedorder.de/ar/index.php', options);

req.on('response', function (res) {
	var data = '';

	res.on('data', function (chunk) {
		data += chunk;
	});

	res.on('end', function () {
		console.info('--- response ---', data);
	})
});

postData.pipe(req);

req.end();
/**/
/*
// Test form-data
const http = require('http');
const FormData = require('form-data');
const fs = require('fs');
const BufferWriter = require("../dist/BufferWriter");

let form = new FormData();
form.append('test1', 'asdfü.ü.§$%&xyz');
form.append('file', fs.createReadStream('../README.md'));

let writer = new BufferWriter();
form.pipe(writer);

console.info('--- headers ---', form.getHeaders());
form.on('end', function () {
	console.info('--- data ---', writer.toString());
});

/*
let options = {
	method: 'post',
	headers: form.getHeaders()
};

var req = http.request('http://localtest.speedorder.de/ar/index.php', options);

req.on('response', function (res) {
	var data = '';

	res.on('data', function (chunk) {
		data += chunk;
	});

	res.on('end', function () {
		console.info('--- response ---', data);
	})
});

form.pipe(req);

req.end();
/**/