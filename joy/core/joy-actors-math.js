/////////////////////////////////////////
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

				// Force data to a chain...
				var originalValue = self.getData("value");
				if(typeof originalValue==="number"){
					self.setData("value",undefined,true); // delete "value", no update
					self.setData("chain",[
						{type:"number_raw", value:originalValue},
						{type:"choose", value:"+"}, // TEST!
						{type:"number_raw", value:2} // TEST!
					],true); // create "chain", no update
				}

				// MAKE A NEW CHAIN ACTOR
				self._makeNewChainActor = function(chainItem){
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
								]
							}, chainItem);
							break;

					}
					return chainActor;
				}

				// Create an actor for each element in the chain
				self.chainActors = []; // keep a chain parallel to children. this one's in ORDER.
				var chain = self.getData("chain");
				for(var i=0; i<chain.length; i++){
					var chainActor = self._makeNewChainActor(chain[i]);
					self.chainActors.push(chainActor);
				}

				// REPLACE A CHAIN ACTOR *AND DATA*
				self._replaceChainActor = function(oldChainActor, newChainActor){

					// Get index of old actor & replace actor
					var oldIndex = self.chainActors.indexOf(oldChainActor);
					_replaceInArray(self.chainActors, oldChainActor, newChainActor);
					
					// now, replace THE DATA in the chain!
					var chain = self.getData("chain");
					chain[oldIndex] = newChainActor.data;

					// update manually!
					self.update();

				};

			},
			initWidget: function(self){

				// Container!
				self.dom = document.createElement("span");

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
						options.push({
							label: "["+ref.data.value+"]",
							value: {
								type: "variableName",
								refID: ref.id
							}
						});
					});

					// Show all these dang options!
					Joy.modal.Chooser({
						source: chainActor.dom,
						options: options,
						onchange: function(newValue){

							console.log(newValue);
							
							// MAKE NEW CHAIN ACTOR.
							var newChainActor = self._makeNewChainActor(newValue);

							// REPLACE CHAIN ACTOR
							self._replaceChainActor(chainActor, newChainActor);

							// MAKE NEW CHAIN WIDGET
							self._makeChainWidget(newChainActor);

							// REPLACE CHAIN WIDGET
							self._replaceChainWidget(chainActor, newChainActor);

						}
					});

				};

				// Chain DOMs
				var chainDOMs = [];

				// CREATE CHAIN WIDGET
				self._makeChainWidget = function(chainActor){
					chainActor.createWidget();
				};

				// REPLACE CHAIN WIDGET
				self._replaceChainWidget = function(oldChainActor, newChainActor){
					oldChainActor.dom.parentNode.replaceChild(newChainActor.dom, oldChainActor.dom);
				};

				// For each chain actor, put in that widget
				for(var i=0; i<self.chainActors.length; i++){
					
					// Put in the chain actor!
					var chainActor = self.chainActors[i];
					self._makeChainWidget(chainActor);
					if(i>0) self.dom.appendChild(_nbsp()); // space 'em
					self.dom.appendChild(chainActor.dom);

					// Also, if it's an element, clicking it reveals options
					if(i%2==0){
						(function(ca){
							ca.dom.onclick = function(){
								_showChooser(ca);
							};
						})(chainActor);
					}

				}

			},
			onget: function(my){
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
		type: "math/set",
		name: "Set [thing] to [number]",
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
