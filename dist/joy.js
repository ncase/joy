/*****************

JOY.js: easy, expressive end-user programming

The JOY Architecture:
     [ ACTORS ]
    /    |     \
 Player Editor  Data

The Player, Editor & Data DO NOT TALK DIRECTLY TO EACH OTHER.
I REPEAT: THEY SHOULD NEVER, EVER TALK DIRECTLY TO EACH OTHER.
(This lets them all be modular and separate!)

At the top layer is the JOY MASTER. You just pass in a template, like so:
{
	init: "Do this: {name:'instructions', type:'actions'}",
	data: data,
	allowPreview: true,
	container: "#editor",
	modules: ["turtle", "logic"],
	onupdate: function(my){
		my.instructors.act(target);
	}
}

*****************/

// THE JOY MASTER
function Joy(options){

	// You can call this as "new Joy()" or just "Joy()" 
	var self = (this==window) ? {} : this;

	// Modules to import?
	if(options.modules){
		for(var i=0;i<options.modules.length;i++){
			Joy.loadModule(options.modules[i]);
		}
	}

	// I'm a Joy.Actor!
	Joy.Actor.call(self, options);

	// Initialize References
	Joy.initReferences(self);

	// Allow previewing of... actions, numbers, variables?
	if(self.previewActions==undefined) self.previewActions = true;
	if(self.previewNumbers==undefined) self.previewNumbers = true;
	//if(self.previewVariables==undefined) self.previewVariables = false;
	self.activePreview = null;
	self.canPreview = function(type){
		type = type.charAt(0).toUpperCase() + type.slice(1);
		var allowed = self["preview"+type];
		return allowed && !self.activePreview;
	};

	// And: automatically create MY widget!
	self.createWidget();
	if(self.container){ // ...and auto-add my DOM to a container, if provided in options
		if(typeof self.container==="string") self.container=document.body.querySelector(self.container);
		self.container.appendChild(self.dom);
	}

	// Initialize UI & Modal
	Joy.ui.init(self);
	Joy.modal.init(self);

	// Update!
	self.update();

	// Return to sender
	return self;

}

/*****************

ACTORS help the Player, Editor & Data talk to each other.

To create an Actor, you need to pass it a "options" object like so:
(ALL the parameters are optional, btw)
{
	id: "steps", // by default, this is actorID AND dataID
	dataID: "steps", // ONLY if actorID=/=dataID. (e.g. two actors modify same data)
	type: "number", // what Actor Template to inherit from, if any
	placeholder: 50 // if no data, what should be the placeholder?
}

*****************/

Joy.Actor = function(options, parent, data){

	var self = this;

	// Meta
	self._class_ = "Actor";
	self.options = options;
	self.parent = parent;
	self.top = self.parent ? self.parent.top : self; // if no parent, I'M top dog.

	// Inherit from Actor Template, if any. THEN inherit from "options"
	self.type = options.type;
	if(self.type){
		var actorTemplate = Joy.getTemplateByType(self.type);
		_configure(self, actorTemplate);
	}
	_configure(self, self.options);

	// Adding child actors
	self.children = [];
	self.addChild = function(child, data){

		// If child's not an Actor, it's options to create a new Actor.
		if(child._class_!="Actor") child = new Joy.Actor(child, self, data);
		self.children.push(child);

		// If it has an ID, reference child with ID
		if(child.id) self[child.id] = child;

		// gimme
		return child;

	};
	self.removeChild = function(child){
		_removeFromArray(self.children, child);
		child.kill();
	};

	// Update
	self.update = function(){
		if(self.onupdate) self.onupdate(self); // TODO: make consistent with .act()
		if(self.parent) self.parent.update();
	};

	// Kill!
	self.onkill = self.onkill || function(){};
	self.kill = function(){

		// Remove my DOM, if any.
		if(self.dom && self.dom.parentNode) self.dom.parentNode.removeChild(self.dom);

		// Un-watch my data
		unwatch(self.data, _onDataChange);

		// Kill all children, too
		while(self.children.length>0){
			self.removeChild(self.children[0]);
		}

		// On Kill?
		self.onkill(self);

	};

	/////////////////////////////////
	// ACTOR <-> DATA: //////////////
	/////////////////////////////////

	// Placeholder... convert to {value:w/e} object.
	if(self.placeholder===undefined){
		// If nothing, blank object.
		self.placeholder = {};
	}
	if(typeof self.placeholder==="function"){
		// If placeholder's a function, run it!
		self.placeholder = self.placeholder();
	}
	if(typeof self.placeholder!=="object" || Array.isArray(self.placeholder)){
		// If placeholder value's not an object (or is array)
		self.placeholder = {
			value: _clone(self.placeholder)
		};
	}
	// If data type not already specified, do that!
	if(!self.placeholder.type){
		self.placeholder.type = self.type;
	}

	// If you didn't already pass in a data object, let's figure it out!
	self.data = self.data || data;
	if(!self.data){
		var parent = self.parent;
		var dataID = self.dataID;
		if(parent && dataID){
			// if nothing, put placeholder in parent
			if(!parent.data[dataID]) parent.data[dataID] = _clone(self.placeholder); 
			self.data = parent.data[dataID]; // i'm parent's sub-data!
		}else{
			// ...otherwise, I'm standalone data.
			self.data = _clone(self.placeholder);
		}
	}

	// Get & Set!
	self.getData = function(dataID){
		return self.data[dataID];
	};
	self.setData = function(dataID, newValue, noUpdate){
		_myEditLock = true; // lock!
		if(newValue===undefined){
			delete self.data[dataID]; // DELETE the thing!
		}else{
			self.data[dataID] = newValue;
		}
		setTimeout(function(){ _myEditLock=false; },1); // some threading issue, i dunno
		if(!noUpdate) self.update();
	};
	self.switchData = function(newData){
		unwatch(self.data, _onDataChange); // unwatch old data
		self.data = newData;
		watch(self.data, _onDataChange); // watch new data
		if(self.onDataChange) self.onDataChange(newData);
	};

	// WATCH DATA
	var _myEditLock = false;
	var _onDataChange = function(attr, op, newValue, oldValue){	
		if(_myEditLock) return; // prevent double update
		if(self.onDataChange) self.onDataChange();
	};
	watch(self.data, _onDataChange);


	/////////////////////////////////
	// ACTOR <-> EDITOR: "WIDGETS" //
	/////////////////////////////////

	self.dom = null; // to be created in "createWidget"!

	// Init & Create Widget (if none, just put a "todo")
	self.initWidget = self.initWidget || function(){
		self.dom = document.createElement("span");
		self.dom.innerHTML = "[todo: '"+self.type+"' widget]";
	};
	self.createWidget = function(){
		self.initWidget(self); // bind
		return self.dom;
	};

	// "Preview Data"
	self.previewData = null;
	

	/////////////////////////////////
	// ACTOR <-> PLAYER: "TARGETS" //
	/////////////////////////////////

	// Actors can ACT ON targets...
	self.onact = self.onact || function(){};
	self.act = function(target, altData){

		// Real or Preview data?
		var data;
		if(altData){
			data = _clone(altData);
		}else if(self.previewData){
			data = _clone(self.previewData);
		}else{
			data = _clone(self.data);
		}

		// Try to pre-evaluate all data beforehand!
		self.children.forEach(function(childActor){
			var dataID = childActor.dataID;
			if(dataID){
				var value = childActor.get(target);
				data[dataID] = value;
			}
		});

		// On Act!
		return self.onact({
			actor: self,
			target: target,
			data: data
		});

	};

	// ...or GET INFO from targets.
	self.onget = self.onget || function(){};
	self.get = function(target){

		// Real or Preview data?
		var data = self.previewData ? self.previewData : self.data;
		data = _clone(data);

		// On Get!
		return self.onget({
			actor: self,
			target: target,
			data: data
		});

	};

	/////////////////////////////////
	// INITIALIZE ///////////////////
	/////////////////////////////////

	// Initialization: string or function?
	if(self.init){
		if(typeof self.init==="string") Joy.initializeWithString(self, self.init);
		if(typeof self.init==="function") self.init(self);
	}

};

/*****************

ACTOR TEMPLATES that future Actors can be made from! Looks like this:

Joy.add({
	name: "Turn turtle", // what the Actions Widget calls it
	type: "turtle/turn", // what it's called in Actor & Data
	tags: ["turtle", "action"], // meta tags
	init: "Turn {id:'angle', type:'number', placeholder:10} degrees", // for init'ing actor & widget
	onact: function(my){
		my.target.turn(my.data.angle);
	}
});

*****************/

// Add Template 
Joy.templates = [];
Joy.add = function(template){
	Joy.templates.push(template);
};

// Get Template
Joy.getTemplateByType = function(type){
	var template = Joy.templates.find(function(template){
		return template.type==type;
	});
	if(!template) throw Error("No actor template of type '"+type+"'!");
	return template;
};
Joy.getTemplatesByTag = function(tag){
	return Joy.templates.filter(function(template){
		return template.tags.indexOf(tag)>=0;
	});
};

// Modify Templates
Joy.modify = function(){

	// Arguments: (type, callback) or (type, rename, callback)
	var type, rename, callback;
	if(arguments.length==2){
		type = arguments[0];
		callback = arguments[1];
	}else{
		type = arguments[0];
		rename = arguments[1];
		callback = arguments[2];
	}

	// New Template inherits from old...
	var newTemplate = {};
	var _old = Joy.getTemplateByType(type);
	_configure(newTemplate, _old);

	// Then inherits from modifications
	var modifications = callback(_old);
	_configure(newTemplate, modifications);

	// Then, either RENAME or REMOVE old actor template!
	if(rename){
		_old.type = rename;
	}else{
		_removeFromArray(Joy.templates, _old);
	}

	// And add the new one!
	Joy.add(newTemplate);

};

