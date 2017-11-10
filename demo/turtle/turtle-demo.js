var DEMOS = {
	star: {"frameX":152,"frameY":378,"turtleInstructions":{"actions":[{"type":"instructions/comment","value":"Welcome to The Joy of Turtle! You can hover over (1) (2) (3) etc... to see me draw something step-by-step. Or, you can change my instructions, colors, numbers, and see the result INSTANTLY. Have fun!"},{"type":"turtle/color","color":{"value":[49,0.99,1],"type":"color"}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":18}]}},{"type":"instructions/repeat","count":{"type":"number","chain":[{"type":"number_raw","value":5}]},"actions":{"actions":[{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"number_raw","value":300}]}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":144}]}}],"resetVariables":false,"type":"actions"}}],"resetVariables":true,"type":"actions"},"_references":{}},
	spiral: {"frameX":231,"frameY":299,"turtleInstructions":{"actions":[{"type":"turtle/color","color":{"value":[205,0.59,1],"type":"color"}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":30}]}},{"type":"instructions/comment","value":"What this does, basically, is make me go in a triangle... but every time I draw a side, I draw it slightly bigger than the last one. Result: a triangular spiral!"},{"type":"math/set","varname":{"type":"variableName","refID":"id0"},"value":{"type":"number","chain":[{"type":"number_raw","value":20}]}},{"type":"instructions/repeat","count":{"type":"number","chain":[{"type":"number_raw","value":23}]},"actions":{"actions":[{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"variableName","refID":"id0"}]}},{"type":"instructions/comment","value":"Changing this number below is pretty fun ;) Can you make a square spiral? Or a pentagonal spiral?"},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":120}]}},{"type":"math/operation","operation":{"value":"+","type":"choose"},"varname":{"type":"variableName","refID":"id0"},"value":{"type":"number","chain":[{"type":"number_raw","value":20}]}}],"resetVariables":false,"type":"actions"}}],"resetVariables":true,"type":"actions"},"_references":{"id0":{"id":"id0","tags":["number"],"data":{"value":"side size","color":[202,0.83,1]},"connected":3}}},
	spiral2: {"frameX":255,"frameY":256,"turtleInstructions":{"actions":[{"type":"instructions/comment","value":"Same idea as the triangular spiral, except this time with a really small turning angle and really small side size, I can make a CIRCULAR spiral!"},{"type":"turtle/color","color":{"value":[9,0.81,1],"type":"color"}},{"type":"math/set","varname":{"type":"variableName","refID":"id0"},"value":{"type":"number","chain":[{"type":"number_raw","value":0}]}},{"type":"instructions/repeat","count":{"type":"number","chain":[{"type":"number_raw","value":520}]},"actions":{"actions":[{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"variableName","refID":"id0"}]}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":5.1}]}},{"type":"math/operation","operation":{"value":"+","type":"choose"},"varname":{"type":"variableName","refID":"id0"},"value":{"type":"number","chain":[{"type":"number_raw","value":0.04}]}},{"type":"instructions/comment","value":"Putting my brush up/down to create a cool dashed-line pattern:"},{"type":"turtle/pen","pen":{"value":-1,"type":"choose"}}],"resetVariables":false,"type":"actions"}}],"resetVariables":true,"type":"actions"},"_references":{"id0":{"id":"id0","tags":["number"],"data":{"value":"side size","color":[13,0.92,1]},"connected":3}}},
	flower: {"turtleInstructions":{"actions":[{"type":"instructions/comment","value":"Draw the flower stem:"},{"type":"turtle/color","color":{"value":[79,0.77,0.94],"type":"color"}},{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"number_raw","value":243}]}},{"type":"instructions/comment","value":"Draw the flower head:"},{"type":"turtle/color","color":{"value":[50,0.92,1],"type":"color"}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":-90}]}},{"type":"instructions/repeat","count":{"type":"number","chain":[{"type":"number_raw","value":360}]},"actions":{"actions":[{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"number_raw","value":1}]}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":1}]}}],"resetVariables":false,"type":"actions"}},{"type":"instructions/comment","value":"Draw the flower petals:"},{"type":"turtle/color","color":{"value":[23,0.97,1],"type":"color"}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":-90}]}},{"type":"instructions/repeat","count":{"type":"number","chain":[{"type":"number_raw","value":9}]},"actions":{"actions":[{"type":"instructions/repeat","count":{"type":"number","chain":[{"type":"number_raw","value":105}]},"actions":{"actions":[{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"number_raw","value":2.2}]}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":2.5}]}}],"resetVariables":false,"type":"actions"}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":-182.5}]}}],"resetVariables":false,"type":"actions"}}],"resetVariables":true,"type":"actions"},"_references":{},"frameX":250,"frameY":469},
	flower2: {"turtleInstructions":{"actions":[{"type":"instructions/comment","value":"Draw the flower stem:"},{"type":"turtle/color","color":{"value":[79,0.77,0.94],"type":"color"}},{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"number_raw","value":200}]}},{"type":"instructions/comment","value":"Draw the flower head:"},{"type":"turtle/color","color":{"value":[50,0.92,1],"type":"color"}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":-90}]}},{"type":"instructions/repeat","count":{"type":"number","chain":[{"type":"number_raw","value":180}]},"actions":{"actions":[{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"number_raw","value":2}]}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":2}]}}],"resetVariables":false,"type":"actions"}},{"type":"instructions/comment","value":"Draw the flower petals:"},{"type":"turtle/color","color":{"value":[23,0.97,1],"type":"color"}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":-90}]}},{"type":"instructions/repeat","count":{"type":"number","chain":[{"type":"number_raw","value":9}]},"actions":{"actions":[{"type":"instructions/repeat","count":{"type":"number","chain":[{"type":"number_raw","value":105}]},"actions":{"actions":[{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"number_raw","value":2.2}]}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":2.5}]}}],"resetVariables":false,"type":"actions"}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":-182.5}]}}],"resetVariables":false,"type":"actions"}},{"type":"instructions/comment","value":"Draw the flower's FACE:"},{"type":"turtle/color","color":{"value":[44,0.89,0.75],"type":"color"}},{"type":"turtle/pen","pen":{"value":0,"type":"choose"}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":155}]}},{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"number_raw","value":72}]}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":25}]}},{"type":"turtle/pen","pen":{"value":1,"type":"choose"}},{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"number_raw","value":20}]}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":90}]}},{"type":"turtle/pen","pen":{"value":0,"type":"choose"}},{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"number_raw","value":59}]}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":90}]}},{"type":"turtle/pen","pen":{"value":1,"type":"choose"}},{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"number_raw","value":20}]}},{"type":"turtle/pen","pen":{"value":0,"type":"choose"}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":-45}]}},{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"number_raw","value":15}]}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":135}]}},{"type":"turtle/pen","pen":{"value":1,"type":"choose"}},{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"number_raw","value":80}]}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":-90}]}},{"type":"instructions/repeat","count":{"type":"number","chain":[{"type":"number_raw","value":90}]},"actions":{"actions":[{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"number_raw","value":1.4}]}},{"type":"turtle/turn","angle":{"type":"number","chain":[{"type":"number_raw","value":-2}]}}],"resetVariables":false,"type":"actions"}},{"type":"instructions/comment","value":"And finally, move me off-screen, so as not to obscure the flower's radiant beauty"},{"type":"turtle/pen","pen":{"value":0,"type":"choose"}},{"type":"turtle/forward","steps":{"type":"number","chain":[{"type":"number_raw","value":300}]}}],"resetVariables":true,"type":"actions"},"_references":{},"frameX":242,"frameY":447},
	blank: {} 
}

