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

