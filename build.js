#!/usr/bin/env node

var fs = require('fs');
var UglifyJS = require("uglify-js");

// Get list of files, in order, and concatenate 'em
var files = [
	"src/core/Joy.js",
	"src/lib/-helpers.js",
	"src/lib/watch.min.js",
	"src/lib/lz-string.min.js",
	"src/core/joy-ui.js",
	"src/core/joy-modal.js",
	"src/core/joy-actors-ui.js",
	"src/core/joy-actors-actions.js",
	"src/core/joy-actors-instructions.js",
	"src/core/joy-actors-vars.js",
	"src/core/joy-actors-math.js"
]
var js = "";
for(var i=0; i<files.length; i++){
	var filename = files[i];
	js += fs.readFileSync(filename, 'utf8');
}
// Minify & write it
fs.writeFileSync("dist/joy.js", js, 'utf8');
var result = UglifyJS.minify(js);
fs.writeFileSync("dist/joy.min.js", result.code, 'utf8');

// Also copy joy.css to dist.
var css = fs.readFileSync("src/css/joy.css", 'utf8');
fs.writeFileSync("dist/joy.css", css, 'utf8');