(function(){

// SINGLETON
var ui = {};
Joy.ui = ui;

ui.init = function(master){

	// CSS
	master.dom.classList.add("joy-master");

	// Manual Scroll
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
	var startDragX, startDragValue;
	var _onmousedown = function(event){
		isDragging = true;
		startDragX = event.clientX;
		startDragValue = self.value;
		if(config.onstart) config.onstart();
	};
	var _onmousemove = function(event){
		if(isDragging){

			// What's the step?
			var step = Math.pow(0.1,self.sigfigs);
			step = parseFloat(step.toPrecision(1)); // floating point crap
			
			// Change number
			var dx = Math.floor((event.clientX - startDragX)/2);
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
		if(config.onstop) config.onstop();
		setTimeout(function(){
			isDragging = false; // so can't "click" if let go on scrubber
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

		if(isDragging) return; // can't click if I was just dragging!

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
	var color = config.color || "";
	dom.style.color = color;
	dom.style.borderColor = color;

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

})();