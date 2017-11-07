/////////////////////////////////////////
// LOGIC ACTORS /////////////////////////
/////////////////////////////////////////

Joy.module("instructions", function(){

	Joy.add({
		name: "Repeat the following...",
		type: "instructions/repeat",
		tags: ["instructions", "action"],
		init: "Repeat the following {id:'count', type:'number', min:1, placeholder:3} times: "+
			  "{id:'actions', type:'actions', resetVariables:false}",
		onact: function(my){
			
			// Previewing? How much to preview?
			var param = 1;
			if(my.data._PREVIEW!==undefined) param=my.data._PREVIEW;

			// Loop through it... (as far as preview shows, anyway)
			var loops = Math.floor(my.data.count*param);
			for(var i=0; i<loops; i++){
				var message = my.actor.actions.act(my.target);
				if(message=="STOP") return message; // STOP
			}

		}
	});

	Joy.add({
		name: "// Comment",
		type: "instructions/comment",
		tags: ["instructions", "action"],
		initWidget: function(self){

			// DOM
			self.dom = document.createElement("div");

			// Comment Box
			self.box = new Joy.ui.TextBox({
				multiline: true,
				placeholder: "// your notes here",
				value: self.getData("value"),
				onchange: function(value){
					self.setData("value", value);
				},
				styles: ["box"]
			});
			self.dom.appendChild(self.box.dom);

		}
	});

});
