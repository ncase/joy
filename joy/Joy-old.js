/*****************

JOY.js: easy, expressive end-user programming

The JOY Architecture:
     [ ACTORS ]
    /    |     \
 Player Editor  Data

ACTORS basically control everything. They manage communication between:
* the Player (the model/sim/game/thing being "programmed")
* the Editor (the end-user programming interface)
* the Data
The Player, Editor & Data DO NOT TALK DIRECTLY TO EACH OTHER
(This lets them all be modular and separate!)

*****************/

function Joy(config){

	var self = (this==window) ? {} : this; // 'this' should NOT be "window"

	// Set data & actor
	self.data = config.data || {};
	self.actor = config;
	self.parent = null;
	self.top = self;

	// Initialize References on my data
	Joy.initReferences(self.data);
	
	// I'm a widget
	Widget.setupWidget(self);
	Widget.configureWithString(self, config.widget);

	// Add widget's onchange()
	self.onchange = function(data){
		setTimeout(function(){
			if(config.onchange) config.onchange(data);
		},1); // have to do this coz watch.js isn't instant. weird threading issues.
	};

	// Add it to a DOM
	self.container = (typeof config.dom==="string") ? document.querySelector(config.dom) : config.dom;
	self.container.appendChild(self.dom);

	// Initialize the UI
	ui.init(self);
	modal.init();

	// Run "onchange" once at the start!
	self.onchange(self.data); // TODO: framerate-limit the onchange?

}

/***

ACTORS help Joy communicate

Actors do Editor<->Data communication with Widgets
Actors do Player<->Data communication with Actions

Actor Configs look like this:

Joy.add({
	type: "turtle/forward",
	tag: "action", (or tags:["blah blah"])
	widget: "Move forward {data:'number', type:'number'} steps",
	act: function(topdata, data, target){
		target.forward(data.steps);
	}
});

***/

// Adding & retrieving Actors
Joy.actors = [];
Joy.add = function(actor){

	// Cleanup
	actor.tags = actor.tags ? _forceToArray(actor.tags) : _forceToArray(actor.tag);

	// Push!
	Joy.actors.push(actor);

};
Joy.getActorByType = function(type){
	var actor = Joy.actors.find(function(actor){
		return actor.type==type;
	});
	if(!actor) throw Error("No actor of type '"+type+"'!");
	return actor;
};
Joy.getActorsByTag = function(tag){
	return Joy.actors.filter(function(actor){
		return actor.tags.indexOf(tag)>=0;
	});
};

// Player<->Data: Acting on target, Getting from target
Joy.act = function(topdata, data, target){

	// Try to auto-get all data BEFOREHAND.
	data = _clone(data);
	var actor;
	for(var key in data){
		var subData = data[key];
		if(subData.type){ // it's an object...
			actor = Joy.getActorByType(subData.type);
			if(actor.get){ // ...AND it has a "get" method
				data[key] = actor.get(topdata, subData, target);
			}
		}
	}

	// Make that actor act on it!
	actor = Joy.getActorByType(data.type);
	actor.act(topdata, data, target);

};
Joy.get = function(topdata, data, target){
	var actor = Joy.getActorByType(data.type);
	return actor.get(topdata, data, target);
};

// Aliases, for clarity's sake
Joy.alias = function(inheritType, mods){
};

/***

WIDGETS do communication between Editor<->Data

Widget Configs look like this:
{data:'count', type:'number', placeholder:[]} 

***/
function Widget(widgetConfig, data, parent){

	var self = this;

	// Properties
	self.widgetConfig = widgetConfig;
	self.parent = parent;
	self.top = self.parent ? self.parent.top : self;
	self.data = data;

	// Get Actor
	self.type = self.widgetConfig.type;
	self.actorConfig = Joy.getActorByType(self.type);

	// Get widget-creation string or function, & build me!
	Widget.setupWidget(self);
	var constructor = self.actorConfig.widget;
	if(typeof constructor==="string") Widget.configureWithString(self, constructor);
	if(typeof constructor==="function") constructor(self);

}

// Making this a separate function so the Main Editor can use it too
Widget.setupWidget = function(self){

	// Sub-Widgets
	self.widgets = [];
	self.createWidget = function(widgetConfig, widgetData){
		var widget = new Widget(widgetConfig, widgetData, self);
		self.widgets.push(widget);
		return widget;
	};
	self.addWidget = function(widget){
		self.widgets.push(widget);
	};
	self.removeWidget = function(widget){
		_removeFromArray(self.widgets, widget);
		widget.kill();
	};
	self.replaceWidget = function(oldWidget, newWidget){
		var oldDOM = oldWidget.dom;
		oldDOM.parentNode.insertBefore(newWidget.dom, oldDOM);
		self.removeWidget(oldWidget);
		self.addWidget(newWidget);
	}

	// Update!
	self.onchange = null;
	self.update = function(){
		if(self.onchange) self.onchange(self.data);
		if(self.parent) self.parent.update();
	};

	// Kill!
	self.onkill = null;
	self.kill = function(){

		// On Kill?
		if(self.onkill) self.onkill();

		// Remove my DOM
		if(self.dom.parentNode) self.dom.parentNode.removeChild(self.dom);

		// Un-watch my data
		unwatch(self.data, _onDataChange);

		// Kill all sub-widgets
		self.widgets.forEach(function(widget){
			widget.kill();
		});

	};

	// TODO: Placeholder code goes here?
	// TODO: Reference code goes here?

	// WATCH DATA
	var _iAmEditing = false;
	self.onDataChange = null;
	var _onDataChange = function(attr, op, newValue, oldValue){	
		if(_iAmEditing) return;
		if(self.data._DELETE_ME_ && self.onDataDelete){
			self.onDataDelete(self.data); // data DELETED.
		}else if(self.onDataChange){
			self.onDataChange(self.data); // data changed!
		}
	};
	watch(self.data, _onDataChange);
	self.lock = function(callback){
		_iAmEditing = true;
		callback(); // just preventing a double UI update
		setTimeout(function(){
			_iAmEditing = false;
		},1); // some weird threading issue, i dunno
	};

};

