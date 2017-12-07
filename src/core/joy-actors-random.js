Joy.module("random", function(){

	Joy.add({
		name: "With a X% chance...",
		type: "random/if",
		tags: ["random", "action"],
		init: "With a {id:'chance', type:'number', min:0, max:100, placeholder:50}% chance, do:"+
			  "{id:'actions', type:'actions', resetVariables:false}",
		onact: function(my){
			
			var probability = my.data.chance/100;
			if(Math.random() < probability){
				var message = my.actor.actions.act(my.target);
				if(message=="STOP") return message; // STOP
			}

		}
	});

	/****************

	Set a variable to some number.

	****************/
	Joy.add({
		name: "Set random [number]",
		type: "random/set",
		tags: ["random", "action"],
		init: "Set {id:'varname', type:'variableName', variableType:'number'} to a random "+
			  "{id:'numtype', type:'choose', options:['number','integer'], placeholder:'number'} between "+
			  "{id:'min', type:'number', placeholder:1} and {id:'max', type:'number', placeholder:100}",
		onact: function(my){

			var _variables = my.target._variables;
			var varname = my.data.varname; // it's just a synchronized string

			var _min = my.data.min;
			var _max = my.data.max;
			var min = Math.min(_min,_max); // just in case
			var max = Math.max(_min,_max); // just in case

			var randomValue = min + (Math.random()*(max-min));
			if(my.data.numtype=="integer"){
				randomValue = Math.round(randomValue);
			}
			_variables[varname] = randomValue; // Set the variable

		}
	});

});