////////////////////////////////////////////////////////
// THE BIG ACTOR: A "PROGRAMMABLE" LIST OF ACTIONS <3 //
////////////////////////////////////////////////////////

/****************

A nice list of actions.

WidgetConfig:
{type:'actions', name:'actions', resetVariables:false}

****************/
Joy.add({
	type: "actions",
	tags: ["ui"],
	init: function(self){

		// TODO: Separate out Actor code from Widget code
		// so that this can run EVEN WITHOUT WIDGETS.

	},
	initWidget: function(self){

		var data = self.data;
		var actions = data.actions;

		// DOM
		var dom = document.createElement("div");
		dom.className = "joy-actions";
		self.dom = dom;

		// List
		var list = document.createElement("list");
		list.id = "joy-list";
		dom.appendChild(list);

		//////////////////////////////////////////
		// Create Bullet /////////////////////////
		//////////////////////////////////////////

		var bulletOptions = [
			{label:"Add action above", value:"action_above"},
			{label:"Add action below", value:"action_below"},
			{label:"Delete", value:"delete"}
		];
		var _onBulletChoice = function(entry, choice){

			// ACTION ABOVE or BELOW
			var newActionWhere = 0;
			if(choice=="action_above") newActionWhere=-1; // above
			if(choice=="action_below") newActionWhere=1; // below
			if(newActionWhere!=0){ // not NOT new action
				
				var newEntryIndex = self.entries.indexOf(entry);
				if(newActionWhere>0) newEntryIndex+=1;

				// Chooser Modal!
				Joy.modal.Chooser({
					position: "left",
					source: entry.bullet.dom,
					options: actionOptions,
					onchange: function(value){
						_addAction(value, newEntryIndex);
						self.update(); // You oughta know!
						_updateBullets(); // update the UI, re-number it.
					}
				});

			}

			// DELETE
			if(choice=="delete"){
				_removeFromArray(self.entries, entry); // Delete entry from Entries[]
				_removeFromArray(actions, entry.actionData); // Delete action from Data's Actions[]
				self.removeChild(entry.actor); // Delete actor from Children[]
				list.removeChild(entry.dom); // Delete entry from DOM
				self.update(); // You oughta know!
				_updateBullets(); // update the UI, re-number it.
			}

		};
		var _createBullet = function(entry){
		
			var bullet = new Joy.ui.ChooserButton({
				position: "left",
				staticLabel: _getBulletLabel(entry),
				options: bulletOptions,
				onchange: function(choice){
					_onBulletChoice(entry, choice);
				},
				styles: ["joy-bullet"]
			});
			bullet.dom.id = "joy-bullet";

			return bullet;

		};

		// Get the digit (or letter, or roman) for this bullet...
		var _getBulletLabel = function(entry){

			// What index am I?
			var index = self.entries.indexOf(entry)+1;

			// How many levels deep in "actions" am I?
			var levelsDeep = 0;
			var parent = self.parent;
			while(parent){
				if(parent.type=="actions") levelsDeep++;
				parent = parent.parent;
			}

			// Digit, Letter, or Roman? (Cycle around)
			var label;
			switch(levelsDeep%3){
				case 0: label=index; break; // digits
				case 1: label=_numberToAlphabet(index); break; // letter
				case 2: label=_numberToRoman(index); break; // roman
			}

			return label;

		};

		// Re-number ALL these bad boys
		var _updateBullets = function(){
			for(var i=0; i<self.entries.length; i++){
				var entry = self.entries[i];
				var bullet = entry.bullet;
				var label = _getBulletLabel(entry);
				bullet.setLabel(label);
			}
		};

		////////////////////////////////////////////////////////////////////
		// Add Entry: Entries have a Bullet (the number) & actual widget! //
		////////////////////////////////////////////////////////////////////

		self.entries = [];
		var _addEntry = function(actionData, atIndex){

			// New entry
			var entry = {};
			var entryDOM = document.createElement("div");
			if(atIndex===undefined){
				self.entries.push(entry);
				list.appendChild(entryDOM);
			}else{
				self.entries.splice(atIndex, 0, entry);
				list.insertBefore(entryDOM, list.children[atIndex]);
			}

			// The Bullet is a Chooser!
			var bullet = _createBullet(entry);
			var bulletContainer = document.createElement("div");
			bulletContainer.id = "joy-bullet-container";
			entryDOM.appendChild(bulletContainer);
			bulletContainer.appendChild(bullet.dom);

			// New Actor!
			var newActor = self.addChild({type:actionData.type}, actionData);

			// The Widget
			var newWidget = newActor.createWidget();
			newWidget.id = "joy-widget";
			entryDOM.appendChild(newWidget);

			// (Remember all this)
			entry.dom = entryDOM;
			entry.bullet = bullet;
			entry.actor = newActor;
			entry.widget = newWidget;
			entry.actionData = actionData;

			// Preview on hover!
			self.preview(bulletContainer, function(data, previewData, previewMeta){
				
				// Previewed Action
				var actionIndex = self.entries.indexOf(entry);
				var previewAction = previewData.actions[actionIndex];
				//previewAction.PREVIEW_PARAM = previewMeta.param;

				// STOP after that action!
				previewData.actions.splice(actionIndex+1, 0, {STOP:true});

			});

			return entry;

		};
		// add all INITIAL actions as widgets
		for(var i=0;i<actions.length;i++) _addEntry(actions[i]);

		///////////////////////////////////////
		// Add Action /////////////////////////
		///////////////////////////////////////

		// Manually add New Action To Actions + Widgets + DOM
		var _addAction = function(actorType, atIndex){

			// Create that new entry & everything
			var newAction = {type:actorType};
			if(atIndex===undefined){
				actions.push(newAction);
			}else{
				actions.splice(atIndex, 0, newAction);
			}
			var entry = _addEntry(newAction, atIndex);

			// Focus on that entry's widget!
			// entry.widget.focus();

		};

		// Actions you can add:
		// TODO: INCLUDE ALIASED ACTIONS
		var actionOptions = [];
		var actionActors = Joy.getActorsByTag("action");
		for(var i=0;i<actionActors.length;i++){
			var actionActor = actionActors[i];
			var notActionTag = actionActor.tags.filter(function(tag){
				return tag!="action";
			})[0];
			actionOptions.push({
				label: actionActor.name,
				value: actionActors[i].type,
				category: notActionTag
			});
		}

		// "+" Button: When clicked, prompt what actions to add!
		var addButton = new Joy.ui.ChooserButton({
			staticLabel: "+",
			options: actionOptions,
			onchange: function(value){
				_addAction(value);
				self.update(); // You oughta know!
			},
			styles: ["joy-bullet"]
		});
		dom.appendChild(addButton.dom);

	},
	onact: function(my){

		// Create _vars, if not already there // TODO: scope?
		if(!my.target._vars) my.target._vars={}; 

		// Reset all of target's variables?
		if(my.data.resetVariables) my.target._vars = {};

		// Do those actions, baby!!!
		for(var i=0; i<my.data.actions.length; i++){

			// Stop?
			var actionData = my.data.actions[i];
			if(actionData.STOP) return "STOP";

			// Run 
			var actor = my.actor.entries[i].actor;
			var actorMessage = actor.act(my.target, actionData); // use ol' actor, but GIVEN data.
			if(actorMessage=="STOP") return actorMessage;

		}

	},
	placeholder: {
		actions: [],
		resetVariables: true
	}
});