window.onload = function(){

	// Data
	var model = _getParameterByName("drawing");
	var data = model ? DEMOS[model] : Joy.loadFromURL();

	// Init
	window.turtle = new Turtle({
		width:500, height:500,
		data:data
	});
	document.querySelector("#player").appendChild(turtle.canvas);

	// Joy
	window.joy = Joy({
		
		init: "I'm a turtle! Do the following: {id:'turtleInstructions', type:'actions'} <hr> {type:'save'}",

		data: data,
		allowPreview: true,
		container: "#editor",
		modules: ["turtle", "instructions", "math"],

		onupdate: function(my){
			turtle.start();
			my.turtleInstructions.act(turtle);
			turtle.draw();
		}

	});
	turtle.ondrag = function(){
		joy.update();
	};

};

///////////////////////////////////////////////////////
///////////////////////////////////////////////////////

Joy.module("turtle", function(){

	Joy.add({
		name: "Move turtle",
		type: "turtle/forward",
		tags: ["turtle", "action"],
		init: "Move forward {id:'steps', type:'number', min:0, placeholder:50} steps",
		onact: function(my){

			// Previewing? How much to preview?
			var param = 1;
			if(my.data._PREVIEW!==undefined) param=my.data._PREVIEW;

			// Do it!
			my.target.forward(my.data.steps*param);

		}
	});

	Joy.add({
		name: "Turn turtle",
		type: "turtle/turn",
		tags: ["turtle", "action"],
		init: "Turn {id:'angle', type:'number', placeholder:10} degrees",
		onact: function(my){
			my.target.turn(my.data.angle);
		}
	});

	Joy.add({
		name: "Change color",
		type: "turtle/color",
		tags: ["turtle", "action"],
		init: "Change color to {id:'color', type:'color'}",
		onact: function(my){
			my.target.setColor(my.data.color);
		}
	});

	Joy.add({
		name: "Put brush up/down",
		type: "turtle/pen",
		tags: ["turtle", "action"],
		init: JSON.stringify({
			id:'pen',
			type:'choose', 
			options:[
				{label:'Put brush up', value:0},
				{label:'Put brush down', value:1}, 
				{label:'Toggle brush', value:-1}
			], // TODO: actual boolean widget. AND it auto-toggles for you!
			placeholder:0
		}),
		onact: function(my){
			switch(my.data.pen){
				case 0: my.target.setPen(false); break;
				case 1: my.target.setPen(true); break;
				case -1: my.target.setPen(!my.target.pen); break;
			}
		}
	});

});