// Converts a string into an ENTIRE ACTOR
Joy.initializeWithString = function(self, markup){

	var actorOptions = [];
	var html = markup;

	// Split the markup into Actor Options & Widget HTML
	var startIndex = -1;
	var endIndex = -1;
	var stack = 0;
	// Go through each character. When you find a top-level "{...}" JSON string,
	// 1) parse it into an Actor Option
	// 2) replace it in the markup with a <span> saying where its widget should go
	for(var i=0; i<html.length; i++){
		var character = html[i];

		// ONLY the top-level {...}'s...
		if(stack==0 && character=="{") startIndex=i;
		if(character=="{") stack++;
		if(character=="}") stack--;
		if(stack==0 && character=="}"){
			endIndex = i+1;

			// Cut out start to end, save as JSON & replace markup with <span>
			var json = html.slice(startIndex, endIndex);
			json = json.replace(/(\w+)\:/g,"'$1':"); // cleanup: give nameerties quotes
			json = json.replace(/\'/g,'"'); // cleanup: replace ' with "
			json = JSON.parse(json);
			json.dataID = json.dataID || json.id; // cleanup: dataID=id by default
			actorOptions.push(json); // remember option!
			html = html.substr(0, startIndex)
				   + "<span id='widget_"+json.id+"'></span>"
				   + html.substr(endIndex); // replace markup

			// GO BACK TO THE BEGINNING & START OVER
			// because i'm too lazy to calculate where the index should go now
			i=0;
			startIndex = -1;
			endIndex = -1;
			stack = 0;
		}
	}

	// Create all child Actors
	actorOptions.forEach(function(actorOption){
		self.addChild(actorOption);
	});

	// Create Widget: html, and replace
	self.createWidget = function(){

		self.dom = document.createElement("span");
		self.dom.innerHTML = html;

		// Replace all <spans> with childrens' widgets.
		self.children.forEach(function(child){

			// Make child create a widget!
			child.createWidget();

			// Replace <span> with child's widget
			var selector = "#widget_"+child.id;
			var span = self.dom.querySelector(selector);
			self.dom.replaceChild(child.dom, span);

		});

		// Return to sender
		return self.dom;

	};

};

/*****************

JOY MODULES

So that a player can slowly step up the staircase of complexity
(also maybe import Actors in the future?)

*****************/

Joy.modules = {};
Joy.module = function(id, callback){
	Joy.modules[id] = callback;
};
Joy.loadModule = function(id){
	var module = Joy.modules[id];
	if(!module) throw Error("There's no module called '"+id+"'!");
	module();
};


/******************************

GETTING & SETTING REFERENCES FROM TOP.DATA

This is so you can sync variables, functions, strings, object names, etc.

Each reference should have: Unique ID, Tag, Data, Watchers
// (when Watchers[].length==0, delete that reference. Garbage day)

******************************/

Joy.initReferences = function(actor){
	
	// Create if not already
	var topdata = actor.top.data;
	if(!topdata._references) topdata._references={};

	// Zero out all connected, it's a brand new world.
	for(var id in topdata._references){
		var ref = topdata._references[id];
		ref.connected = 0;
	}

};

Joy.createReference = function(actor, tags, data){

	// The reference
	var topdata = actor.top.data;
	var reference = {
		id: _generateUID(topdata._references),
		tags: _forceToArray(tags),
		data: data,
		connected: 0 // tracks how many actors this thing actually depends on
	};
	topdata._references[reference.id] = reference;

	// Gimme
	return reference;

};

Joy.getReferenceById = function(actor, refID){
	var topdata = actor.top.data;
	return topdata._references[refID];
};

Joy.getReferencesByTag = function(actor, tag){
	var topdata = actor.top.data;
	var refs = [];
	for(var id in topdata._references){
		var ref = topdata._references[id];
		if(ref.tags.indexOf(tag)>=0) refs.push(ref);
	}
	return refs;
};

Joy.connectReference = function(actor, refID){
	var ref = Joy.getReferenceById(actor, refID);
	ref.connected++;
};

Joy.disconnectReference = function(actor, refID){
	var ref = Joy.getReferenceById(actor, refID);
	ref.connected--;
	if(ref.connected==0) Joy.deleteReference(actor, refID);
};

Joy.deleteReference = function(actor, refID){
	var topdata = actor.top.data;
	var reference = topdata._references[refID];
	delete topdata._references[refID];
};

/*
Joy.watchReference = function(topdata, id){
	var reference = topdata._references[id];
	reference._creators++;
	return reference;
};

Joy.unwatchReference = function(topdata, id){

	// The reference?
	var reference = topdata._references[id];
	reference._creators--;

	// If no more _creators, DELETE.
	if(reference._creators==0) Joy.deleteReference(topdata, id);

	return reference;

};
*/

/******************************

SAVE & LOAD

No need for a server!
Just compresses JSON with LZ-String and puts it in the URL

******************************/

Joy.saveToURL = function(data){
	var json = JSON.stringify(data); // Stringify
	var compressed = LZString.compressToEncodedURIComponent(json); // Compress
	var url = window.location.origin+window.location.pathname+"?data="+compressed; // append to current URL
	// TODO: keep # and OTHER query stuff the same, just change ?data
	return url;
};

Joy.loadFromURL = function(){
	var hash = _getParameterByName("data");
	var decompressed = LZString.decompressFromEncodedURIComponent(hash);
	if(decompressed){
		var data = JSON.parse(decompressed);
		return data;
	}else{
		return null;
	}
};
/**********************************

RANDOM CRAP TO MAKE MY LIFE EASIER

TODO: namespace these to avoid conflict

**********************************/

// For true believers
Math.TAU = 2*Math.PI;

// Deep clone
var _clone = function(json){
	return JSON.parse(JSON.stringify(json));
};

// "Configure": or just slap all properties of one object onto another
var _configure = function(target, config){
	for(var key in config){
		var value = config[key];
		target[key] = value;
	}
};

// Array stuff
var _removeFromArray = function(array, toDelete){
	var index = array.indexOf(toDelete);
	if(index<0) return false;
	array.splice(index,1);
	return true;
}

// Instant space
var _nbsp = function(){
	var span = document.createElement("span");
	span.innerHTML = "&nbsp;";
	return span;
};

// When in Rome, use a completely unuseable numeric system
// from http://blog.stevenlevithan.com/archives/javascript-roman-numeral-converter
var _numberToRoman = function(num){
    if (!+num)
        return NaN;
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    var result = Array(+digits.join("") + 1).join("M") + roman;
    return result.toLowerCase();
}

// Number to Alphabetic Base 26
// from https://stackoverflow.com/a/8604591
var _numberToAlphabet = function(a){

	var alpha = "abcdefghijklmnopqrstuvwxyz";

	// First figure out how many digits there are.
	var c = 0;
	var x = 1;      
	while (a >= x) {
		c++;
		a -= x;
		x *= 26;
	}

	// Now you can do normal base conversion.
	var s = "";
	for (var i = 0; i < c; i++) {
		s = alpha.charAt(a % 26) + s;
		a = Math.floor(a/26);
	}
	return s;

};

// Helps prevent copy-pasting weird stuff into contenteditable
// see: http://jsfiddle.net/marinagon/1v63t05q/
var _insertTextAtCursor = function(text){
	var sel, range, html;
	if(window.getSelection){
		sel = window.getSelection();
		if (sel.getRangeAt && sel.rangeCount) {
			range = sel.getRangeAt(0);
			range.deleteContents();
			range.insertNode(document.createTextNode(text));
		}
	} else if (document.selection && document.selection.createRange) {
		document.selection.createRange().text = text;
	}
};
var _preventWeirdCopyPaste = function(element){
	element.addEventListener("paste", function(e) {
		e.preventDefault();
		if (e.clipboardData && e.clipboardData.getData) {
			var text = e.clipboardData.getData("text/plain");
			document.execCommand("insertHTML", false, text);
		} else if (window.clipboardData && window.clipboardData.getData) {
			var text = window.clipboardData.getData("Text");
			_insertTextAtCursor(text);
		}
	});
};
var _selectAll = function(input, collapseToEnd){
	// select all text in contenteditable
	// see http://stackoverflow.com/a/6150060/145346
	var range = document.createRange();
    range.selectNodeContents(input);
    if(collapseToEnd) range.collapse(false); // total hack
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
};
var _unselectAll = function(){
	var selection = window.getSelection();
    selection.removeAllRanges();
};
var _fixStringInput = function(input){

	// Empty? Fix that!
	if(input.innerText==""){
		input.innerHTML="&nbsp;"; // Is it empty? Let's fix that.
		_selectAll(input);
	}

	// Line breaks? HECK NO!
	if(input.innerHTML.search("<br>")>=0){
		input.innerHTML = input.innerHTML.replace(/(\<br\>)+/g,"&nbsp;");
		_selectAll(input, true);
	}

};
var _blurOnEnter = function(input){
	input.addEventListener('keypress', function(event){
	    if(event.which===13){
	        event.preventDefault();
	        input.blur();
	    }
	});
};

// Find a unique ID within an object
var _generateUID = function(obj){
	var num = 0;
	var id;
	do{
		//id = Math.floor(Math.random()*1000000)+""; // a MILLION random IDs, hopefully don't go over
		id = "id"+num; // linear time but who cares
		num++;
	}while(obj[id]);
	return id;
};

// Make this an array, if not already
var _forceToArray = function(thing){
	if(Array.isArray(thing)) return thing;
	else return [thing];
};

// Generate a deterministically pseudo-random color from an ID
// TODO: not looking like crap. same luminance, etc.
//var _generateColor = function(obj){	};

// Remove all children from a DOM
var _emptyDOM = function(node){
	while(node.hasChildNodes()) node.removeChild(node.lastChild);
};

// Get Query Param
// thx to https://stackoverflow.com/a/901144
var _getParameterByName = function(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

////////////////////////////
// Good Color Shtuff ///////
// thx to: https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately/17243070#17243070
////////////////////////////

/* accepts parameters
 * h  Object = {h:x, s:y, v:z}
 * OR 
 * h, s, v
*/
function _HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    h /= 360; // convert, yo.
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
}
function _HSVToRGBString(h,s,v){
	if(arguments.length===1) {
        s=h[1], v=h[2], h=h[0]; // cast to different vars
    }
	var rgb = _HSVtoRGB(h,s,v);
	return "rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+")";
}
// well, "random"
var _randomHSVIndex = 0;
var _randomHSVArray = [
      [0, 0.6, 1.0],
	 [30, 0.8, 1.0],
	//[120, 0.9, 0.9],
	[210, 0.8, 1.0],
	[260, 0.7, 1.0],
	[310, 0.6, 1.0]
];
function _randomHSV(){
	var hsv = _randomHSVArray[_randomHSVIndex];
	_randomHSVIndex = (_randomHSVIndex+1)%_randomHSVArray.length;
	//return _HSVToRGBString(hsv[0], hsv[1], hsv[2]);
	return hsv;
}
function _forceToRGB(color){
	if(Array.isArray(color)){
		color = _HSVToRGBString(color[0], color[1], color[2]); // HSV
	}
	return color;
}

/**
 * DEVELOPED BY
 * GIL LOPES BUENO
 * gilbueno.mail@gmail.com
 *
 * WORKS WITH:
 * IE8*, IE 9+, FF 4+, SF 5+, WebKit, CH 7+, OP 12+, BESEN, Rhino 1.7+
 * For IE8 (and other legacy browsers) WatchJS will use dirty checking  
 *
 * FORK:
 * https://github.com/melanke/Watch.JS
 *
 * LICENSE: MIT
 */
