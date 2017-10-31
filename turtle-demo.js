Joy.add({
	name: "Move turtle",
	type: "turtle/forward",
	tags: ["turtle", "action"],
	init: "Move forward {type:'number', prop:'steps', min:0, placeholder:50} steps",
	onact: function(my){
		my.target.forward(my.data.steps);
	}
});

Joy.add({
	name: "Turn turtle",
	type: "turtle/turn",
	tags: ["turtle", "action"],
	init: "Turn {type:'number', prop:'angle', placeholder:10} degrees",
	onact: function(my){
		my.target.turn(my.data.angle);
	}
});

Joy.add({
	name: "Change color",
	type: "turtle/color",
	tags: ["turtle", "action"],
	init: "Change color to {type:'color', prop:'color'}",
	onact: function(my){
		my.target.setColor(my.data.color);
	}
});

Joy.add({
	name: "Put brush up/down",
	type: "turtle/pen",
	tags: ["turtle", "action"],
	init: JSON.stringify({
		type:'choose', 
		prop:'pen',
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

window.onload = function(){

	// Data
	var data = Joy.loadFromURL() || {};

	// Init
	window.turtle = new Turtle({width:500, height:500}); //, data:data});
	document.querySelector("#player").appendChild(turtle.canvas);

	// Joy
	window.joy = Joy({
		data: data,
		init: "I'm a turtle! Do the following: {prop:'turtleInstructions', type:'actions'} <hr> {type:'save'}",
		container: "#editor",
		onchange: function(my){
			turtle.start();
			my.actor.turtleInstructions.act(turtle);
			turtle.draw();
		}
	});

};