// Uses string to configure widget's widgets, dom, and MAYBE placeholder data.
Widget.configureWithString = function(self, constructor){

	// DOM & Markup
	self.dom = document.createElement("span");
	var html = constructor;

	// Find & replace all my SUB-widgets.
	var startIndex = -1;
	var endIndex = -1;
	var stack = 0;
	var widgetConfigs = [];
	for(var i=0; i<html.length; i++){

		var character = html[i];

		// Start at top...
		if(stack==0){
			if(character=="{") startIndex = i;
		}

		// Stack!
		if(character=="{") stack++;
		if(character=="}") stack--;

		// End at top...
		if(stack==0){
			if(character=="}"){
				endIndex = i+1;

				// cut out the start to end, save it as JSON,
				// and replace with <span id=''></span>
				var json = html.slice(startIndex, endIndex);
				json = json.replace(/(\w+)\:/g,"'$1':"); // give props quotes
				json = json.replace(/\'/g,'"'); // replace ' with "
				json = JSON.parse(json);
				var index = widgetConfigs.length;
				widgetConfigs.push(json); // remember config!
				html = html.substr(0, startIndex) + "<span id='widget_"+index+"'></span>" + html.substr(endIndex);

				// RESET, WHATEVER
				i=0;
				startIndex = -1;
				endIndex = -1;
				stack = 0;

			}
		}
		
	}
	self.dom.innerHTML = html;

	// Actually create & put in all my SUB-widgets
	for(var i=0; i<widgetConfigs.length; i++){

		var widgetConfig = widgetConfigs[i];

		// What data is this widget editing? (if any)
		var key = widgetConfig.data;
		var subData;
		if(key){
			// If asks for data, but there's none, create placeholder data!
			subData = self.data[key];
			if(subData===undefined){ // not just "zero" or "false"

				var placeholder;
				if(widgetConfig.placeholder!==undefined){
					// Use placeholder defined in widgetConfig
					placeholder = _clone(widgetConfig.placeholder);
				}else{
					// Use placeholder defined in Actor
					var actor = Joy.getActorByType(widgetConfig.type);
					if(actor.placeholder){
						placeholder = _clone(actor.placeholder);
					}else{
						placeholder = {}; // give up
					}
				}

				// Force placeholder into being an OBJECT. with "value".
				if(typeof placeholder != "object"){
					placeholder = { value:placeholder };
				}

				// Make sure placeholder knows its TYPE.
				placeholder.type = widgetConfig.type;

				// Replace at data-object itself!
				self.data[key] = placeholder; 
				subData = self.data[key];

			}
		}

		// Create sub-widget
		var subWidget = self.createWidget(widgetConfig, subData);

		// Replace the <span>
		var span = self.dom.querySelector("span#widget_"+i);
		span.parentNode.replaceChild(subWidget.dom, span);

	}

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

/***

REFERENCES

This is so that Widgets can sync up with each other, re: names and stuff
Not just variables: functions, strings, object names, etc.

Each reference should have: Unique ID, Tag, Data, Watchers
(when Watchers[].length==0, delete that reference. Garbage day)

***/

Joy.initReferences = function(topdata){
	
	// Create if not already
	if(!topdata._references) topdata._references={};

	// Zero out all _creators, it's a brand new world.
	for(var id in topdata._references){
		var ref = topdata._references[id];
		ref._creators = 0;
	}

};

Joy.createReference = function(topdata, tags, data){

	// The reference
	var reference = {
		id: _generateUID(topdata._references),
		tags: _forceToArray(tags),
		data: data,
		_creators: 0 // tracks how many widgets this thing actually depends on
	};
	topdata._references[reference.id] = reference;

	// Gimme
	return reference;

};

Joy.deleteReference = function(topdata, id){
	var reference = topdata._references[id];
	delete topdata._references[id];
};

Joy.getReferenceById = function(topdata, id){
	return topdata._references[id];
};

// TODO: search by MULTIPLE tags?
Joy.getReferencesByTag = function(topdata, tag){
	var refs = [];
	for(var id in topdata._references){
		var ref = topdata._references[id];
		if(ref.tags.indexOf(tag)>=0) refs.push(ref);
	}
	return refs;
};

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