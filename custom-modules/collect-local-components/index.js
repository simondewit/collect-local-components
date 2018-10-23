'use strict';
/* globals require, module */

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var through2 = require('through2');
var assign = require('object-assign');
var parser = require('./lib/parser.js');


/**
 * Components scraper
 * returns a JSON stream
 * optionally writes a JSON array containing
 * all docs to an output file.
 */


function scraper(options){

	if(typeof options === 'undefined'){
		throw new Error('settings object is required.');
	}

	if(typeof options.url === 'undefined'){
		throw new Error('settings.url is required.');
	}

	// options
	options = assign({
		url: null,
		keyword: '@component',
		block: '{{block}}',
		output: null,
		complete: function() {}
	}, options);

	var counter = 0;

	// create readable stream
	var stream = through2({ objectMode: true },
		function(chunk, enc, next){
			this.push(chunk);
			next();
		},
		function(cb){
			cb();
		}
	);

	// register files
	var register = {};

	function getHTML() {

		function fromDir(startPath, filter){
			var files = fs.readdirSync(startPath);
			for(var i = 0 ; i < files.length; i++) {
					var filename = path.join(startPath, files[i]);
					var stat = fs.lstatSync(filename);
					if (stat.isDirectory()) {
							fromDir(filename, filter); //recurse
					}
					else if (filename.indexOf(filter) >= 0) {
							//console.log('-- found: ', filename);
							var fileContent = fs.readFileSync(path.join(startPath, files[i]), "utf8");
							if (parser.scan(fileContent, options.keyword)) {
								register[filename] = fileContent;
							}
					};
			};
		};
		fromDir(options.url,'.html');
		init();
	}
	getHTML();

	/**
	 * Init
	 */

	function init(){
		var output;
		var components = [];

		// write stream to output file
		if(options.output){

			// create directory if it doesn't exist
			mkdirp.sync(path.dirname(options.output));

			// create writable stream
			output = fs.createWriteStream(options.output);
			output.write('[');

			output.on('close', function(){
				stream.emit('complete');
			});

			output.on('finish', function() {
				if (options.complete && typeof options.complete === 'function') {
					options.complete(components);
				}
			});
		}

		// get all files
		var file;
		

		// collect docs for all files
		for(file in register){
			var docs = parser.getComponents(register[file], file, options);
			docs.forEach(function(docItem) {
				// omit first comma
				if(counter !== 0 && options.output){
					output.write(',');
				}
				// add object to stream
				stream.push(docItem);
				if(options.output){
					// send to output
					output.write(JSON.stringify(docItem));
				}
				components.push(docItem);
				// up counter
				++counter;
			});
		}

		// end json array stream
		if(options.output){
			output.write(']');
			output.end();
		} else {
			if (options.complete && typeof options.complete === 'function') {        
				options.complete(components);
			}
		}

		// end stream
		stream.push(null);
	}

	return stream;

}

module.exports = scraper;