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
	onupdate: function(my){
		my.instructors.act(target);
	}
}

*****************/

// THE JOY MASTER
function Joy(options){

	// You can call this as "new Joy()" or just "Joy()" 
	var self = (this==window) ? {} : this;

	// I'm a Joy.Actor!
	Joy.Actor.call(self, options);

	// MASTER Options
	if(self.allowPreview==undefined) self.allowPreview = false;
	self.isCurrentlyEditing = false;
	self.canPreview = function(){
		return self.allowPreview && !self.isCurrentlyEditing;
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
		if(self.onupdate) self.onupdate(self);
		if(self.parent) self.parent.update();
	};

	// Kill
	self.kill = self.kill || function(){}; // to implement

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
	self.setData = function(dataID, newValue){
		self.data[dataID] = newValue;
		self.update();
	};

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

	// Preview on hover!
	self.previewData = null;
	self.preview = function(dom, callback){

		// Start & Stop previewing
		var _preview = function(event){
			if(!self.top.canPreview()){
				_stopPreviewing();
			}else{
				self.previewData = _clone(self.data);
				callback(self.data, self.previewData);
				self.update();
			}
		};
		var _stopPreviewing = function(){
			self.previewData = null;
			self.update();
		};

		// Mouse Events
		dom.addEventListener("mouseenter",function(event){
			if(!self.top.canPreview()) return;
			_preview();
		}, false);
		dom.addEventListener("mouseleave", _stopPreviewing);

	};

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

// Templates 
Joy.templates = [];
Joy.add = function(template){
	Joy.templates.push(template);
};
Joy.getTemplateByType = function(type){
	var template = Joy.templates.find(function(template){
		return template.type==type;
	});
	if(!template) throw Error("No actor template of type '"+type+"'!");
	return template;
};
Joy.getActorsByTag = function(tag){
	return Joy.templates.filter(function(template){
		return template.tags.indexOf(tag)>=0;
	});
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
