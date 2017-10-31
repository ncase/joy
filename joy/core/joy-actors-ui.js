/////////////////////////////////////////
// FUNDAMENTAL USER INTERACE ACTORS /////
/////////////////////////////////////////

/****************

Raw number widget: JUST the scrubber, no chooser

Widget Options:
{id:'steps', type:'number', placeholder:10, min:0, max:180, step:1}

****************/
Joy.add({
	type: "scrubber",
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
				self.top.activelyEditingActor = self;
			},
			onstop: function(){
				self.top.activelyEditingActor = null;
			},
			onchange: function(value){
				self.setData("value", value);
			}
		});
		self.dom = scrubber.dom;

		// PREVIEW ON HOVER
		// WIGGLE IT BACK & FORTH +/- 2 (amplitude slowly grows)
		var _ticker = null;
		var _fps = 30;
		var _timer;
		var _amplitude;
		self.dom.onmouseenter = function(){

			if(!self.top.canPreview()) return;
			
			// Create Preview Data
			self.previewData = _clone(self.data);

			// Wiggle back & forth
			_timer = 0;
			_amplitude = 0;
			_ticker = setInterval(function(){
				if(!self.top.canPreview()) return _stopPreview();
				_timer += Math.TAU/_fps;
				_amplitude = Math.min(_amplitude+0.05, 2);
				self.previewData.value = self.data.value + Math.sin(_timer)*_amplitude;
				self.update();
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
		value:0
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
						self.top.activelyEditingActor = self;
					},
					onclose: function(){
						self.top.activelyEditingActor = null;
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
		var _initialV, _vel;
		self.dom.onmouseenter = function(){

			if(!self.top.canPreview()) return;
			
			// Create Preview Data
			_initialV = self.data.value[2];
			self.previewData = _clone(self.data);

			// Bounce up & down
			_vel = 0.05;
			_ticker = setInterval(function(){
				if(!self.top.canPreview()) return _stopPreview();
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
		self.dom = dom;
		
		// Save Button
		self.saveButton = new Joy.ui.Button({
			label: "save:",
			onclick: function(){
				var url = Joy.saveToURL(self.top.data);
				self.url.setValue(url);
				self.url.select();
			}
		});
		dom.appendChild(self.saveButton.dom);

		// Spacer
		dom.appendChild(_nbsp());
		dom.appendChild(_nbsp());

		// URL TextBox
		self.url = new Joy.ui.TextBox({
			readonly: true,
			width: "calc(100% - 100px)"
		});
		dom.appendChild(self.url.dom);

	}
});
































/****************

NUMBER WIDGET. Can switch out between scrubbable & variable!
(same config as scrubbable)

****************/
Joy.add({
	type: "number",
	tags: ["ui"],
	initWidget: function(self){

		var data = self.data;
		var o = self.options;

		// DOM:
		var dom = document.createElement("span");
		dom.className = "joy-number";
		self.dom = dom;

		// Replace Scrubber/Variable Widget!
		self.currentWidget = null;
		var _replace = function(widgetOptions, widgetData){
			/*
			var newWidget = new Widget(widgetOptions, widgetData, self);
			if(!self.currentWidget){
				dom.appendChild(newWidget.dom);
			}else{
				self.replaceWidget(self.currentWidget, newWidget);
			}*/
			var newActor = self.addChild(widgetOptions, widgetData);
			var newWidget = newActor.createWidget();
			dom.appendChild(newWidget);
			self.currentWidget = newWidget;
		};

		// Create Scrubber
		var _showScrubber = function(rawNumber){
			data.value = rawNumber;
			_replace({
				name:'value', type:'scrubber',
				min: o.min,
				max: o.max,
				step: o.step
			}, data);

			// HACK: Preview on hover!
			/*self.preview(self.currentWidget, function(data, previewData, t){
				previewData.value = data.value + t*3;
			});*/

		};

		// Create Variable
		var _showVariable = function(refID){
			data.value = {
				type: "variableName",
				refID: refID
			};
			_replace({
				name:'value', type:'variableName',
				variableType:'number',
				noChooser:true
			}, data.value);
		};

		// If it's a number, show raw. Otherwise it's a variable object.
		switch(typeof data.value){
			case "number":
				_showScrubber(data.value);
				break;
			case "object":
				_showVariable(data.value.refID);
				break;
		}

		// Moar Button
		var defaultNumber = o.placeholder;
		var moreButton = new Joy.ui.Button({
			onclick: function(){

				// Options
				var options = [];
				var topdata = self.top.data;

				// First option:
				if(self.currentWidget.type=="scrubber"){
					defaultNumber = self.currentWidget.data.value;
				}
				options.push({
					label: defaultNumber,
					value: {
						choiceType: "raw",
						choiceValue: defaultNumber
					}
				});

				// Get all references to numbers
				var refs = Joy.getReferencesByTag(topdata, "number");
				refs.forEach(function(ref){
					options.push({
						label: "["+ref.data.value+"]",
						value: {
							choiceType: "variable",
							choiceValue: ref.id
						}
					});
				});

				// Show all possible variables to link this to!
				Joy.modal.Chooser({
					source: self.dom,
					options: options,
					onchange: function(choice){
						switch(choice.choiceType){
							case "raw":
								_showScrubber(choice.choiceValue);
								break;
							case "variable":
								_showVariable(choice.choiceValue);
								break;
						}
						self.update(); // you oughta know!
					}
				});

			},
			styles: ["joy-more"]
		});
		dom.appendChild(moreButton.dom);

	},
	onget: function(my){
		switch(typeof my.data.value){
			case "number": // Number: just give it
				return my.data.value;
				break;
			case "object": // Variable: actually parse it on target!
				var vars = target._vars;
				var varname = Joy.get(topdata, data.value);
				return vars[varname];
				break;
		}
	},
	placeholder: {
		value: 3
	}
});

/****************

A choose-y thing

Widget Options:
{name:'direction', type:'choose', options:['left','right'], placeholder:'left'}

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
			}
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
	widget: function(self){

		var data = self.data;

		// String *IS* DOM
		var o = self.options;
		var string = new Joy.ui.String({
			prefix: o.prefix,
			suffix: o.suffix,
			color: o.color,
			value: data.value,
			onchange: function(value){
				self.lock(function(){
					data.value = value;
				});
				self.update(); // you oughta know!
			}
		});
		self.dom = string.dom;

		// When data's changed, externally
		self.onDataChange = function(data){
			string.setString(data.value);
		};

	},
	get: function(my){
		return my.data.value;
	},
	placeholder: "???"
});
