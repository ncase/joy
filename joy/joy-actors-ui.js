/////////////////////////////////////////
// FUNDAMENTAL USER INTERACE ACTORS /////
/////////////////////////////////////////

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
				prop:'value', type:'scrubber',
				min: o.min,
				max: o.max,
				step: o.step
			}, data);

			// HACK: Preview on hover!
			self.preview(self.currentWidget, function(data, previewData, t){
				previewData.value = data.value + t*5;
			});

		};

		// Create Variable
		var _showVariable = function(refID){
			data.value = {
				type: "variableName",
				refID: refID
			};
			_replace({
				prop:'value', type:'variableName',
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
		var moreButton = new ui.Button({
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
				modal.Chooser({
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
						self.trigger("change"); // you oughta know!
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

Raw number widget: JUST the scrubber, no chooser

Widget Options:
{prop:'steps', type:'number', placeholder:10, min:0, max:180, step:1}

****************/
Joy.add({
	type: "scrubber",
	tags: ["ui"],
	initWidget: function(self){

		var data = self.data;

		/* Scrubber *IS* DOM */
		var o = self.options;
		var scrubber = new ui.Scrubber({
			min: o.min,
			max: o.max,
			step: o.step,
			value: data.value,
			onchange: function(value){
				data.value = value;
				self.trigger("change"); // you oughta know!
			}
		});
		self.dom = scrubber.dom;

	}
});

/****************

A choose-y thing

Widget Options:
{prop:'direction', type:'choose', options:['left','right'], placeholder:'left'}

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
		var chooserButton = new ui.ChooserButton({
			value: data.value,
			options: options,
			onchange: function(value){
				data.value = value;
				self.trigger("change"); // you oughta know!
			}
		});
		self.dom = chooserButton.dom;

	},
	onget: function(my){
		return my.data.value;
	}
});


/****************

A color widget! (for now, same as choose except paints DOM, too)

Widget Options:
{prop:'direction', type:'choose', options:['left','right'], placeholder:'left'}

****************/

Joy.add({
	type: "color",
	tags: ["ui"],
	initWidget: function(self){

		var data = self.data;
		self.dom = document.createElement("span");

		// COLOR BUTTON
		var colorButton = new ui.Button({
			label: "&nbsp;",
			onclick: function(){

				self.isCurrentlyEditing = true;
				modal.Color({
					source: self.dom,
					value: data.value,
					onchange: function(value){
						// TODO: precision for those floats, y'know
						data.value = value;
						_changeLabelColor();
						self.trigger("change", data.value); // you oughta know!
					},
					onclose: function(){
						self.isCurrentlyEditing = false;
					}
				});
				
			},
			styles:["joy-color"]
		});
		self.dom.appendChild(colorButton.dom);

		// Change button color!
		var _changeLabelColor = function(){
			colorButton.dom.style.background = _HSVToRGBString(data.value);
			colorButton.dom.style.borderColor = "rgba(0,0,0,0.1)";
		};
		_changeLabelColor();

		// Preview on hover!
		self.preview(self.dom, function(data, previewData, t){
			// TODO: better wiggling of color
			var v = data.value[2]; // "value", lightness.
			v = v + t*0.5;
			if(v>1) v=1;
			if(v<0) v=0;
			previewData.value[2] = v;
		});

	},
	onget: function(my){
		return _HSVToRGBString(my.data.value);
	},
	placeholder: function(){
		var hue = Math.floor(Math.random()*360);
		return [hue, 0.8, 1.0];
	}
});


/****************

A widget to save data as hash!

Widget Options:
{type:'save'} // NO "data"! It just saves the top-most data.

****************/

Joy.add({
	type: "save",
	tags: ["ui"],
	initWidget: function(self){

		// DOM
		var dom = document.createElement("div");
		self.dom = dom;
		
		// Save Button
		self.saveButton = new ui.Button({
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
		self.url = new ui.TextBox({
			readonly: true,
			width: "calc(100% - 100px)"
		});
		dom.appendChild(self.url.dom);

	}
});


/****************

A widget to type in strings!

Widget Options:
{prop:'name', type:'string', prefix:'&ldquo;', suffix:'&rdquo;', color:"whatever"}

****************/
Joy.add({
	type: "string",
	tags: ["ui"],
	widget: function(self){

		var data = self.data;

		// String *IS* DOM
		var o = self.options;
		var string = new ui.String({
			prefix: o.prefix,
			suffix: o.suffix,
			color: o.color,
			value: data.value,
			onchange: function(value){
				self.lock(function(){
					data.value = value;
				});
				self.trigger("change"); // you oughta know!
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
