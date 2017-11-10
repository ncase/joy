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

	// Allow Preview?
	if(self.allowPreview==undefined) self.allowPreview = false;
	self.activelyEditingActor = null;
	self.canPreview = function(){
		return self.allowPreview && !self.activelyEditingActor;
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
