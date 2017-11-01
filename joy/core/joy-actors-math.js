/////////////////////////////////////////
// MATH ACTORS //////////////////////////
/////////////////////////////////////////

Joy.module("math", function(){

	Joy.mod("number", function(_old){
		return {
			initWidget: function(self){
				var container = document.createElement("span");
				container.innerHTML = "AHHH";
				_old.initWidget(self);
				container.appendChild(self.dom);
				self.dom = container;
			}
		};
	});

});

/****************

NUMBER WIDGET. Can switch out between scrubbable & variable!
(same config as scrubbable)

****************/
/*
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
			/
			var newWidget = new Widget(widgetOptions, widgetData, self);
			if(!self.currentWidget){
				dom.appendChild(newWidget.dom);
			}else{
				self.replaceWidget(self.currentWidget, newWidget);
			}
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
			});/

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

Joy.add({
	name: "Set [thing] to [number]",
	type: "math/var",
	tags: ["numbers", "action"],
	widget: "Set {data:'varname', type:'variableName', variableType:'number'} to {data:'value', type:'number'}",
	act: function(topdata, data, target){
		var vars = target._vars;
		var varname = data.varname; // it's just a synchronized string
		vars[varname] = data.value; // Set the variable
	}
});

Joy.add({
	
	name: "Do math to [thing]",
	type: "math/var/op",
	tags: ["numbers", "action"],

	widget: JSON.stringify({
		data:'operation', type:'choose',
		placeholder: "+",
		options:[
			{ label:"+ Increase", value:"+" },
			{ label:"- Decrease", value:"-" },
			{ label:"&times; Multiply", value:"*" },
			{ label:"&divide; Divide", value:"/" }
		]
	})+" {data:'varname', type:'variableName', variableType:'number'}"
	+" by {data:'value', type:'number'}",

	act: function(topdata, data, target){

		var vars = target._vars;
		var varname = data.varname;
		if(vars[varname]===undefined) vars[varname]=0; // Set to 0, if nothing's there.

		switch(data.operation){
			case "+": vars[varname] += data.value; break;
			case "-": vars[varname] -= data.value; break;
			case "*": vars[varname] *= data.value; break;
			case "/": vars[varname] /= data.value; break;
		}

	}

});
*/

/****************

Variable Names:
THEY'RE JUST SYNC'D STRINGS w/ A CHOOSER, MAYBE.

WidgetConfig:
{data:'varname', type:'variableName', variableType:'number', noChooser:true}


Joy.add({
	type: "variableName",
	tags: ["ui"],
	widget: function(self){

		var data = self.data;
		var widgetConfig = self.widgetConfig;

		// Config
		var variableType = widgetConfig.variableType;

		// DOM
		self.dom = document.createElement("span");

		// Creates a reference if there already isn't one
		var topdata = self.top.data;
		if(!data.refID){
			_createNewReference();
		}
		function _createNewReference(){
			var referenceTags = ["variable", variableType];
			var referenceData = {
				value: _uniqueVariableName(),
				color: _randomColor()
			};
			var reference = Joy.createReference(topdata, referenceTags, referenceData); // Create it!
			data.refID = reference.id;
		}

		// Watching & unwatching references!
		self.reference = null;
		function _updateReference(kill){

			// If it's already the same, forget it
			if(!kill & self.reference && self.reference.id==data.refID) return;

			// Unwatch old
			if(self.reference) Joy.unwatchReference(topdata, self.reference.id);

			// Watch new!
			if(!kill) self.reference = Joy.watchReference(topdata, data.refID);

		}
		_updateReference();
		self.onkill = function(){
			_updateReference("kill");
		};

		// Create a string widget
		self.stringWidget = null;
		function _createStringWidget(){

			// Create new String Widget
			var stringData = self.reference.data;
			var newStringWidget = self.createWidget({
				type: "string",
				prefix: "[",
				suffix: "]",
				color: stringData.color
			}, stringData);

			// If there's an old string widget...
			if(self.stringWidget){
				self.replaceWidget(self.stringWidget, newStringWidget); // replace it!
			}else{
				self.dom.appendChild(newStringWidget.dom); // just add it!
			}
			self.stringWidget = newStringWidget;

		}
		_createStringWidget();

		// Create a chooser: selecting it switches your refID to that one
		// TODO: go from switched TO a new ID?
		if(!widgetConfig.noChooser){
			var moreButton = new Joy.ui.Button({
				onclick: function(){
					_showVariableChooser();
				},
				styles: ["joy-more"]
			});
			self.dom.appendChild(moreButton.dom);
		}

		///////////////////////////////////////////
		// HELPER: Create a unique variable name //
		///////////////////////////////////////////

		function _uniqueVariableName(){
			var references = Joy.getReferencesByTag(topdata, variableType);
			var varnames = references.map(function(reference){
				return reference.data.value;
			});
			var highestCount=0;
			for(var i=0; i<varnames.length; i++){

				var num;
				var varname = varnames[i];
				
				if(varname=="thing") num=1; // at least 1
				
				var match = varname.match(/thing\s(\d+)/);
				if(match) num = parseInt(match[1]); // or more
					
				if(highestCount<num) highestCount=num;

			}
			if(highestCount==0){
				return "thing";
			}else{
				return "thing "+(highestCount+1);
			}
		}

		function _showVariableChooser(){

			// First option is a "+new"
			var options = [];
			options.push({
				label: "+new",
				value: "NEW"
			});

			// Get all references that are of this type
			var refs = Joy.getReferencesByTag(topdata, variableType);
			for(var i=0;i<refs.length;i++){
				var ref = refs[i];
				if(ref.id==self.reference.id) continue; // don't show SELF
				options.push({
					label: "["+ref.data.value+"]",
					value: ref.id
				});
			}

			// Show all possible variables to link this to!
			Joy.modal.Chooser({
				source: self.dom,
				options: options,
				onchange: function(newRefID){

					// Make a new reference?
					if(newRefID=="NEW"){
						_createNewReference();
					}else{
						data.refID = newRefID;
					}

					_updateReference(); // change the reference!
					_createStringWidget(); // new string widget!
					self.update(); // you oughta know!

				}
			});

		}

	},
	get: function(topdata, data, target){
		var reference = Joy.getReferenceById(topdata, data.refID);
		return reference.data.value;
	}
});
****************/