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

				// no variables?
				if(self.noVariables) return;

				// Force data to a chain...
				var originalValue = self.getData("value");
				if(typeof originalValue==="number"){
					self.setData("value",undefined,true); // delete "value", no update
					self.setData("chain",[
						{type:"number_raw", value:originalValue}
					],true); // create "chain", no update
				}

				// MAKE A NEW CHAIN ACTOR *AND DATA(?)*
				self._makeNewChainActor = function(chainItem, atIndex){

					// Make it
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
								],
								styles: ["joy-math"]
							}, chainItem);
							break;

					}

					// Add or splice to Chain Actors array! *AND THE DATA*
					var chain = self.getData("chain");
					if(atIndex!==undefined){
						self.chainActors.splice(atIndex, 0, chainActor);
						chain.splice(atIndex, 0, chainItem);
					}else{
						self.chainActors.push(chainActor);
						chain.push(chainItem);
					}

					// Return
					return chainActor;

				}

				// Create an actor for each element in the chain
				self.chainActors = []; // keep a chain parallel to children. this one's in ORDER.
				var realChain = self.getData("chain");
				var chain = _clone(realChain);
				realChain.splice(0, realChain.length); // empty out realChain
				for(var i=0; i<chain.length; i++){
					self._makeNewChainActor(chain[i]);
				}

				// REPLACE A CHAIN ACTOR *AND DATA*
				self._replaceChainActor = function(oldChainActor, newItem){

					// Delete old actor, and add new actor where it was
					var oldIndex = self._deleteChainActor(oldChainActor);
					var newChainActor = self._makeNewChainActor(newItem, oldIndex);

					// update manually!
					self.update();

					// Return
					return newChainActor;

				};

				// DELETE A CHAIN ACTOR *AND DATA*
				self._deleteChainActor = function(chainActor){

					// Delete actor
					var oldIndex = self.chainActors.indexOf(chainActor);
					_removeFromArray(self.chainActors, chainActor);
					self.removeChild(chainActor);

					// and data!
					var chain = self.getData("chain");
					chain.splice(oldIndex, 1);

 					// so can re-use index
					return oldIndex;

				};

			},
			initWidget: function(self){

				// no variables?
				if(self.noVariables){
					_old.initWidget(self);
					return;
				}

				// Container!
				self.dom = document.createElement("span");
				self.dom.className = "joy-number";

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
						var color = ref.data.color;
						color = _HSVToRGBString(color[0], color[1], color[2]);
						options.push({
							label: "["+ref.data.value+"]",
							value: {
								type: "variableName",
								refID: ref.id
							},
							color: color
						});
					});

					// Show all these dang options!
					if(options.length>0){
						Joy.modal.Chooser({
							source: chainActor.dom,
							options: options,
							onchange: function(newItem){
								// REPLACE CHAIN ACTOR & ENTRY
								var newChainActor = self._replaceChainActor(chainActor, newItem);
								self._replaceChainEntry(chainActor, newChainActor);
							}
						});
					}

				};

				// THE WAY TO ORGANIZE THIS: ENTRIES that have DOM *and* ACTOR
				self._chainEntries = [];

				// MAKE CHAIN ENTRY
				self._makeChainEntry = function(chainActor, atIndex){

					// Widget
					var widget = document.createElement("span");
					chainActor.createWidget();
					widget.appendChild(chainActor.dom);

					// Widget chooser, if NOT an operand
					if(chainActor.type!="choose"){
						var entry;
						var moreButton = new Joy.ui.Button({
							onclick: function(){
								_showChainOptions(entry);
							},
							styles: ["joy-more"]
						});
						widget.appendChild(moreButton.dom);
					}

					// Place in widget
					if(atIndex!==undefined){
						if(atIndex < self.dom.childNodes.length){
							// replacing NOT at last child...
							var beforeThisWidget = self.dom.childNodes[atIndex];
							self.dom.insertBefore(widget, beforeThisWidget);
						}else{
							// Otherwise just append
							self.dom.appendChild(widget);
						}
					}else{
						self.dom.appendChild(widget);
					}

					// If it's NOT an operand, clicking it reveals options
					if(chainActor.type!="choose"){
						(function(ca){
							// HACK: click, NOT scrub. detect w/ time frame
							var _mouseDownTime;
							ca.dom.addEventListener("mousedown", function(){
								_mouseDownTime = +(new Date());
							});
							ca.dom.addEventListener("mouseup", function(){
								var _time = +(new Date());
								if(_time-_mouseDownTime < 500){
									_showChooser(ca); // if clicked in less than a half second
								}
							});
						})(chainActor);
					}

					// Entry
					entry = {
						widget: widget,
						actor: chainActor
					};
					if(atIndex!==undefined){
						self._chainEntries.splice(atIndex, 0, entry);
					}else{
						self._chainEntries.push(entry);
					}

				};

				// DELETE CHAIN ENTRY
				self._deleteChainEntry = function(chainActor){

					// Get index (so can return later)
					var entry = self._chainEntries.find(function(entry){
						return entry.actor == chainActor;
					});
					var index = self._chainEntries.indexOf(entry);

					// Delete widget & entry (actor's already been deleted)
					var widget = entry.widget;
					self.dom.removeChild(widget);
					_removeFromArray(self._chainEntries, entry);

					// Index?
					return index;

				};

				// REPLACE CHAIN ENTRY
				self._replaceChainEntry = function(oldChainActor, newChainActor){
					var oldIndex = self._deleteChainEntry(oldChainActor);					
					self._makeChainEntry(newChainActor, oldIndex);
				};

				// SHOW CHAIN OPTIONS
				var _showChainOptions = function(entry){

					// Possible operands
					var currentLabel = entry.widget.innerText;
					var options = [
						{label:currentLabel+" + 2", value:"+"},
						{label:currentLabel+" - 2", value:"-"},
						{label:currentLabel+" &times; 2", value:"*"},
						{label:currentLabel+" &divide; 2", value:"/"}
					];

					// To delete... which operand?
					var elementIndex = self._chainEntries.indexOf(entry);
					if(self._chainEntries.length>1){ // can't delete if just one
						
						// The operand...
						var operandIndex;
						if(elementIndex==0) operandIndex=elementIndex+1; // first
						else operandIndex=elementIndex-1; // not

						// Label
						var label;
						var operandLabel = self._chainEntries[operandIndex].widget.innerText;
						if(elementIndex==0) label = currentLabel+" "+operandLabel; // first
						else label = operandLabel+" "+currentLabel; // not

						// Indices to delete
						var indicesToDelete = [elementIndex, operandIndex].sort(); // increasing order

						// Push option!
						options.push({
							category: "meta",
							label: '(delete “'+label+'”)',
							value: indicesToDelete
						});

					}

					// Choose options!
					Joy.modal.Chooser({
						source: entry.widget,
						options: options,
						onchange: function(operand){

							// It's an operand...
							if(typeof operand==="string"){

								// Get index of the actor...
								var index = self._chainEntries.indexOf(entry);

								// Make the OPERAND actor(+data) & entry
								index++;
								var operandActor = self._makeNewChainActor({type:"choose", value:operand}, index);
								self._makeChainEntry(operandActor, index);

								// Make the NUMBER actor(+data) & entry (just the number 2, why hot)
								index++;
								var numberActor = self._makeNewChainActor({type:"number_raw", value:2}, index);
								self._makeChainEntry(numberActor, index);

							}else{

								// Otherwise, DELETE ACTOR & ENTRY!
								var indices = operand;
								for(var i=indices.length-1; i>=0; i--){ // flip around coz DELETING
									var indexToDelete = indices[i];
									var actorToDelete = self._chainEntries[indexToDelete].actor;
									self._deleteChainActor(actorToDelete);
									self._deleteChainEntry(actorToDelete);
								}

							}

							// Update!
							self.update();

						}
					});

				};

				// For each chain actor, put in that entry
				for(var i=0; i<self.chainActors.length; i++){
					var chainActor = self.chainActors[i];
					self._makeChainEntry(chainActor);
				}

			},
			onget: function(my){

				// no variables?
				if(my.actor.noVariables){
					return _old.onget(my);
				}

				////////////////

				var nums_and_ops = []; // just gets chain of nums & ops

				// EVALUATE EACH ELEMENT FIRST
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

					// Any operator before it?
					if(i>0){
						var operandActor = my.actor.chainActors[i-1];
						var op = operandActor.get();
						nums_and_ops.push(op);
					}

					// Push num
					nums_and_ops.push(num);

				}

				// MULTIPLICATION AND DIVISION FIRST. LEFT-ASSOCIATIVE
				for(var i=1; i<nums_and_ops.length; i+=2){

					var op = nums_and_ops[i];
					if(op=="*" || op=="/"){

						// Do math to the two numbers
						var num1 = nums_and_ops[i-1];
						var num2 = nums_and_ops[i+1];
						var res;
						if(op=="*") res = num1*num2;
						else res = num1/num2;

						// Modify array, and set index back
						// remove 3 items: num1, op, num2
						// replace with 1 item: result
						nums_and_ops.splice(i-1, 3, res);
						i-=2;

					}else{
						continue;
					}

				}

				// NOW DO ADDITION AND SUBTRACTION
				for(var i=1; i<nums_and_ops.length; i+=2){

					var op = nums_and_ops[i];
					if(op=="+" || op=="-"){

						// Do math to the two numbers
						var num1 = nums_and_ops[i-1];
						var num2 = nums_and_ops[i+1];
						var res;
						if(op=="+") res = num1+num2;
						else res = num1-num2;

						// Modify array, and set index back
						// remove 3 items: num1, op, num2
						// replace with 1 item: result
						nums_and_ops.splice(i-1, 3, res);
						i-=2;

					}else{
						continue;
					}

				}

				return nums_and_ops[0];

			}
		};
	});

	/****************

	Set a variable to some number.

	****************/
	Joy.add({
		name: "Set [number]",
		type: "math/set",
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
	Joy.add({
	
		name: "Do math to [number]",
		type: "math/operation",
		tags: ["math", "action"],

		init: JSON.stringify({
			id:'operation', type:'choose',
			placeholder: "+",
			options:[
				{ label:"+ Increase", value:"+" },
				{ label:"- Decrease", value:"-" },
				{ label:"&times; Multiply", value:"*" },
				{ label:"&divide; Divide", value:"/" }
			]
		})+" {id:'varname', type:'variableName', variableType:'number', startWithExisting:true}"
		+" by {id:'value', type:'number'}",

		onact: function(my){

			var vars = my.target._variables;
			var varname = my.data.varname;
			if(vars[varname]===undefined) vars[varname]=0; // Set to 0, if nothing's there.

			switch(my.data.operation){
				case "+": vars[varname] += my.data.value; break;
				case "-": vars[varname] -= my.data.value; break;
				case "*": vars[varname] *= my.data.value; break;
				case "/": vars[varname] /= my.data.value; break;
			}

		}

	});

	/****************

	If then... for math

	****************/
	Joy.add({
		name: "If [math] then...",
		type: "math/if",
		tags: ["math", "action"],
		init: "If {id:'value1', type:'number'} "+
			  "{id:'test', type:'choose', options:['<','≤','=','≥','>'], placeholder:'='} "+
			  "{id:'value2', type:'number'}, then: "+
			  "{id:'actions', type:'actions', resetVariables:false}",
		onact: function(my){

			var value1 = my.data.value1;
			var value2 = my.data.value2;

			var result;
			switch(my.data.test){
				case '<': 
					result = value1<value2;
					break;
				case '≤': 
					result = value1<=value2;
					break;
				case '=': 
					result = value1==value2;
					break;
				case '≥': 
					result = value1>=value2;
					break;
				case '>':
					result = value1>value2;
					break;
			}

			if(result){
				var message = my.actor.actions.act(my.target);
				if(message=="STOP") return message; // STOP
			}

		}
	});

});
