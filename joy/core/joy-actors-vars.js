// VARIABLE NAME: you're just a synchronized string, yo.
Joy.add({
	type: "variableName",
	tags: ["ui"],
	init: function(self){

		var variableType = self.variableType;

		// Unique Variable Name
		var _uniqueVariableName = function(){
			var varnames = Joy.getReferencesByTag(self, variableType).map(function(ref){
				return ref.data.value;
			});
			var highestCount=0;
			varnames.forEach(function(varname){
				var num;
				if(varname=="thing") num=1; // at least 1
				var match = varname.match(/thing\s(\d+)/);
				if(match) num = parseInt(match[1]); // or more
				if(highestCount<num) highestCount=num;
			});
			if(highestCount==0) return "thing";
			else return "thing "+(highestCount+1);
		};

		// Create Reference method
		self._createNewReference = function(){
			var refData = {
				value: _uniqueVariableName(),
				color: _randomHSV()
			};
			var ref = Joy.createReference(self, variableType, refData);
			self.setData("refID", ref.id, true); // Remember Ref ID. And DON'T update.
			Joy.connectReference(self, ref.id); // connect new ref
		};

		// Do I already have a reference? Create one if no.
		var refID = self.getData("refID");
		if(refID){
			Joy.connectReference(self, refID); // connect this ref
		}else{
			// TODO: OR... Try attaching to some latest variable of same type?
			self._createNewReference();
		}

		// Switch reference 
		self._switchReference = function(newRefID){
			var refID = self.getData("refID");
			Joy.disconnectReference(self, refID); // disconnect old ref
			self.setData("refID", newRefID); // DO update this!
			Joy.connectReference(self, newRefID); // connect new ref
		};

	},
	initWidget: function(self){

		self.dom = document.createElement("span");
		
		// The String edits my REFERENCE'S data.
		var refID = self.getData("refID");
		var refData = Joy.getReferenceById(self, refID).data;
		var stringActor = self.addChild({
			type: "string",
			prefix:"[", suffix:"]",
			color: refData.color
		}, refData);
		var stringWidget = stringActor.createWidget();
		self.dom.appendChild(stringWidget);

		// This String Actor also updates its color
		var _old_stringActor_onDataChange = stringActor.onDataChange;
		stringActor.onDataChange = function(){
			_old_stringActor_onDataChange();
			var color = stringActor.getData("color");
			stringActor.stringUI.setColor(color);
		};

		// Chooser? Can choose to switch to other variables (or make new one)
		var variableType = self.variableType;
		var _showChooser = function(){

			var options = [];

			// Get all references that are of this type
			var refs = Joy.getReferencesByTag(self, variableType);
			var myRefID = self.getData("refID");
			refs.forEach(function(ref){
				if(ref.id==myRefID) return; // don't show SELF
				options.push({
					label: "["+ref.data.value+"]",
					value: ref.id
				});
			});

			// Meta Options:
			options.push({
				category: "meta",
				label: "(+new)",
				value: "NEW"
			});
			options.push({
				category: "meta",
				label: "(change color)",
				value: "CHANGE_COLOR"
			});

			// Show all possible variables!
			Joy.modal.Chooser({
				source: self.dom,
				options: options,
				onchange: function(newRefID){

					if(newRefID=="CHANGE_COLOR"){

						// Just change color, ha.
						Joy.modal.Color({
							source: self.dom,
							value: stringActor.getData("color"),
							onchange: function(newColor){
								stringActor.setData("color", newColor);
								stringActor.stringUI.setColor(newColor); // do this again coz edit lock
							}
						});

					}else{

						// Make a new reference? Either way, set refID
						if(newRefID=="NEW"){
							var oldRefID = self.getData("refID");
							Joy.disconnectReference(self, oldRefID); // disconnect old ref
							self._createNewReference();
						}else{
							self._switchReference(newRefID);
						}

						// Make String Widget edit that instead
						var refID = self.getData("refID");
						var ref = Joy.getReferenceById(self, refID);
						stringActor.switchData(ref.data);

					}

				}
			});

		};

		// Show ON CLICK!
		if(!self.noChooser){
			self.dom.onclick = _showChooser;
		}
		
	},
	onget: function(my){
		var refID = my.data.refID;
		var ref = Joy.getReferenceById(my.actor, refID);
		return ref.data.value; // returns the variable name
	},
	onkill: function(self){
		
		// Disconnect any references I may have
		var refID = self.getData("refID");
		Joy.disconnectReference(self, refID); // disconnect old ref

	}
});