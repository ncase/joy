/*****************

JOY.js: easy, expressive end-user programming

The JOY Architecture:
     [ ACTORS ]
    /    |     \
 Player Editor  Data

ACTORS basically manage everything. They handle communication between:
* the Player (the model/sim/game/thing being "programmed")
* the Editor (the end-user programming interface)
* the Data
The Player, Editor & Data DO NOT TALK DIRECTLY TO EACH OTHER
(This lets them all be modular and separate!)

*****************/

function Joy(template){

	// You can call this as "new Joy()" or just "Joy()" 
	var self = (this==window) ? {} : this;

	// I'm a Joy.Actor!
	Joy.Actor.call(self, {
		_template: template
	});

	// And: automatically create MY widget!
	self.createWidget();
	if(self.container){ // ...and auto-add my DOM to a container, if provided in template
		if(typeof self.container==="string") self.container=document.body.querySelector(self.container);
		self.container.appendChild(self.dom);
	}

	// TODO: namespace both of these
	ui.init(self);
	modal.init();

	// Trigger "change" once at the start!
	self.trigger("change");

	// gimme
	return self;

}

/*****************

ACTORS help the Player, Editor & Data talk to each other.

To create an Actor, you need to pass it a "options" object like so:
(ALL the parameters are optional, btw)
{
	type: "number", // what Actor Template to inherit from.
	prop: "steps", // what property of my parent's data should be MY data
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

	// Inherit from Actor Template, if any (or just pass an ENTIRE template.)
	// And THEN inherit from "options"
	self.type = options.type;
	if(self.type){
		self.template = Joy.getTemplateByType(self.type);
	}else if(options._template){
		self.template = options._template;
	}
	_configure(self, self.template);
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
	if(!self.placeholder.type){
		// If data type not already specified, do that!
		self.placeholder.type = self.type;
	}

	// If you didn't already pass in a data object, let's figure it out!
	self.data = self.data || data;
	if(!self.data){
		var parent = self.parent;
		var prop = self.prop;
		if(parent && prop){
			// My data's a property of parent's data!
			if(!parent.data[prop]){ 
				parent.data[prop] = _clone(self.placeholder); // if nothing, placeholder
			}
			self.data = parent.data[prop];
		}else{
			// ...otherwise, I'm standalone data.
			self.data = _clone(self.placeholder);
		}
	}

	/////////////////////////////////
	// ACTOR <-> EDITOR: "WIDGETS" //
	/////////////////////////////////

	// Init & Create Widget (if none, just put a "todo")
	self.initWidget = self.initWidget || function(){
		self.dom = document.createElement("span");
		self.dom.innerHTML = "[todo: '"+self.type+"' widget]";
	};
	self.createWidget = function(){
		self.initWidget(self); // bind
		return self.dom;
	};

	// Send events up the chain! e.g. "change", "preview"
	self._eventListeners = [];
	self.on = function(eventName, callback){
		self._eventListeners.push({
			eventName: eventName,
			callback: callback
		});
	};
	self.trigger = function(eventName, data){

		// Trigger all callbacks!
		var callbacks = self._eventListeners.filter(function(listener){
			return listener.eventName==eventName;
		}).map(function(listener){
			return listener.callback;
		});
		var message = {
			actor: self,
			data: data
		};
		callbacks.forEach(function(callback){
			callback(message);
		});

		// Bubble up!
		if(self.parent) self.parent.trigger(eventName, message);
		
	};
	// Some common callbacks
	if(self.onchange) self.on("change",self.onchange);
	if(self.onpreview) self.on("preview",self.onpreview);

	// Preview on hover!
	self.isCurrentlyEditing = false;
	self.previewData = null;
	self.preview = function(dom, callback){

		var _t = 0;
		var _ticker = null;
		var _previewCallback = callback;

		// Start & Stop previewing
		var _preview = function(){
			if(self.isCurrentlyEditing){
				_stopPreviewing();
			}else{
				self.previewData = _clone(self.data);
				_previewCallback(self.data, self.previewData, Math.sin(_t));
				self.trigger("change");
				_t += 0.1;
			}
		};
		var _stopPreviewing = function(){
			_t = 0;
			clearInterval(_ticker);
			self.previewData = null;
			self.trigger("change");
		};

		// Mouse Events
		dom.addEventListener("mouseover",function(){
			if(self.isCurrentlyEditing) return;
			_preview();
			_ticker = setInterval(_preview, 1000/60);
		});
		dom.addEventListener("mouseout", _stopPreviewing);

	};

	/////////////////////////////////
	// ACTOR <-> PLAYER: "TARGETS" //
	/////////////////////////////////

	// Actors can ACT ON targets...
	self.onact = self.onact || function(){};
	self.act = function(target){

		// Real or Preview data?
		var data;
		if(self.previewData){
			data = _clone(self.previewData);
		}else{
			data = _clone(self.data);
		}

		// Try to pre-evaluate all data beforehand!
		self.children.forEach(function(childActor){
			var prop = childActor.prop;
			if(prop){
				var value = childActor.get(target);
				data[prop] = value;
			}
		});

		// Send a message to self.onact
		var message = {
			actor: self,
			target: target,
			data: data
		};
		self.onact(message);

	};

	// ...or GET INFO from targets.
	self.onget = self.onget || function(){};
	self.get = function(target){

		// Real or Preview data?
		var data;
		if(self.previewData){
			data = _clone(self.previewData);
		}else{
			data = _clone(self.data);
		}

		// Message
		var message = {
			actor: self,
			target: target,
			data: data
		};
		return self.onget(message);

	};

	/////////////////////////////////
	// INITIALIZE ///////////////////
	/////////////////////////////////

	// Initialization string?
	if(self.init) Joy.initializeWithString(self, self.init);

};

// Templates that future Actors can be made from!
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
			json = json.replace(/(\w+)\:/g,"'$1':"); // cleanup: give properties quotes
			json = json.replace(/\'/g,'"'); // cleanup: replace ' with "
			json = JSON.parse(json);
			json.id = json.id || json.prop; // cleanup: if no explicit id, id is prop
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
		var child = self.addChild(actorOption);
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

		// gimme
		return self.dom;

	};

};

/***

SAVE & LOAD

***/

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