"use strict";!function(a){"object"==typeof exports?module.exports=a():"function"==typeof define&&define.amd?define(a):(window.WatchJS=a(),window.watch=window.WatchJS.watch,window.unwatch=window.WatchJS.unwatch,window.callWatchers=window.WatchJS.callWatchers)}(function(){function x(){w=null;for(var a=0;a<v.length;a++)v[a]();v.length=0}var a={noMore:!1,useDirtyCheck:!1},b=[],c=[],d=[],e=!1;try{e=Object.defineProperty&&Object.defineProperty({},"x",{})}catch(a){}var f=function(a){var b={};return a&&"[object Function]"==b.toString.call(a)},h=function(a){return"[object Array]"===Object.prototype.toString.call(a)},i=function(a){return"[object Object]"==={}.toString.apply(a)},j=function(a,b){var c=[],d=[];if("string"!=typeof a&&"string"!=typeof b){if(h(a)&&b)for(var e=0;e<a.length;e++)void 0===b[e]&&c.push(e);else for(var e in a)a.hasOwnProperty(e)&&b&&void 0===b[e]&&c.push(e);if(h(b)&&a)for(var f=0;f<b.length;f++)void 0===a[f]&&d.push(f);else for(var f in b)b.hasOwnProperty(f)&&a&&void 0===a[f]&&d.push(f)}return{added:c,removed:d}},k=function(a){if(null==a||"object"!=typeof a)return a;var b=a.constructor();for(var c in a)b[c]=a[c];return b},l=function(a,b,c,d){try{Object.observe(a,function(a){a.forEach(function(a){a.name===b&&d(a.object[a.name])})})}catch(e){try{Object.defineProperty(a,b,{get:c,set:function(a){d.call(this,a,!0)},enumerable:!0,configurable:!0})}catch(e){try{Object.prototype.__defineGetter__.call(a,b,c),Object.prototype.__defineSetter__.call(a,b,function(a){d.call(this,a,!0)})}catch(c){n(a,b,d)}}}},m=function(a,b,c){try{Object.defineProperty(a,b,{enumerable:!1,configurable:!0,writable:!1,value:c})}catch(d){a[b]=c}},n=function(a,b,d){c[c.length]={prop:b,object:a,orig:k(a[b]),callback:d}},o=function(){f(arguments[1])?p.apply(this,arguments):h(arguments[1])?q.apply(this,arguments):r.apply(this,arguments)},p=function(a,b,c,d){if("string"!=typeof a&&(a instanceof Object||h(a))){if(h(a)){if(D(a,"__watchall__",b,c),void 0===c||c>0)for(var f=0;f<a.length;f++)p(a[f],b,c,d)}else{var f,g=[];for(f in a)"$val"==f||!e&&"watchers"===f||Object.prototype.hasOwnProperty.call(a,f)&&g.push(f);q(a,g,b,c,d)}d&&R(a,"$$watchlengthsubjectroot",b,c)}},q=function(a,b,c,d,e){if("string"!=typeof a&&(a instanceof Object||h(a)))for(var f=0;f<b.length;f++){var g=b[f];r(a,g,c,d,e)}},r=function(a,b,c,d,e){"string"!=typeof a&&(a instanceof Object||h(a))&&(f(a[b])||(null!=a[b]&&(void 0===d||d>0)&&p(a[b],c,void 0!==d?d-1:d),D(a,b,c,d),e&&(void 0===d||d>0)&&R(a,b,c,d)))},s=function(){f(arguments[1])?t.apply(this,arguments):h(arguments[1])?u.apply(this,arguments):I.apply(this,arguments)},t=function(a,b){if(!(a instanceof String)&&(a instanceof Object||h(a)))if(h(a)){for(var c=["__watchall__"],d=0;d<a.length;d++)c.push(d);u(a,c,b)}else{var e=function(a){var c=[];for(var d in a)a.hasOwnProperty(d)&&(a[d]instanceof Object?e(a[d]):c.push(d));u(a,c,b)};e(a)}},u=function(a,b,c){for(var d in b)b.hasOwnProperty(d)&&I(a,b[d],c)},v=[],w=null,y=function(){return w||(w=setTimeout(x)),w},z=function(a){null==w&&y(),v[v.length]=a},A=function(){var a=f(arguments[2])?C:B;a.apply(this,arguments)},B=function(a,b,c,d){var i,e=null,f=-1,g=h(a),j=function(c,d,h,i){var j=y();if(f!==j&&(f=j,e={type:"update"},e.value=a,e.splices=null,z(function(){b.call(this,e),e=null})),g&&a===this&&null!==e){if("pop"===d||"shift"===d)h=[],i=[i];else if("push"===d||"unshift"===d)h=[h],i=[];else if("splice"!==d)return;e.splices||(e.splices=[]),e.splices[e.splices.length]={index:c,deleteCount:i?i.length:0,addedCount:h?h.length:0,added:h,deleted:i}}};i=1==c?void 0:0,p(a,j,i,d)},C=function(a,b,c,d,e){a&&b&&(r(a,b,function(a,b,f,g){var j={type:"update"};j.value=f,j.oldvalue=g,(d&&i(f)||h(f))&&B(f,c,d,e),c.call(this,j)},0),(d&&i(a[b])||h(a[b]))&&B(a[b],c,d,e))},D=function(b,c,d,e){var f=!1,g=h(b);b.watchers||(m(b,"watchers",{}),g&&H(b,function(a,d,f,g){if(N(b,a,d,f,g),0!==e&&f&&(i(f)||h(f))){var j,k,l,m,n=b.watchers[c];for((m=b.watchers.__watchall__)&&(n=n?n.concat(m):m),l=n?n.length:0,j=0;j<l;j++)if("splice"!==d)p(f,n[j],void 0===e?e:e-1);else for(k=0;k<f.length;k++)p(f[k],n[j],void 0===e?e:e-1)}})),b.watchers[c]||(b.watchers[c]=[],g||(f=!0));for(var j=0;j<b.watchers[c].length;j++)if(b.watchers[c][j]===d)return;if(b.watchers[c].push(d),f){var k=b[c],o=function(){return k},q=function(d,f){var g=k;if(k=d,0!==e&&b[c]&&(i(b[c])||h(b[c]))&&!b[c].watchers){var j,l=b.watchers[c].length;for(j=0;j<l;j++)p(b[c],b.watchers[c][j],void 0===e?e:e-1)}return K(b,c)?void L(b,c):void(a.noMore||g!==d&&(f?N(b,c,"set",d,g):E(b,c,"set",d,g),a.noMore=!1))};a.useDirtyCheck?n(b,c,q):l(b,c,o,q)}},E=function(a,b,c,d,e){if(void 0!==b){var f,g,h=a.watchers[b];(g=a.watchers.__watchall__)&&(h=h?h.concat(g):g),f=h?h.length:0;for(var i=0;i<f;i++)h[i].call(a,b,c,d,e)}else for(var b in a)a.hasOwnProperty(b)&&E(a,b,c,d,e)},F=["pop","push","reverse","shift","sort","slice","unshift","splice"],G=function(a,b,c,d){m(a,c,function(){var f,g,h,i,e=0;if("splice"===c){var j=arguments[0],k=j+arguments[1];for(h=a.slice(j,k),g=[],f=2;f<arguments.length;f++)g[f-2]=arguments[f];e=j}else g=arguments.length>0?arguments[0]:void 0;return i=b.apply(a,arguments),"slice"!==c&&("pop"===c?(h=i,e=a.length):"push"===c?e=a.length-1:"shift"===c?h=i:"unshift"!==c&&void 0===g&&(g=i),d.call(a,e,c,g,h)),i})},H=function(a,b){if(f(b)&&a&&!(a instanceof String)&&h(a))for(var d,c=F.length;c--;)d=F[c],G(a,a[d],d,b)},I=function(a,b,c){if(b){if(a.watchers[b])if(void 0===c)delete a.watchers[b];else for(var d=0;d<a.watchers[b].length;d++){var e=a.watchers[b][d];e==c&&a.watchers[b].splice(d,1)}}else delete a.watchers;S(a,b,c),T(a,b)},J=function(a,b){if(a.watchers){var c="__wjs_suspend__"+(void 0!==b?b:"");a.watchers[c]=!0}},K=function(a,b){return a.watchers&&(a.watchers.__wjs_suspend__||a.watchers["__wjs_suspend__"+b])},L=function(a,b){z(function(){delete a.watchers.__wjs_suspend__,delete a.watchers["__wjs_suspend__"+b]})},M=null,N=function(a,b,c,e,f){d[d.length]={obj:a,prop:b,mode:c,newval:e,oldval:f},null===M&&(M=setTimeout(O))},O=function(){var a=null;M=null;for(var b=0;b<d.length;b++)a=d[b],E(a.obj,a.prop,a.mode,a.newval,a.oldval);a&&(d=[],a=null)},P=function(){for(var a=0;a<b.length;a++){var d=b[a];if("$$watchlengthsubjectroot"===d.prop){var e=j(d.obj,d.actual);(e.added.length||e.removed.length)&&(e.added.length&&q(d.obj,e.added,d.watcher,d.level-1,!0),d.watcher.call(d.obj,"root","differentattr",e,d.actual)),d.actual=k(d.obj)}else{var e=j(d.obj[d.prop],d.actual);if(e.added.length||e.removed.length){if(e.added.length)for(var f=0;f<d.obj.watchers[d.prop].length;f++)q(d.obj[d.prop],e.added,d.obj.watchers[d.prop][f],d.level-1,!0);E(d.obj,d.prop,"differentattr",e,d.actual)}d.actual=k(d.obj[d.prop])}}var g,h;if(c.length>0)for(var a=0;a<c.length;a++)g=c[a],h=g.object[g.prop],Q(g.orig,h)||(g.orig=k(h),g.callback(h))},Q=function(a,b){var c,d=!0;if(a!==b)if(i(a)){for(c in a)if((e||"watchers"!==c)&&a[c]!==b[c]){d=!1;break}}else d=!1;return d},R=function(a,c,d,e){var f;f=k("$$watchlengthsubjectroot"===c?a:a[c]),b.push({obj:a,prop:c,actual:f,watcher:d,level:e})},S=function(a,c,d){for(var e=0;e<b.length;e++){var f=b[e];f.obj==a&&(c&&f.prop!=c||d&&f.watcher!=d||b.splice(e--,1))}},T=function(a,b){for(var d,e=0;e<c.length;e++){var f=c[e],g=f.object.watchers;d=f.object==a&&(!b||f.prop==b)&&g&&(!b||!g[b]||0==g[b].length),d&&c.splice(e--,1)}};return setInterval(P,50),a.watch=o,a.unwatch=s,a.callWatchers=E,a.suspend=J,a.onChange=A,a});var LZString=function(){function o(o,r){if(!t[o]){t[o]={};for(var n=0;n<o.length;n++)t[o][o.charAt(n)]=n}return t[o][r]}var r=String.fromCharCode,n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",t={},i={compressToBase64:function(o){if(null==o)return"";var r=i._compress(o,6,function(o){return n.charAt(o)});switch(r.length%4){default:case 0:return r;case 1:return r+"===";case 2:return r+"==";case 3:return r+"="}},decompressFromBase64:function(r){return null==r?"":""==r?null:i._decompress(r.length,32,function(e){return o(n,r.charAt(e))})},compressToUTF16:function(o){return null==o?"":i._compress(o,15,function(o){return r(o+32)})+" "},decompressFromUTF16:function(o){return null==o?"":""==o?null:i._decompress(o.length,16384,function(r){return o.charCodeAt(r)-32})},compressToUint8Array:function(o){for(var r=i.compress(o),n=new Uint8Array(2*r.length),e=0,t=r.length;t>e;e++){var s=r.charCodeAt(e);n[2*e]=s>>>8,n[2*e+1]=s%256}return n},decompressFromUint8Array:function(o){if(null===o||void 0===o)return i.decompress(o);for(var n=new Array(o.length/2),e=0,t=n.length;t>e;e++)n[e]=256*o[2*e]+o[2*e+1];var s=[];return n.forEach(function(o){s.push(r(o))}),i.decompress(s.join(""))},compressToEncodedURIComponent:function(o){return null==o?"":i._compress(o,6,function(o){return e.charAt(o)})},decompressFromEncodedURIComponent:function(r){return null==r?"":""==r?null:(r=r.replace(/ /g,"+"),i._decompress(r.length,32,function(n){return o(e,r.charAt(n))}))},compress:function(o){return i._compress(o,16,function(o){return r(o)})},_compress:function(o,r,n){if(null==o)return"";var e,t,i,s={},p={},u="",c="",a="",l=2,f=3,h=2,d=[],m=0,v=0;for(i=0;i<o.length;i+=1)if(u=o.charAt(i),Object.prototype.hasOwnProperty.call(s,u)||(s[u]=f++,p[u]=!0),c=a+u,Object.prototype.hasOwnProperty.call(s,c))a=c;else{if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a]}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++),s[c]=f++,a=String(u)}if(""!==a){if(Object.prototype.hasOwnProperty.call(p,a)){if(a.charCodeAt(0)<256){for(e=0;h>e;e++)m<<=1,v==r-1?(v=0,d.push(n(m)),m=0):v++;for(t=a.charCodeAt(0),e=0;8>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;h>e;e++)m=m<<1|t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=a.charCodeAt(0),e=0;16>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}l--,0==l&&(l=Math.pow(2,h),h++),delete p[a]}else for(t=s[a],e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;l--,0==l&&(l=Math.pow(2,h),h++)}for(t=2,e=0;h>e;e++)m=m<<1|1&t,v==r-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;for(;;){if(m<<=1,v==r-1){d.push(n(m));break}v++}return d.join("")},decompress:function(o){return null==o?"":""==o?null:i._decompress(o.length,32768,function(r){return o.charCodeAt(r)})},_decompress:function(o,n,e){var t,i,s,p,u,c,a,l,f=[],h=4,d=4,m=3,v="",w=[],A={val:e(0),position:n,index:1};for(i=0;3>i;i+=1)f[i]=i;for(p=0,c=Math.pow(2,2),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(t=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;l=r(p);break;case 2:return""}for(f[3]=l,s=l,w.push(l);;){if(A.index>o)return"";for(p=0,c=Math.pow(2,m),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;switch(l=p){case 0:for(p=0,c=Math.pow(2,8),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 1:for(p=0,c=Math.pow(2,16),a=1;a!=c;)u=A.val&A.position,A.position>>=1,0==A.position&&(A.position=n,A.val=e(A.index++)),p|=(u>0?1:0)*a,a<<=1;f[d++]=r(p),l=d-1,h--;break;case 2:return w.join("")}if(0==h&&(h=Math.pow(2,m),m++),f[l])v=f[l];else{if(l!==d)return null;v=s+s.charAt(0)}w.push(v),f[d++]=s+v.charAt(0),h--,s=v,0==h&&(h=Math.pow(2,m),m++)}}};return i}();"function"==typeof define&&define.amd?define(function(){return LZString}):"undefined"!=typeof module&&null!=module&&(module.exports=LZString);
(function(){

// SINGLETON
var ui = {};
Joy.ui = ui;

ui.init = function(master){

	// CSS
	master.dom.classList.add("joy-master");

	// Manual Scroll (to prevent it propagating up...)
	master.container.addEventListener('wheel', function(event){
		var delta = event.deltaY;
		master.container.scrollTop += delta;
		event.preventDefault();
		return false;
	});

};

/********************
Button's config:
{
	label: "derp",
	onclick: function(){},
	styles: ["round", "hollow"] // optional
}
********************/
ui.Button = function(config){
	
	var self = this;

	// DOM. Pretty simple.
	var dom = document.createElement("div");
	dom.className = "joy-button";
	self.dom = dom;

	// Setting Label
	config.label = config.label || "";
	self.label = document.createElement("span");
	dom.appendChild(self.label);
	self.setLabel = function(newLabel){
		self.label.innerHTML = newLabel;
	};
	self.setLabel(config.label);

	// On Click
	dom.onclick = function(){
		config.onclick();
	};

	// Styles
	self.styles = config.styles || [];
	for(var i=0; i<self.styles.length; i++) dom.classList.add(self.styles[i]);

};

/********************
ChooserButton's config:
{
	value: [current value], (optional)
	staticLabel: "+", (optional)
	options: options,
	onchange: function(value){},
	position: "left" // optional: for the Joy.modal
	styles: ["round", "hollow"] // optional: for the button
}
********************/
ui.ChooserButton = function(config){
	
	var self = this;

	// Properties
	self.value = config.value;
	self.options = config.options; // expose, coz may change later
	self.onchange = config.onchange;

	// This is just a Button that calls Chooser Popup when clicked
	ui.Button.call(self, {
		label: (config.staticLabel===undefined) ? "" : config.staticLabel,
		onclick: function(){

			// Chooser Modal!
			Joy.modal.Chooser({
				source: self.dom,
				options: self.options,
				onchange: function(value){

					// Update value & label
					self.value = value;
					_updateLabel();

					// On Select callback
					self.onchange(value);

				},
				position: config.position
			});
			
		},
		styles: config.styles
	});

	// Helper method
	var _updateLabel = function(){
		
		if(config.staticLabel!==undefined) return; // if static, no.

		// Otherwise, find the corresponding label to my current value & set to that.
		var label = self.options.find(function(pair){
			return pair.value==self.value;
		}).label;
		self.setLabel(label);

	};
	_updateLabel();

};

/********************
Scrubber's config:
{
	min: 0,
	max: 180,
	value: [current value],
	onchange: function(value){}
}
********************/
ui.Scrubber = function(config){

	var self = this;

	// Config...
	var min = config.min;
	var max = config.max;
	self.value = config.value;

	// DOM
	var dom = document.createElement("div");
	dom.className = "joy-scrubber";
	self.dom = dom;

	// DOM *is* Label
	self.setLabel = function(newValue){
		dom.innerHTML = newValue.toFixed(self.sigfigs);
	};

	// On Value Change: make sure it's the right num of sigfigs
	var _onValueChange = function(newValue){
		newValue = parseFloat(newValue.toFixed(self.sigfigs));
		config.onchange(newValue);
	};

	// DRAG IT, BABY
	var isDragging = false;
	var wasDragging = false;
	var lastDragX, startDragValue;
	var delta = 0;
	var _onmousedown = function(event){
		isDragging = true;
		lastDragX = event.clientX;
		startDragValue = self.value;
		delta = 0;
		if(config.onstart) config.onstart();
	};
	var _onmousemove = function(event){
		if(isDragging){

			wasDragging = true;

			// What's the step?
			var step = Math.pow(0.1,self.sigfigs);
			step = parseFloat(step.toPrecision(1)); // floating point crap
			
			// Change number
			var velocity = event.clientX - lastDragX;
			lastDragX = event.clientX;
			var multiplier = Math.abs(velocity/10);
			if(multiplier<1) multiplier=1;
			if(multiplier>3) multiplier=3;
			delta += velocity*multiplier;
			var dx = Math.floor(delta/2);
			var newValue = startDragValue + dx*step;
			newValue = _boundNumber(newValue);
			
			// Only update if ACTUALLY new.
			if(self.value != newValue){
				self.value = newValue;
				self.setLabel(newValue);
				_onValueChange(newValue);
			}

		}
	};
	var _boundNumber = function(newValue){
		if(min!==undefined && newValue<min) newValue=min;
		if(max!==undefined && newValue>max) newValue=max;
		return newValue;
	};
	var _onmouseup = function(){
		isDragging = false;
		if(config.onstop) config.onstop();
		setTimeout(function(){
			wasDragging = false; // so can't "click" if let go on scrubber
		},1);
	};

	// MOUSE EVENTS
	dom.addEventListener("mousedown", _onmousedown);
	window.addEventListener("mousemove", _onmousemove);
	window.addEventListener("mouseup", _onmouseup);

	// KILL ALL LISTENERS
	self.kill = function(){
		dom.removeEventListener("mousedown", _onmousedown);
		window.removeEventListener("mousemove", _onmousemove);
		window.removeEventListener("mouseup", _onmouseup);
	};

	// On click: edit manually!
	var _manuallyEditing = false;
	dom.onblur = function(){
		if(_manuallyEditing){

			_manuallyEditing = false;
			dom.contentEditable = false;
			_unselectAll();

			// Done manually updating! The new number!
			_countSigFigs(dom.innerText); // re-calc sigfigs
			self.value = _parseNumber();
			self.setLabel(self.value);
			_onValueChange(self.value);

			// On Stop editing
			if(config.onstop) config.onstop();

		}
	};
	_preventWeirdCopyPaste(dom);
	_blurOnEnter(dom);
	dom.onclick = function(){

		if(wasDragging) return; // can't click if I was just dragging!

		_manuallyEditing = true;
		
		// Make it editable, and select it!
		dom.contentEditable = true;
		dom.spellcheck = false;
		_selectAll(dom);

		// On Start editing
		if(config.onstart) config.onstart();

	};
	dom.oninput = function(event){

		if(!_manuallyEditing) return;

		// Also, no non-decimal or numbers
		var regex = /[^0-9.\-]/g;
		if(dom.innerText.match(regex)){
			dom.innerText = dom.innerText.replace(regex,"");
		}
		_fixStringInput(dom);

		// Show that change!
		_onValueChange(_parseNumber());

	};
	var _parseNumber = function(){
		var num = parseFloat(dom.innerText);
		if(isNaN(num)) num=0;
		num = _boundNumber(num);
		return num;
	};

	// How many significant digits?
	self.sigfigs = 0;
	var _countSigFigs = function(string){
		string = string.toString();
		var sigfigs;
		var positionOfPeriod = string.search(/\./);
		if(positionOfPeriod>=0){ // has a period
			sigfigs = (string.length-1)-positionOfPeriod;
		}else{
			sigfigs = 0;
		}
		self.sigfigs = sigfigs;
	};
	_countSigFigs(self.value);

	// Current value...
	self.setLabel(self.value);

};

/********************
String's config:
{
	prefix: "[",
	suffix: "]",
	color:"whatever",
	value: data.value,
	onchange: function(value){
		data.value = value;
		self.update();
	},
	styles: ["comment"]
}
********************/
ui.String = function(config){
	
	var self = this;

	// DOM
	var dom = document.createElement("div");
	dom.className = "joy-string";
	self.dom = dom;
	
	// The Actual Part that's Content Editable
	var input = document.createElement("span");
	input.contentEditable = true;
	input.spellcheck = false;

	// Prefix & Suffix & Color: entirely cosmetic
	var prefixDOM = document.createElement("span");
	var suffixDOM = document.createElement("span");
	prefixDOM.innerHTML = config.prefix || "";
	suffixDOM.innerHTML = config.suffix || "";
	dom.appendChild(prefixDOM);
	dom.appendChild(input);
	dom.appendChild(suffixDOM);

	// On input!
	input.oninput = function(event){
		_fixStringInput(input);
		var value = input.innerText; // NOT innerHTML
		config.onchange(value); // callback!
	};

	// On focus, select all
	input.onfocus = function(){
		_selectAll(input);
	};
	input.onblur = function(){
		_unselectAll();
	};
	_preventWeirdCopyPaste(input);

	// On pressing <enter>, DON'T line break, just blur
	input.onkeypress = function(e){
		if(e.which == 13){
			input.blur();
			return false;
		}
		return true;
	};

	// Set String
	self.setString = function(value){
		input.innerText = value;
		_fixStringInput(input);
	};

	// Set Color, why not
	self.setColor = function(color){
		color = _forceToRGB(color);
		dom.style.color = color;
		dom.style.borderColor = color;
	}
	if(config.color) self.setColor(config.color);

	// Styles
	self.styles = config.styles || [];
	for(var i=0; i<self.styles.length; i++) dom.classList.add(self.styles[i]);

	// Start with the current value
	self.setString(config.value);

};

/********************
TextLine's config:
{
	multiline: true,
	readonly: true,
	width: number or "[style]",
	onchange: function(newValue){},
	placeholder: "//derp"
	styles: ["box"]
}
********************/
// TODO: a full WSIYWIG editor?
// https://hackernoon.com/easily-create-an-html-editor-with-designmode-and-contenteditable-7ed1c465d39b
ui.TextBox = function(config){
	
	var self = this;

	// DOM
	var input;
	if(config.multiline){
		input = document.createElement("textarea");
	}else{
		input = document.createElement("input");
		input.type = "text";
	}
	if(config.placeholder){
		input.placeholder = config.placeholder;
	}
	input.spellcheck = false;
	input.className = "joy-textbox";
	self.dom = input;
	var dom = self.dom;

	// Config options
	if(config.readonly){
		input.setAttribute("readonly", 1);
		input.addEventListener("click",function(){
			self.select();
		});
	}else{
		input.oninput = function(event){
			config.onchange(input.value);
		};
	}
	if(config.width){
		input.style.width = (typeof config.width==="number") ? config.width+"px" : config.width;
	}
	
	// Get & Set Value
	self.getValue = function(){ return input.value; };
	self.setValue = function(value){ input.value = value; };

	// Select
	self.select = function(){
		input.select();
	};

	// Styles
	self.styles = config.styles || [];
	for(var i=0; i<self.styles.length; i++) dom.classList.add(self.styles[i]);

	// Start
	if(config.value) self.setValue(config.value);

	// If it's multiline, auto-resize!
	// Thanks to this: https://stackoverflow.com/a/25621277
	if(config.multiline){
		var _onInput = function(){
			this.style.height = 'auto';
			this.style.height = (this.scrollHeight) + 'px';
		};
		dom.addEventListener("input", _onInput, false);
		setTimeout(function(){
			dom.setAttribute('style', 'height:' + (dom.scrollHeight) + 'px; overflow-y:hidden;');
		},1); // some threading thing?
	}

};

})();/********************

MODAL:
Places a big ol' modal dialogue bubble over the editor!

********************/
(function(){

// SINGLETON
var modal = {};
Joy.modal = modal;

modal.init = function(master){

	// The main modal container
	modal.dom = document.createElement("div");
	modal.dom.id = "joy-modal";
	document.body.appendChild(modal.dom);

	// Transparent background you click to kill!
	modal.bg = document.createElement("div");
	modal.bg.id = "joy-bg";
	modal.bg.onclick = function(){
		modal.currentUI.kill();
	};
	modal.dom.appendChild(modal.bg);

	// The actual bubble box
	modal.box = document.createElement("div");
	modal.box.id = "joy-box";
	modal.box.className = "arrow_box";
	modal.dom.appendChild(modal.box);

	// NO SCROLL
	modal.dom.addEventListener('wheel', function(event){
		event.preventDefault();
		return false;
	});

};
modal.show = function(ui){

	modal.dom.style.display = "block"; // hi

	// Remember & add UI
	modal.currentUI = ui;
	modal.box.appendChild(ui.dom);
	
	// Position the Box
	var position = ui.config.position || "below";
	modal.box.setAttribute("position", position);
	var boxBounds = modal.box.getBoundingClientRect();
	var sourceBounds = ui.config.source.getBoundingClientRect();
	var x,y, margin=20;
	switch(position){ // TODO: smarter positioning
		case "below":
			var x = sourceBounds.left + sourceBounds.width/2; // x: middle
			var y = sourceBounds.top + sourceBounds.height + margin; // y: bottom
			x -= boxBounds.width/2;
			break;
		case "left":
			var x = sourceBounds.left - margin; // x: left
			var y = sourceBounds.top + sourceBounds.height/2; // y: middle
			x -= boxBounds.width;
			y -= boxBounds.height/2;
			break;
	}
	modal.box.style.left = x+"px";
	modal.box.style.top = y+"px";

	// On Open
	if(modal.currentUI.config.onopen) modal.currentUI.config.onopen();

};
modal.hide = function(){

	_emptyDOM(modal.box);
	modal.dom.style.display = "none"; // bye

	// On Close
	if(modal.currentUI.config.onclose) modal.currentUI.config.onclose();

};

/********************
Chooser's config:
{
	source: [who this modal dialog should be "coming from"]
	value: [currently selected value, if any]
	options: [label-value pairs],
	onchange: function(value){}, // callback 
	position: "below" // default is "below"
};
********************/
modal.Chooser = function(config){

	var self = {}; // just an obj to scope this stuff

	// Config
	self.config = config;

	// Create DOM
	var dom = document.createElement("div");
	dom.className = "joy-modal-chooser";
	self.dom = dom;

	// Create List DOM
	var list = document.createElement("div");
	dom.appendChild(list);

	// Populate with list of options
	self.options = [];
	self.categories = {};
	var _placeholder_ = "_placeholder_";
	var _makeCategory = function(category){

		// dom
		var categoryDOM = document.createElement("div");
		list.appendChild(categoryDOM);

		// remember
		self.categories[category] = categoryDOM;

	};
	self.populate = function(){

		// Create categories, if any!
		for(var i=0; i<config.options.length; i++){
			var option = config.options[i];
			var category = option.category;
			if(category){
				// Category doesn't exist yet... make it!
				if(!self.categories[category]) _makeCategory(category);
			}else{
				// Make a placholder if not alredy!
				if(!self.categories[_placeholder_]) _makeCategory(_placeholder_);
			}
		}

		// Create options
		for(var i=0; i<config.options.length; i++){

			// Create option
			var option = config.options[i];
			var optionDOM = document.createElement("div");
			optionDOM.innerHTML = option.label;
			if(option.color){
				optionDOM.style.color = option.color;
			}

			// Put it in its category!
			var category = option.category || _placeholder_;
			self.categories[category].appendChild(optionDOM);

			// On Click!
			(function(option){
				// TODO: Hover & preview mode?
				optionDOM.onclick = function(event){
					self.onchange(option.value);
					event.stopPropagation(); // no, don't double-fire
				};
			})(option);

		}
	}
	self.populate();

	// On Select
	self.onchange = function(value){
		self.kill();
		config.onchange(value); // on select AFTER kill, since can create ANOTHER modal
	};

	// Kill & Remove
	self.kill = function(){
		modal.hide(); // hide modal
	};

	// Show me!
	modal.show(self);

};

/********************
Color's config:
{
	source: [who this modal dialog should be "coming from"]
	value: [currently selected value, if any]
	onchange: function(value){}, // callback 
	onclose: function(){}
};
********************/
modal.Color = function(config){

	var self = {}; // just an obj to scope this stuff

	// Config
	self.config = config;

	// Create DOM
	var dom = document.createElement("div");
	dom.className = "joy-modal-color";
	self.dom = dom;

	// COLOR is HSV.
	config.value = config.value || [0,1,1];
	self.h = config.value[0];
	self.s = config.value[1];
	self.v = config.value[2];

	// THREE ELEMENTS:
	// 1. Color Wheel
	// 2. Color Value
	// 3. Color Pickers

	var WHEEL_SIZE = 150;
	var SPECTRUM_WIDTH = 15;
	var MARGIN_1 = 10;
	var MARGIN_2 = 10;
	var MARGIN_3 = 10;

	var FULL_WIDTH = MARGIN_1+WHEEL_SIZE+MARGIN_2+SPECTRUM_WIDTH+MARGIN_3;
	var FULL_HEIGHT = MARGIN_1+WHEEL_SIZE+MARGIN_3;

	self.dom.style.width = FULL_WIDTH;
	self.dom.style.height = FULL_HEIGHT;

	/////////////////////////////
	// 1) The Color Wheel ///////
	/////////////////////////////

	var wheelCanvas = document.createElement("canvas");
	wheelCanvas.id = "joy-color-wheel";
	var wheelContext = wheelCanvas.getContext("2d");
	wheelCanvas.width = WHEEL_SIZE*2;
	wheelCanvas.height = WHEEL_SIZE*2;
	wheelCanvas.style.width = wheelCanvas.width/2;
	wheelCanvas.style.height = wheelCanvas.height/2;
	dom.appendChild(wheelCanvas);

	wheelCanvas.style.top = MARGIN_1;
	wheelCanvas.style.left = MARGIN_1;

	var _updateWheel = function(){

		// Image Data!
		var ctx = wheelContext;
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		var w = wheelCanvas.width;
		var h = wheelCanvas.height;
		var image = ctx.createImageData(w,h);
		var imageData = image.data;

		// Create a circle of colors
		// Thanks to: https://medium.com/@bantic/hand-coding-a-color-wheel-with-canvas-78256c9d7d43
		var cx = w/2;
		var cy = h/2;
		var radius = w/2; // buffer for the crosshair
		var radiusBuffered = radius + 2; // small buffer for clipping
		for(var x=0; x<w; x++){
			for(var y=0; y<h; y++){
				var dx = x-cx;
				var dy = y-cy;
				var distance = Math.sqrt(dx*dx+dy*dy);
				if(distance<radiusBuffered){ // buffer for clipping
					if(distance>=radius) distance=radius;

					// Angle & Distance, re-mapped to [0,1]
					var angle = Math.atan2(dy,dx); // from [-tau/2, tau/2]
					angle = ((angle/Math.TAU)+0.5)*360; // to [0,360]
					distance = (distance/radius); // to [0,1]

					// HSV! (capitals, coz already using 'h')
					var H = angle;
					var S = distance;
					var V = self.v;

					// TO RGB
					var rgb = _HSVtoRGB(H,S,V);
					var i = (x + (y*w))*4;
					imageData[i] = rgb[0];
					imageData[i+1] = rgb[1];
					imageData[i+2] = rgb[2];
					imageData[i+3] = 255;

				}
			}
		}
		ctx.putImageData(image, 0, 0);

		// Clip it, for aliasing
		ctx.save();
		ctx.globalCompositeOperation = "destination-in";
		ctx.beginPath();
		ctx.fillStyle = "#fff";
		ctx.arc(cx,cy,radius,0,Math.TAU);
		ctx.fill();
		ctx.restore();

	};
	_updateWheel();

	/////////////////////////////
	// 2) The Value Spectrum ////
	/////////////////////////////

	var spectrumCanvas = document.createElement("canvas");
	spectrumCanvas.id = "joy-color-value";
	var spectrumContext = spectrumCanvas.getContext("2d");
	spectrumCanvas.width = SPECTRUM_WIDTH*2;
	spectrumCanvas.height = WHEEL_SIZE*2;
	spectrumCanvas.style.width = spectrumCanvas.width/2;
	spectrumCanvas.style.height = spectrumCanvas.height/2;
	dom.appendChild(spectrumCanvas);

	spectrumCanvas.style.top = MARGIN_1;
	spectrumCanvas.style.right = MARGIN_3;

	var _updateSpectrum = function(){

		// Image data
		var ctx = spectrumContext;
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		var w = spectrumCanvas.width;
		var h = spectrumCanvas.height;
		var image = ctx.createImageData(w,h);
		var imageData = image.data;

		// Just a good ol' spectrum of values
		for(var x=0; x<w; x++){
			for(var y=0; y<h; y++){

				// HSV! (capitals, coz already using 'h')
				var H = self.h;
				var S = self.s;
				var V = 1-(y/h);

				// TO RGB
				var rgb = _HSVtoRGB(H,S,V);
				var i = (x + (y*w))*4;
				imageData[i] = rgb[0];
				imageData[i+1] = rgb[1];
				imageData[i+2] = rgb[2];
				imageData[i+3] = 255;

			}
		}
		ctx.putImageData(image, 0, 0);

	};
	_updateSpectrum();

	/////////////////////////////
	// 3) The Color Pickers /////
	/////////////////////////////

	var pickerCanvas = document.createElement("canvas");
	pickerCanvas.id = "joy-color-picker";
	var pickerContext = pickerCanvas.getContext("2d");
	pickerCanvas.width = FULL_WIDTH*2;
	pickerCanvas.height = FULL_HEIGHT*2;
	pickerCanvas.style.width = pickerCanvas.width/2;
	pickerCanvas.style.height = pickerCanvas.height/2;
	dom.appendChild(pickerCanvas);

	var _updatePickers = function(){

		// What's the color?
		var x,y;
		var ctx = pickerContext;
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.fillStyle = _HSVToRGBString(self.h, self.s, self.v);
		ctx.strokeStyle = "#fff";
		ctx.lineWidth = 2;

		// Draw it on the circle
		var cx = MARGIN_1*2 + wheelCanvas.width/2;
		var cy = MARGIN_1*2 + wheelCanvas.height/2;
		var angle = self.h*(Math.TAU/360);
		var radius = self.s*(wheelCanvas.width/2);
		x = cx - Math.cos(angle)*radius;
		y = cy - Math.sin(angle)*radius;
		ctx.beginPath();
		ctx.arc(x, y, SPECTRUM_WIDTH, 0, Math.TAU);
		ctx.fill();
		ctx.stroke();

		// Draw it on the spectrum
		var sx = MARGIN_1*2 + wheelCanvas.width + MARGIN_2*2 + spectrumCanvas.width/2;
		var sy = MARGIN_1*2;
		x = sx;
		y = sy + spectrumCanvas.height*(1-self.v);
		ctx.beginPath();
		ctx.arc(x, y, SPECTRUM_WIDTH, 0, Math.TAU);
		ctx.fill();
		ctx.stroke();

	};
	_updatePickers();

	// THE MOUSE EVENTS FOR THE PICKERS
	var editMode;
	var isDragging = false;
	var _update = function(event){

		if(event.target!=pickerCanvas) return; // if outta bounds forget it

		var x = event.offsetX*2;
		var y = event.offsetY*2;
		if(editMode=="hs"){
			x -= MARGIN_1*2;
			y -= MARGIN_1*2;
			_updateHS(x,y);
		}else{
			x -= MARGIN_1*2 + wheelCanvas.width + MARGIN_2*2;
			y -= MARGIN_1*2;
			_updateV(x,y);
		}

		// HEY TELL THE SOURCE
		_updateSource();

	};
	var _updateHS = function(x,y){

		// get polar
		var radius = wheelCanvas.width/2;
		var dx = x - radius;
		var dy = y - radius;
		var angle = Math.atan2(dy, dx);
		var distance = Math.sqrt(dx*dx+dy*dy);

		// Re-map
		angle = ((angle/Math.TAU)+0.5)*360; // to [0,360]
		if(angle<0) angle=0;
		if(angle>360) angle=360;
		distance = (distance/radius); // to [0,1]
		if(distance<0) distance=0;
		if(distance>1) distance=1;

		// update
		self.h = angle;
		self.s = distance;
		_updateSpectrum();
		_updatePickers();

	};
	var _updateV = function(x,y){
		self.v = 1-(y/spectrumCanvas.height);
		if(self.v<0) self.v=0;
		if(self.v>1) self.v=1;
		_updateWheel();
		_updatePickers();
	};
	var _onmousedown = function(event){
		isDragging = true;
		if(event.offsetX*2 < MARGIN_1*2 + wheelCanvas.width + MARGIN_2){
			editMode = "hs";
		}else{
			editMode = "v";
		}
		_update(event);
	};
	var _onmousemove = function(event){
		if(isDragging) _update(event);
	};
	var _onmouseup = function(){
		isDragging = false;
	};

	// MOUSE EVENTS
	pickerCanvas.addEventListener("mousedown", _onmousedown);
	window.addEventListener("mousemove", _onmousemove);
	window.addEventListener("mouseup", _onmouseup);

	// UPDATE SOURCE
	var _updateSource = function(){
		var newValue = [self.h, self.s, self.v];
		newValue[0] = parseFloat(newValue[0].toFixed(0));
		newValue[1] = parseFloat(newValue[1].toFixed(2));
		newValue[2] = parseFloat(newValue[2].toFixed(2));
		config.onchange(newValue);
	};

	// Kill
	self.kill = function(){
		
		// KILL LISTENERS
		dom.removeEventListener("mousedown", _onmousedown);
		window.removeEventListener("mousemove", _onmousemove);
		window.removeEventListener("mouseup", _onmouseup);

		// Hide Modal
		modal.hide();

	};

	// Show me!
	modal.show(self);

}

})();/////////////////////////////////////////
// FUNDAMENTAL USER INTERACE ACTORS /////
/////////////////////////////////////////

// TODO: Angle widget

/****************

Raw number widget: JUST the scrubber, no chooser

Widget Options:
{id:'steps', type:'number', placeholder:10, min:0, max:180, step:1}

****************/
Joy.add({
	type: "number",
	tags: ["ui"],
	initWidget: function(self){

		// Scrubber IS the DOM
		var o = self.options;
		var scrubber = new Joy.ui.Scrubber({
			min: o.min,
			max: o.max,
			step: o.step,
			value: self.getData("value"),
			onstart: function(){
				self.top.activePreview = self;
			},
			onstop: function(){
				self.top.activePreview = null;
			},
			onchange: function(value){
				self.setData("value", value);
			}
		});
		self.dom = scrubber.dom;

		// PREVIEW ON HOVER. WIGGLE IT JUST ONCE.
		
		var _ticker = null;
		var _fps = 30;
		self.dom.onmouseenter = function(){

			if(!self.top.canPreview("numbers")) return;
			
			// Create Preview Data
			self.previewData = _clone(self.data);

			// Wiggle by 5%... as long as that's not less than 0.5, not more than 2.
			var _amplitude = Math.abs(self.data.value*0.05);
			//if(_amplitude<0.5) _amplitude=0.5; // TODO: WITH SIGFIG
			//if(_amplitude>3) _amplitude=3;
			if(_amplitude==0) _amplitude=1; // If it's EXACTLY zero, wiggle with 1, whatever.
			var _timer = 0;
			_ticker = setInterval(function(){

				if(!self.top.canPreview("numbers")) return _stopPreview(); // don't even

				_timer += (Math.TAU/_fps)/0.25; // 0.25 seconds
				self.previewData.value = self.data.value + Math.sin(_timer)*_amplitude;
				self.update();

				if(_timer>Math.TAU) _stopPreview(); // yer done, son.

			},1000/_fps);

		};
		var _stopPreview = function(){
			if(_ticker) clearInterval(_ticker);
			self.previewData = null;
			self.update();
		};
		self.dom.onmouseleave = _stopPreview;
		

	},
	onget: function(my){
		return my.data.value;
	},
	placeholder: {
		value: 3
	}
});


/****************

A color widget! (for now, same as choose except paints DOM, too)

Widget Options:
{id:'direction', type:'choose', options:['left','right'], placeholder:'left'}

****************/

Joy.add({
	type: "color",
	tags: ["ui"],
	initWidget: function(self){

		// Color Button IS the DOM
		var colorButton = new Joy.ui.Button({
			label: "&nbsp;",
			onclick: function(){

				Joy.modal.Color({ // TODO: precision for those floats, y'know
					source: self.dom,
					value: self.getData("value"),
					onchange: function(value){
						self.setData("value", value);
						_changeLabelColor();
					},
					onopen: function(){
						self.top.activePreview = self;
					},
					onclose: function(){
						self.top.activePreview = null;
					}
				});

			},
			styles:["joy-color"]
		});
		self.dom = colorButton.dom;

		// Change button color!
		var _changeLabelColor = function(){
			var hsl = self.getData("value");
			colorButton.dom.style.background = _HSVToRGBString(hsl);
		};
		_changeLabelColor();

		// PREVIEW ON HOVER
		// BOUNCE the HSL Value up & down!
		var _ticker = null;
		var _fps = 30;
		var _initialV, _vel, _timer;
		self.dom.onmouseenter = function(){

			if(!self.top.canPreview("numbers")) return; // yeah let's pretend it's a number
			
			// Create Preview Data
			_initialV = self.data.value[2];
			self.previewData = _clone(self.data);

			// Bounce up & down for HALF a second
			_timer = 0;
			_vel = 2*(2/_fps);
			_ticker = setInterval(function(){

				if(!self.top.canPreview("numbers")) return _stopPreview(); // don't

				// Bounce up & down
				var hsl = self.previewData.value;
				hsl[2] += _vel;
				if(hsl[2] > 1){
					hsl[2] = 1;
					_vel *= -1;
				}
				if(hsl[2] < 0){
					hsl[2] = 0;
					_vel *= -1;
				}
				self.update();

				// Done!
				_timer += 2/_fps;
				if(_timer>=1) _stopPreview();

			},1000/_fps);
		};
		var _stopPreview = function(){
			if(_ticker) clearInterval(_ticker);
			self.previewData = null;
			self.update();
		};
		self.dom.onmouseleave = _stopPreview;

	},
	onget: function(my){
		return _HSVToRGBString(my.data.value);
	},
	placeholder: function(){
		var hue = Math.floor(Math.random()*360); // Random color!
		return [hue, 0.8, 1.0];
	}
});


/****************

A choose-y thing

Widget Options:
{name:'direction', type:'choose', options:['left','right'], placeholder:'left'}
// TODO... "options" gets overrided soooo UHHHHH.

****************/
Joy.add({
	type: "choose",
	tags: ["ui"],
	initWidget: function(self){

		var data = self.data;

		// Options
		var options = self.options;
		for(var i=0; i<options.length; i++){

			// convert to label/value if not already
			var o = options[i];
			if(!(o.label!==undefined && o.value!==undefined)){
				options[i] = {
					label: o.toString(),
					value: o
				};
			}

		}

		// ChooserButton *IS* DOM
		var chooserButton = new Joy.ui.ChooserButton({
			value: data.value,
			options: options,
			onchange: function(value){
				data.value = value;
				self.update(); // you oughta know!
			},
			styles: self.styles
		});
		self.dom = chooserButton.dom;

	},
	onget: function(my){
		return my.data.value;
	}
});


/****************

A widget to type in strings!

Widget Options:
{name:'name', type:'string', prefix:'&ldquo;', suffix:'&rdquo;', color:"whatever"}

****************/
Joy.add({
	type: "string",
	tags: ["ui"],
	initWidget: function(self){

		// String *IS* DOM
		var o = self.options;
		self.stringUI = new Joy.ui.String({
			prefix: o.prefix,
			suffix: o.suffix,
			color: o.color,
			value: self.getData("value"),
			onchange: function(value){
				self.setData("value", value);
			}
		});
		self.dom = self.stringUI.dom;

		// When data's changed, externally
		self.onDataChange = function(){
			var value = self.getData("value");
			self.stringUI.setString(value);
		};

	},
	onget: function(my){
		return my.data.value;
	},
	placeholder: "???"
});


/****************

A widget to save data as hash!

Widget Options:
{type:'save'} // NO "id"! It just saves the top-most data.

****************/

Joy.add({
	type: "save",
	tags: ["ui"],
	initWidget: function(self){

		// DOM
		var dom = document.createElement("div");
		dom.className = "joy-save";
		self.dom = dom;
		
		// Save Button
		self.saveButton = new Joy.ui.Button({
			label: "save:",
			onclick: function(){
				
				var url = Joy.saveToURL(self.top.data);
				self.url.setValue(url);
				self.url.select();

				// info
				var chars = url.length;
				self.info.innerHTML = "P.S: you can shorten your link with <a href='http://tinyurl.com/' target='_blank'>TinyURL</a>!"

			}
		});
		dom.appendChild(self.saveButton.dom);

		// URL TextBox
		self.url = new Joy.ui.TextBox({
			readonly: true
		});
		dom.appendChild(self.url.dom);

		// Details: chars & tinyurl link
		self.info = document.createElement("div");
		self.info.id = "joy-save-info";
		dom.appendChild(self.info);		

	}
});
////////////////////////////////////////////////////////
// THE BIG ACTOR: A "PROGRAMMABLE" LIST OF ACTIONS <3 //
////////////////////////////////////////////////////////

/****************

A nice list of actions.

WidgetConfig:
{type:'actions', name:'actions', resetVariables:false}

****************/
Joy.add({
	type: "actions",
	tags: ["ui"],
	init: function(self){

		if(self.resetVariables!==undefined) self.data.resetVariables=self.resetVariables;

		// TODO: ACTUALLY REFACTOR
		// TODO: Separate out Actor code from Widget code
		// so that this can run EVEN WITHOUT WIDGETS.
		// Using messages, probably.

	},
	initWidget: function(self){

		var data = self.data;
		var actions = data.actions;

		// DOM
		var dom = document.createElement("div");
		dom.className = "joy-actions";
		self.dom = dom;

		// List
		var list = document.createElement("list");
		list.id = "joy-list";
		dom.appendChild(list);

		// Preview Variables?
		/*var varPreview;
		if(self.top.canPreview("variables")){
			varPreview = document.createElement("div");
			varPreview.id = "joy-variables-preview";
			varPreview.innerHTML = "AHHHH";
			dom.appendChild(varPreview);
		}*/

		//////////////////////////////////////////
		// Create Bullet /////////////////////////
		//////////////////////////////////////////

		var bulletOptions = [
			{label:"Add action above", value:"action_above"},
			{label:"Add action below", value:"action_below"},
			{label:"Delete", value:"delete"}
		];
		var _onBulletChoice = function(entry, choice){

			// ACTION ABOVE or BELOW
			var newActionWhere = 0;
			if(choice=="action_above") newActionWhere=-1; // above
			if(choice=="action_below") newActionWhere=1; // below
			if(newActionWhere!=0){ // not NOT new action
				
				var newEntryIndex = self.entries.indexOf(entry);
				if(newActionWhere>0) newEntryIndex+=1;

				// Chooser Modal!
				Joy.modal.Chooser({
					position: "left",
					source: entry.bullet.dom,
					options: actionOptions,
					onchange: function(value){
						_addAction(value, newEntryIndex);
						self.update(); // You oughta know!
						_updateBullets(); // update the UI, re-number it.
					}
				});

			}

			// DELETE
			if(choice=="delete"){
				_removeFromArray(self.entries, entry); // Delete entry from Entries[]
				_removeFromArray(actions, entry.actionData); // Delete action from Data's Actions[]
				self.removeChild(entry.actor); // Delete actor from Children[]
				list.removeChild(entry.dom); // Delete entry from DOM
				self.update(); // You oughta know!
				_updateBullets(); // update the UI, re-number it.
			}

		};
		var _createBullet = function(entry){
		
			var bullet = new Joy.ui.ChooserButton({
				position: "left",
				staticLabel: _getBulletLabel(entry),
				options: bulletOptions,
				onchange: function(choice){
					_onBulletChoice(entry, choice);
				},
				styles: ["joy-bullet"]
			});
			bullet.dom.id = "joy-bullet";

			return bullet;

		};

		// Get the digit (or letter, or roman) for this bullet...
		var _getBulletLabel = function(entry){

			// What index am I?
			var index = self.entries.indexOf(entry)+1;

			// How many levels deep in "actions" am I?
			var levelsDeep = 0;
			var parent = self.parent;
			while(parent){
				if(parent.type=="actions") levelsDeep++;
				parent = parent.parent;
			}

			// Digit, Letter, or Roman? (Cycle around)
			var label;
			switch(levelsDeep%3){
				case 0: label=index; break; // digits
				case 1: label=_numberToAlphabet(index); break; // letter
				case 2: label=_numberToRoman(index); break; // roman
			}

			return label;

		};

		// Re-number ALL these bad boys
		var _updateBullets = function(){
			for(var i=0; i<self.entries.length; i++){
				var entry = self.entries[i];
				var bullet = entry.bullet;
				var label = _getBulletLabel(entry);
				bullet.setLabel(label);
			}
		};

		////////////////////////////////////////////////////////////////////
		// Add Entry: Entries have a Bullet (the number) & actual widget! //
		////////////////////////////////////////////////////////////////////

		self.entries = [];
		var _addEntry = function(actionData, atIndex){

			// New entry
			var entry = {};
			var entryDOM = document.createElement("div");
			if(atIndex===undefined) atIndex = self.entries.length;
			self.entries.splice(atIndex, 0, entry);
			list.insertBefore(entryDOM, list.children[atIndex]);

			// The Bullet is a Chooser!
			var bullet = _createBullet(entry);
			var bulletContainer = document.createElement("div");
			bulletContainer.id = "joy-bullet-container";
			entryDOM.appendChild(bulletContainer);
			bulletContainer.appendChild(bullet.dom);

			// New Actor!
			var newActor = self.addChild({type:actionData.type}, actionData);

			// The Widget
			var newWidget = newActor.createWidget();
			newWidget.id = "joy-widget";
			entryDOM.appendChild(newWidget);

			// (Remember all this)
			entry.dom = entryDOM;
			entry.bullet = bullet;
			entry.actor = newActor;
			entry.widget = newWidget;
			entry.actionData = actionData;

			// PREVIEW ON HOVER
			// Also tell the action "_PREVIEW": how far in the action to go?
			var _calculatePreviewParam = function(event){
				var param = event.offsetY / bullet.dom.getBoundingClientRect().height;
				if(param<0) param=0;
				if(param>1) param=1;
				_previewAction._PREVIEW = param;
				self.update();
			};
			var _previewAction;
			var _previewStyle;
			bulletContainer.onmouseenter = function(event){

				if(!self.top.canPreview("actions")) return;

				self.top.activePreview = self;
				
				// Create Preview Data
				self.previewData = _clone(self.data);
				var actionIndex = self.entries.indexOf(entry);
				_previewAction = self.previewData.actions[actionIndex];

				// STOP after that action!
				self.previewData.actions.splice(actionIndex+1, 0, {STOP:true});

				// How far to go along action?
				_calculatePreviewParam(event);

				// Add in a style
				_previewStyle = document.createElement("style");
				document.head.appendChild(_previewStyle);
				_previewStyle.sheet.addRule('.joy-actions.joy-previewing > #joy-list > div:nth-child(n+'+(actionIndex+2)+')','opacity:0.1');
				_previewStyle.sheet.addRule('.joy-actions.joy-previewing > div.joy-bullet','opacity:0.1');
				dom.classList.add("joy-previewing");

			};
			bulletContainer.onmousemove = function(event){
				if(self.previewData) _calculatePreviewParam(event);
			};
			bulletContainer.onmouseleave = function(){
				if(self.previewData){
					self.previewData = null;
					self.top.activePreview = null;
					self.update();
					document.head.removeChild(_previewStyle);
					dom.classList.remove("joy-previewing");
				}
			};

			return entry;

		};
		// add all INITIAL actions as widgets
		for(var i=0;i<actions.length;i++) _addEntry(actions[i]);

		///////////////////////////////////////
		// Add Action /////////////////////////
		///////////////////////////////////////

		// Manually add New Action To Actions + Widgets + DOM
		var _addAction = function(actorType, atIndex){

			// Create that new entry & everything
			var newAction = {type:actorType};
			if(atIndex===undefined){
				actions.push(newAction);
			}else{
				actions.splice(atIndex, 0, newAction);
			}
			var entry = _addEntry(newAction, atIndex);

			// Focus on that entry's widget!
			// entry.widget.focus();

		};

		// Actions you can add:
		// TODO: INCLUDE ALIASED ACTIONS
		var actionOptions = [];
		if(self.onlyActions){
			for(var i=0;i<self.onlyActions.length;i++){
				var actionType = self.onlyActions[i];
				var actorTemplate = Joy.getTemplateByType(actionType);
				var notActionTag = actorTemplate.tags.filter(function(tag){
					return tag!="action"; // first tag that's NOT "action"
				})[0];
				actionOptions.push({
					label: actorTemplate.name,
					value: actionType,
					category: notActionTag
				});
			}
		}else{
			var actionActors = Joy.getTemplatesByTag("action");
			for(var i=0;i<actionActors.length;i++){
				var actionActor = actionActors[i];
				var notActionTag = actionActor.tags.filter(function(tag){
					return tag!="action";
				})[0];
				actionOptions.push({
					label: actionActor.name,
					value: actionActor.type,
					category: notActionTag
				});
			}
		}

		// "+" Button: When clicked, prompt what actions to add!
		var addButton = new Joy.ui.ChooserButton({
			staticLabel: "+",
			options: actionOptions,
			onchange: function(value){
				_addAction(value);
				self.update(); // You oughta know!
			},
			styles: ["joy-bullet"]
		});
		dom.appendChild(addButton.dom);

	},
	onact: function(my){

		// Create _vars, if not already there
		if(!my.target._variables) my.target._variables={}; 

		// Reset all of target's variables?
		if(my.data.resetVariables) my.target._variables = {};

		// Do those actions, baby!!!
		for(var i=0; i<my.data.actions.length; i++){

			// Stop?
			var actionData = my.data.actions[i];
			if(actionData.STOP) return "STOP";

			// Run 
			var actor = my.actor.entries[i].actor; // TODO: THIS IS A HACK AND SHOULD NOT RELY ON THAT
			var actorMessage = actor.act(my.target, actionData); // use ol' actor, but GIVEN data.
			if(actorMessage=="STOP") return actorMessage;

		}

	},
	placeholder: {
		actions: [],
		resetVariables: true
	}
});
/////////////////////////////////////////
// LOGIC ACTORS /////////////////////////
/////////////////////////////////////////

Joy.module("instructions", function(){

	Joy.add({
		name: "Repeat the following...",
		type: "instructions/repeat",
		tags: ["instructions", "action"],
		init: "Repeat the following {id:'count', type:'number', min:1, placeholder:3} times: "+
			  "{id:'actions', type:'actions', resetVariables:false}",
		onact: function(my){
			
			// Previewing? How much to preview?
			var param = 1;
			if(my.data._PREVIEW!==undefined) param=my.data._PREVIEW;

			// Loop through it... (as far as preview shows, anyway)
			var loops = Math.floor(my.data.count*param);
			for(var i=0; i<loops; i++){
				var message = my.actor.actions.act(my.target);
				if(message=="STOP") return message; // STOP
			}

		}
	});

	/*Joy.add({
		name: "If... then...",
		type: "instructions/if",
		tags: ["instructions", "action"],
		init: "If AHHH, then: "+
			  "{id:'actions', type:'actions', resetVariables:false}",
		onact: function(my){
			var message = my.actor.actions.act(my.target);
			if(message=="STOP") return message; // STOP
		}
	});*/

	Joy.add({
		name: "// Write a note",
		type: "instructions/comment",
		tags: ["instructions", "action"],
		initWidget: function(self){

			// DOM
			self.dom = document.createElement("div");

			// Comment Box
			self.box = new Joy.ui.TextBox({
				multiline: true,
				placeholder: "// your notes here",
				value: self.getData("value"),
				onchange: function(value){
					self.setData("value", value);
				},
				styles: ["box"]
			});
			self.dom.appendChild(self.box.dom);

		}
	});

});
// VARIABLE NAME: you're just a synchronized string, yo.
Joy.add({
	type: "variableName",
	tags: ["ui"],
	init: function(self){

		var variableType = self.variableType;

		// Unique Variable Name
		var _uniqueVariableName = function(){
			var varnames = Joy.getReferencesByTag(self, variableType).map(function(ref){
				return ref.data.value;
			});
			var highestCount=0;
			varnames.forEach(function(varname){
				var num;
				if(varname=="thing") num=1; // at least 1
				var match = varname.match(/thing\s(\d+)/);
				if(match) num = parseInt(match[1]); // or more
				if(highestCount<num) highestCount=num;
			});
			if(highestCount==0) return "thing";
			else return "thing "+(highestCount+1);
		};

		// Create Reference method
		self._createNewReference = function(){
			var refData = {
				value: _uniqueVariableName(),
				color: _randomHSV()
			};
			var ref = Joy.createReference(self, variableType, refData);
			self.setData("refID", ref.id, true); // Remember Ref ID. And DON'T update.
			Joy.connectReference(self, ref.id); // connect new ref
		};

		// Do I already have a reference? Create one if no.
		var refID = self.getData("refID");
		if(refID){
			Joy.connectReference(self, refID); // connect this ref
		}else{

			// Well, first try seeing if there are any vars.
			// If so, connect to most recently created one
			var varReferences = Joy.getReferencesByTag(self, variableType);
			// CONFIG: self.startWithExisting!
			if(self.startWithExisting && varReferences.length>0){
				var latestReference = varReferences[varReferences.length-1];
				refID = latestReference.id;
				self.setData("refID", refID, true); // set data
				Joy.connectReference(self, refID); // connect this ref
			}else{
				// Otherwise, make a new one!
				self._createNewReference();
			}
			
		}

		// Switch reference 
		self._switchReference = function(newRefID){
			var refID = self.getData("refID");
			Joy.disconnectReference(self, refID); // disconnect old ref
			self.setData("refID", newRefID); // DO update this!
			Joy.connectReference(self, newRefID); // connect new ref
		};

	},
	initWidget: function(self){

		self.dom = document.createElement("span");
		
		// The String edits my REFERENCE'S data.
		var refID = self.getData("refID");
		var refData = Joy.getReferenceById(self, refID).data;
		var stringActor = self.addChild({
			type: "string",
			prefix:"[", suffix:"]",
			color: refData.color
		}, refData);
		var stringWidget = stringActor.createWidget();
		self.dom.appendChild(stringWidget);

		// This String Actor also updates its color
		var _old_stringActor_onDataChange = stringActor.onDataChange;
		stringActor.onDataChange = function(){
			_old_stringActor_onDataChange();
			var color = stringActor.getData("color");
			stringActor.stringUI.setColor(color);
		};

		// Chooser? Can choose to switch to other variables (or make new one)
		var variableType = self.variableType;
		var _showChooser = function(){

			var options = [];

			// Get all references that are of this type
			var refs = Joy.getReferencesByTag(self, variableType);
			var myRefID = self.getData("refID");
			refs.forEach(function(ref){
				if(ref.id==myRefID) return; // don't show SELF
				var color = ref.data.color;
				color = _HSVToRGBString(color[0], color[1], color[2]);
				options.push({
					label: "["+ref.data.value+"]",
					value: ref.id,
					color: color
				});
			});

			// Meta Options:
			options.push({
				category: "meta",
				label: "(+new)",
				value: "NEW"
			});
			options.push({
				category: "meta",
				label: "(change color)",
				value: "CHANGE_COLOR"
			});

			// Show all possible variables!
			Joy.modal.Chooser({
				source: self.dom,
				options: options,
				onchange: function(newRefID){

					if(newRefID=="CHANGE_COLOR"){

						// Just change color, ha.
						Joy.modal.Color({
							source: self.dom,
							value: stringActor.getData("color"),
							onchange: function(newColor){
								stringActor.setData("color", newColor);
								stringActor.stringUI.setColor(newColor); // do this again coz edit lock
							}
						});

					}else{

						// Make a new reference? Either way, set refID
						if(newRefID=="NEW"){
							var oldRefID = self.getData("refID");
							Joy.disconnectReference(self, oldRefID); // disconnect old ref
							self._createNewReference();
							self.update(); // update, yo
						}else{
							self._switchReference(newRefID);
						}

						// Make String Widget edit that instead
						var refID = self.getData("refID");
						var ref = Joy.getReferenceById(self, refID);
						stringActor.switchData(ref.data);

					}

				}
			});

		};

		// Show ON CLICK!
		if(!self.noChooser){
			self.dom.onclick = _showChooser;
		}
		
	},
	onget: function(my){
		var refID = my.data.refID;
		var ref = Joy.getReferenceById(my.actor, refID);
		return ref.data.value; // returns the variable name
	},
	onkill: function(self){
		
		// Disconnect any references I may have
		var refID = self.getData("refID");
		Joy.disconnectReference(self, refID); // disconnect old ref

	}
});/////////////////////////////////////////
// MATH ACTORS //////////////////////////
/////////////////////////////////////////

Joy.module("math", function(){

	/*********************

	Alright. This is gonna be a big one.
	It needs to be able to chain math elements,
	and each element needs to be able to switch between
	scrubbers, variables, and other number-getter actors.

	Data:
	{
		type: "number",
		chain:[
			{type:"number_raw", value:3},
			{type:"choose", value:"*"},
			{type:"variableName", refID:whatever},
			{type:"choose", value:"+"},
			{type:"turtle/getAngle"}
		]
	}

	*********************/
	Joy.modify("number", "number_raw", function(_old){
		return {
			init: function(self){

				// no variables?
				if(self.noVariables) return;

				// Force data to a chain...
				var originalValue = self.getData("value");
				if(typeof originalValue==="number"){
					self.setData("value",undefined,true); // delete "value", no update
					self.setData("chain",[
						{type:"number_raw", value:originalValue}
					],true); // create "chain", no update
				}

				// MAKE A NEW CHAIN ACTOR *AND DATA(?)*
				self._makeNewChainActor = function(chainItem, atIndex){

					// Make it
					var chainActor;
					var type = chainItem.type;
					switch(type){

						// Elements
						case "number_raw":
							chainActor = self.addChild({type:type}, chainItem);
							break;
						case "variableName":
							chainActor = self.addChild({
								type: type,
								variableType: 'number',
								noChooser: true
							}, chainItem);
							break;

						// Operand
						case "choose":
							chainActor = self.addChild({
								type:type, 
								options:[
									{ label:"+", value:"+" },
									{ label:"-", value:"-" }, 
									{ label:"&times;", value:"*" },
									{ label:"&divide;", value:"/" }
								],
								styles: ["joy-math"]
							}, chainItem);
							break;

					}

					// Add or splice to Chain Actors array! *AND THE DATA*
					var chain = self.getData("chain");
					if(atIndex!==undefined){
						self.chainActors.splice(atIndex, 0, chainActor);
						chain.splice(atIndex, 0, chainItem);
					}else{
						self.chainActors.push(chainActor);
						chain.push(chainItem);
					}

					// Return
					return chainActor;

				}

				// Create an actor for each element in the chain
				self.chainActors = []; // keep a chain parallel to children. this one's in ORDER.
				var realChain = self.getData("chain");
				var chain = _clone(realChain);
				realChain.splice(0, realChain.length); // empty out realChain
				for(var i=0; i<chain.length; i++){
					self._makeNewChainActor(chain[i]);
				}

				// REPLACE A CHAIN ACTOR *AND DATA*
				self._replaceChainActor = function(oldChainActor, newItem){

					// Delete old actor, and add new actor where it was
					var oldIndex = self._deleteChainActor(oldChainActor);
					var newChainActor = self._makeNewChainActor(newItem, oldIndex);

					// update manually!
					self.update();

					// Return
					return newChainActor;

				};

				// DELETE A CHAIN ACTOR *AND DATA*
				self._deleteChainActor = function(chainActor){

					// Delete actor
					var oldIndex = self.chainActors.indexOf(chainActor);
					_removeFromArray(self.chainActors, chainActor);
					self.removeChild(chainActor);

					// and data!
					var chain = self.getData("chain");
					chain.splice(oldIndex, 1);

 					// so can re-use index
					return oldIndex;

				};

			},
			initWidget: function(self){

				// no variables?
				if(self.noVariables){
					_old.initWidget(self);
					return;
				}

				// Container!
				self.dom = document.createElement("span");
				self.dom.className = "joy-number";

				// Show Chooser!
				var _showChooser = function(chainActor){

					var options = [];

					// Show placeholder number (unless i'm a number_raw, or there isn't one)
					if(chainActor.type!="number_raw"){
						var placeholderNumber = self.placeholder.value;
						if(typeof placeholderNumber==="number"){
							options.push({
								label: placeholderNumber,
								value: {
									type: "number_raw",
									value: placeholderNumber
								}
							});
						}
					}

					// Show possible variables (except the current variable)
					var refs = Joy.getReferencesByTag(self, "number");
					var myRefID;
					if(chainActor.type=="variableName") myRefID=chainActor.getData("refID");
					refs.forEach(function(ref){
						if(ref.id==myRefID) return; // don't show SELF
						var color = ref.data.color;
						color = _HSVToRGBString(color[0], color[1], color[2]);
						options.push({
							label: "["+ref.data.value+"]",
							value: {
								type: "variableName",
								refID: ref.id
							},
							color: color
						});
					});

					// Show all these dang options!
					if(options.length>0){
						Joy.modal.Chooser({
							source: chainActor.dom,
							options: options,
							onchange: function(newItem){
								// REPLACE CHAIN ACTOR & ENTRY
								var newChainActor = self._replaceChainActor(chainActor, newItem);
								self._replaceChainEntry(chainActor, newChainActor);
							}
						});
					}

				};

				// THE WAY TO ORGANIZE THIS: ENTRIES that have DOM *and* ACTOR
				self._chainEntries = [];

				// MAKE CHAIN ENTRY
				self._makeChainEntry = function(chainActor, atIndex){

					// Widget
					var widget = document.createElement("span");
					chainActor.createWidget();
					widget.appendChild(chainActor.dom);

					// Widget chooser, if NOT an operand
					if(chainActor.type!="choose"){
						var entry;
						var moreButton = new Joy.ui.Button({
							onclick: function(){
								_showChainOptions(entry);
							},
							styles: ["joy-more"]
						});
						widget.appendChild(moreButton.dom);
					}

					// Place in widget
					if(atIndex!==undefined){
						if(atIndex < self.dom.childNodes.length){
							// replacing NOT at last child...
							var beforeThisWidget = self.dom.childNodes[atIndex];
							self.dom.insertBefore(widget, beforeThisWidget);
						}else{
							// Otherwise just append
							self.dom.appendChild(widget);
						}
					}else{
						self.dom.appendChild(widget);
					}

					// If it's NOT an operand, clicking it reveals options
					if(chainActor.type!="choose"){
						(function(ca){
							ca.dom.addEventListener("click", function(){
								_showChooser(ca);
								// TODO: wasDragging
							});
						})(chainActor);
					}

					// Entry
					entry = {
						widget: widget,
						actor: chainActor
					};
					if(atIndex!==undefined){
						self._chainEntries.splice(atIndex, 0, entry);
					}else{
						self._chainEntries.push(entry);
					}

				};

				// DELETE CHAIN ENTRY
				self._deleteChainEntry = function(chainActor){

					// Get index (so can return later)
					var entry = self._chainEntries.find(function(entry){
						return entry.actor == chainActor;
					});
					var index = self._chainEntries.indexOf(entry);

					// Delete widget & entry (actor's already been deleted)
					var widget = entry.widget;
					self.dom.removeChild(widget);
					_removeFromArray(self._chainEntries, entry);

					// Index?
					return index;

				};

				// REPLACE CHAIN ENTRY
				self._replaceChainEntry = function(oldChainActor, newChainActor){
					var oldIndex = self._deleteChainEntry(oldChainActor);					
					self._makeChainEntry(newChainActor, oldIndex);
				};

				// SHOW CHAIN OPTIONS
				var _showChainOptions = function(entry){

					// Possible operands
					var currentLabel = entry.widget.innerText;
					var options = [
						{label:currentLabel+" + 2", value:"+"},
						{label:currentLabel+" - 2", value:"-"},
						{label:currentLabel+" &times; 2", value:"*"},
						{label:currentLabel+" &divide; 2", value:"/"}
					];

					// To delete... which operand?
					var elementIndex = self._chainEntries.indexOf(entry);
					if(self._chainEntries.length>1){ // can't delete if just one
						
						// The operand...
						var operandIndex;
						if(elementIndex==0) operandIndex=elementIndex+1; // first
						else operandIndex=elementIndex-1; // not

						// Label
						var label;
						var operandLabel = self._chainEntries[operandIndex].widget.innerText;
						if(elementIndex==0) label = currentLabel+" "+operandLabel; // first
						else label = operandLabel+" "+currentLabel; // not

						// Indices to delete
						var indicesToDelete = [elementIndex, operandIndex].sort(); // increasing order

						// Push option!
						options.push({
							category: "meta",
							label: '(delete “'+label+'”)',
							value: indicesToDelete
						});

					}

					// Choose options!
					Joy.modal.Chooser({
						source: entry.widget,
						options: options,
						onchange: function(operand){

							// It's an operand...
							if(typeof operand==="string"){

								// Get index of the actor...
								var index = self._chainEntries.indexOf(entry);

								// Make the OPERAND actor(+data) & entry
								index++;
								var operandActor = self._makeNewChainActor({type:"choose", value:operand}, index);
								self._makeChainEntry(operandActor, index);

								// Make the NUMBER actor(+data) & entry (just the number 2, why hot)
								index++;
								var numberActor = self._makeNewChainActor({type:"number_raw", value:2}, index);
								self._makeChainEntry(numberActor, index);

							}else{

								// Otherwise, DELETE ACTOR & ENTRY!
								var indices = operand;
								for(var i=indices.length-1; i>=0; i--){ // flip around coz DELETING
									var indexToDelete = indices[i];
									var actorToDelete = self._chainEntries[indexToDelete].actor;
									self._deleteChainActor(actorToDelete);
									self._deleteChainEntry(actorToDelete);
								}

							}

							// Update!
							self.update();

						}
					});

				};

				// For each chain actor, put in that entry
				for(var i=0; i<self.chainActors.length; i++){
					var chainActor = self.chainActors[i];
					self._makeChainEntry(chainActor);
				}

			},
			onget: function(my){

				// no variables?
				if(my.actor.noVariables){
					return _old.onget(my);
				}

				////////////////

				var result;
				for(var i=0; i<my.data.chain.length; i+=2){

					// Synched indices!
					var chainActor = my.actor.chainActors[i]; 

					// Evaluate element
					var num;
					switch(chainActor.type){
						case "number_raw":
							num = chainActor.get(my.target);
							break;
						case "variableName":
							var _variables = my.target._variables;
							var varname = chainActor.get(my.target); // it's just a synchronized string
							num = _variables[varname];
							break; 
					}

					// First one: Result's just num
					if(i==0){
						result = num;
					}else{
						// Evaluate operand & run it
						var operandActor = my.actor.chainActors[i-1];
						var op = operandActor.get();
						switch(op){
							case "+": result+=num; break;
							case "-": result-=num; break;
							case "*": result*=num; break;
							case "/": result/=num; break;
						}
					}

					// TODO: ORDER OF OPERATIONS, I GUESS.

				}
				return result;
			}
		};
	});

	/****************

	Set a variable to some number.

	****************/
	Joy.add({
		name: "Set [number]",
		type: "math/set",
		tags: ["math", "action"],
		init: "Set {id:'varname', type:'variableName', variableType:'number'} to {id:'value', type:'number'}",
		onact: function(my){
			var _variables = my.target._variables;
			var varname = my.data.varname; // it's just a synchronized string
			_variables[varname] = my.data.value; // Set the variable
		}
	});

	/****************

	Do math on some variable

	****************/
	Joy.add({
	
		name: "Do math to [number]",
		type: "math/operation",
		tags: ["math", "action"],

		init: JSON.stringify({
			id:'operation', type:'choose',
			placeholder: "+",
			options:[
				{ label:"+ Increase", value:"+" },
				{ label:"- Decrease", value:"-" },
				{ label:"&times; Multiply", value:"*" },
				{ label:"&divide; Divide", value:"/" }
			]
		})+" {id:'varname', type:'variableName', variableType:'number', startWithExisting:true}"
		+" by {id:'value', type:'number'}",

		onact: function(my){

			var vars = my.target._variables;
			var varname = my.data.varname;
			if(vars[varname]===undefined) vars[varname]=0; // Set to 0, if nothing's there.

			switch(my.data.operation){
				case "+": vars[varname] += my.data.value; break;
				case "-": vars[varname] -= my.data.value; break;
				case "*": vars[varname] *= my.data.value; break;
				case "/": vars[varname] /= my.data.value; break;
			}

		}

	});

	/****************

	If then... for math

	****************/
	Joy.add({
		name: "If [math] then...",
		type: "math/if",
		tags: ["math", "action"],
		init: "If {id:'value1', type:'number'} "+
			  "{id:'test', type:'choose', options:['<','≤','=','≥','>'], placeholder:'='} "+
			  "{id:'value2', type:'number'}, then: "+
			  "{id:'actions', type:'actions', resetVariables:false}",
		onact: function(my){

			var value1 = my.data.value1;
			var value2 = my.data.value2;

			var result;
			switch(my.data.test){
				case '<': 
					result = value1<value2;
					break;
				case '≤': 
					result = value1<=value2;
					break;
				case '=': 
					result = value1==value2;
					break;
				case '≥': 
					result = value1>=value2;
					break;
				case '>':
					result = value1>value2;
					break;
			}

			if(result){
				var message = my.actor.actions.act(my.target);
				if(message=="STOP") return message; // STOP
			}

		}
	});

});
