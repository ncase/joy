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

		if(self.resetVariables!==undefined) self.data.resetVariables=self.resetVariables;

		// TODO: ACTUALLY REFACTOR
		// TODO: Separate out Actor code from Widget code
		// so that this can run EVEN WITHOUT WIDGETS.
		// Using messages, probably.

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

			// PREVIEW ON HOVER
			// Also tell the action "_PREVIEW": how far in the action to go?
			var _calculatePreviewParam = function(event){
				var param = event.offsetY / bullet.dom.getBoundingClientRect().height;
				if(param<0) param=0;
				if(param>1) param=1;
				_previewAction._PREVIEW = param;
				self.update();
			};
			var _previewAction;
			bulletContainer.onmouseenter = function(event){

				if(!self.top.canPreview()) return;
				
				// Create Preview Data
				self.previewData = _clone(self.data);
				var actionIndex = self.entries.indexOf(entry);
				_previewAction = self.previewData.actions[actionIndex];

				// STOP after that action!
				self.previewData.actions.splice(actionIndex+1, 0, {STOP:true});

				// How far to go along action?
				_calculatePreviewParam(event);

			};
			bulletContainer.onmousemove = function(event){
				if(self.previewData) _calculatePreviewParam(event);
			};
			bulletContainer.onmouseleave = function(){
				self.previewData = null;
				self.update();
			};

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
		if(self.onlyActions){
			for(var i=0;i<self.onlyActions.length;i++){
				var actionType = self.onlyActions[i];
				var actorTemplate = Joy.getTemplateByType(actionType);
				var notActionTag = actorTemplate.tags.filter(function(tag){
					return tag!="action"; // first tag that's NOT "action"
				})[0];
				actionOptions.push({
					label: actorTemplate.name,
					value: actionType,
					category: notActionTag
				});
			}
		}else{
			var actionActors = Joy.getTemplatesByTag("action");
			for(var i=0;i<actionActors.length;i++){
				var actionActor = actionActors[i];
				var notActionTag = actionActor.tags.filter(function(tag){
					return tag!="action";
				})[0];
				actionOptions.push({
					label: actionActor.name,
					value: actionActor.type,
					category: notActionTag
				});
			}
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

		// Create _vars, if not already there
		if(!my.target._variables) my.target._variables={}; 

		// Reset all of target's variables?
		if(my.data.resetVariables) my.target._variables = {};

		// Do those actions, baby!!!
		for(var i=0; i<my.data.actions.length; i++){

			// Stop?
			var actionData = my.data.actions[i];
			if(actionData.STOP) return "STOP";

			// Run 
			var actor = my.actor.entries[i].actor; // TODO: THIS IS A HACK AND SHOULD NOT RELY ON THAT
			var actorMessage = actor.act(my.target, actionData); // use ol' actor, but GIVEN data.
			if(actorMessage=="STOP") return actorMessage;

		}

	},
	placeholder: {
		actions: [],
		resetVariables: true
	}
});
