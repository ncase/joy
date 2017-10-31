/////////////////////////////////////////
// LOGIC ACTORS /////////////////////////
/////////////////////////////////////////

Joy.add({
	name: "Repeat the following...",
	type: "logic/repeat",
	tags: ["logic", "action"],
	init: "Repeat the following {id:'count', type:'scrubber', min:1, placeholder:3} times: "+
			"{id:'actions', type:'actions', resetVariables:false}",
	onact: function(my){
		//var param = my.data.PREVIEW_PARAM ? Math.min(my.data.PREVIEW_PARAM/100, 1) : 1;
		//for(var i=0; i<my.data.count*param; i++){
		for(var i=0; i<my.data.count; i++){
			var message = my.actor.actions.act(my.target);
			if(message=="STOP") return message;
		}
	}
});












Joy.add({
	name: "// Note",
	type: "logic/comment",
	tags: ["logic", "action"],
	widget: function(self){

		var data = self.data;
		data.value = data.value || "";

		// DOM
		var dom = document.createElement("div");
		self.dom = dom;

		// Comment Box
		self.box = new Joy.ui.TextBox({
			multiline: true,
			placeholder: "// your notes here",
			value: data.value,
			onchange: function(value){
				data.value = value;
				self.update();
			},
			styles: ["box"]
		});
		dom.appendChild(self.box.dom);

	},
	act: function(topdata, data, target){
		// doesn't actually do anything. it's a comment.
	}
});

/****************

Variable Names:
THEY'RE JUST SYNC'D STRINGS w/ A CHOOSER, MAYBE.

WidgetConfig:
{data:'varname', type:'variableName', variableType:'number', noChooser:true}

****************/
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