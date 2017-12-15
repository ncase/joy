var DEMOS = {
	staircase: {"instructions":{"actions":[{"type":"instructions/comment","value":"A basic staircase pattern~"},{"type":"math/set","varname":{"type":"variableName","refID":"id1"},"value":{"type":"number","chain":[{"type":"number_raw","value":0}]}},{"type":"math/set","varname":{"type":"variableName","refID":"id0"},"value":{"type":"number","chain":[{"type":"number_raw","value":100}]}},{"type":"instructions/repeat","count":{"type":"number","chain":[{"type":"number_raw","value":40}]},"actions":{"actions":[{"type":"music/note","pitch":{"type":"number","chain":[{"type":"variableName","refID":"id0"}]},"time":{"type":"number","chain":[{"type":"variableName","refID":"id1"}]},"length":{"type":"number","chain":[{"type":"number_raw","value":0.2}]}},{"type":"math/operation","operation":{"value":"+","type":"choose"},"varname":{"type":"variableName","refID":"id1"},"value":{"type":"number","chain":[{"type":"number_raw","value":0.2}]}},{"type":"math/operation","operation":{"value":"+","type":"choose"},"varname":{"type":"variableName","refID":"id0"},"value":{"type":"number","chain":[{"type":"number_raw","value":23}]}}],"resetVariables":false,"type":"actions"}}],"resetVariables":true,"type":"actions"},"_references":{"id1":{"id":"id1","tags":["number"],"data":{"value":"time","color":[212,0.71,1]},"connected":3},"id0":{"id":"id0","tags":["number"],"data":{"value":"pitch","color":[0,0.6,1]},"connected":3}}},
	random: {"instructions":{"actions":[{"type":"math/set","varname":{"type":"variableName","refID":"id1"},"value":{"type":"number","chain":[{"type":"number_raw","value":0}]}},{"type":"instructions/repeat","count":{"type":"number","chain":[{"type":"number_raw","value":32}]},"actions":{"actions":[{"type":"instructions/comment","value":"Just randomly places 1/2-second notes at 200Hz, 300hz, 400Hz, 500Hz, or 600Hz every 1/4 second"},{"type":"random/set","varname":{"type":"variableName","refID":"id0"},"numtype":{"value":"integer","type":"choose"},"min":{"type":"number","chain":[{"type":"number_raw","value":2}]},"max":{"type":"number","chain":[{"type":"number_raw","value":6}]}},{"type":"math/operation","operation":{"value":"*","type":"choose"},"varname":{"type":"variableName","refID":"id0"},"value":{"type":"number","chain":[{"type":"number_raw","value":100}]}},{"type":"music/note","pitch":{"type":"number","chain":[{"type":"variableName","refID":"id0"}]},"time":{"type":"number","chain":[{"type":"variableName","refID":"id1"}]},"length":{"type":"number","chain":[{"type":"number_raw","value":0.5}]}},{"type":"math/operation","operation":{"value":"+","type":"choose"},"varname":{"type":"variableName","refID":"id1"},"value":{"type":"number","chain":[{"type":"number_raw","value":0.25}]}}],"resetVariables":false,"type":"actions"}}],"resetVariables":true,"type":"actions"},"_references":{"id0":{"id":"id0","tags":["number"],"data":{"value":"pitch","color":[0,0.6,1]},"connected":3},"id1":{"id":"id1","tags":["number"],"data":{"value":"time","color":[212,0.71,1]},"connected":3}}},
	waves: {"instructions":{"actions":[{"type":"math/set","varname":{"type":"variableName","refID":"id3"},"value":{"type":"number_raw","chain":[{"type":"number_raw","value":0}]}},{"type":"math/set","varname":{"type":"variableName","refID":"id0"},"value":{"type":"number_raw","chain":[{"type":"number_raw","value":0}]}},{"type":"math/set","varname":{"type":"variableName","refID":"id1"},"value":{"type":"number_raw","chain":[{"type":"number_raw","value":1}]}},{"type":"math/set","varname":{"type":"variableName","refID":"id4"},"value":{"type":"number_raw","chain":[{"type":"number_raw","value":0.16}]}},{"type":"instructions/repeat","count":{"type":"number","chain":[{"type":"number_raw","value":40}]},"actions":{"actions":[{"type":"math/operation","operation":{"value":"+","type":"choose"},"varname":{"type":"variableName","refID":"id1"},"value":{"type":"number_raw","chain":[{"type":"variableName","refID":"id0"},{"type":"choose","value":"*"},{"type":"variableName","refID":"id4"}]}},{"type":"math/operation","operation":{"value":"-","type":"choose"},"varname":{"type":"variableName","refID":"id0"},"value":{"type":"number_raw","chain":[{"type":"variableName","refID":"id1"},{"type":"choose","value":"*"},{"type":"variableName","refID":"id4"}]}},{"type":"math/set","varname":{"type":"variableName","refID":"id2"},"value":{"type":"number_raw","chain":[{"type":"variableName","refID":"id0"},{"type":"choose","value":"*"},{"type":"number_raw","value":250},{"type":"choose","value":"+"},{"type":"number_raw","value":400}]}},{"type":"music/note","pitch":{"type":"number","chain":[{"type":"variableName","refID":"id2"}]},"time":{"type":"number","chain":[{"type":"variableName","refID":"id3"}]},"length":{"type":"number","chain":[{"type":"number_raw","value":0.2}]}},{"type":"math/set","varname":{"type":"variableName","refID":"id5"},"value":{"type":"number_raw","chain":[{"type":"variableName","refID":"id1"},{"type":"choose","value":"*"},{"type":"number_raw","value":250},{"type":"choose","value":"+"},{"type":"number_raw","value":400}]}},{"type":"music/note","pitch":{"type":"number","chain":[{"type":"variableName","refID":"id5"}]},"time":{"type":"number","chain":[{"type":"variableName","refID":"id3"}]},"length":{"type":"number","chain":[{"type":"number_raw","value":0.2}]}},{"type":"math/operation","operation":{"value":"+","type":"choose"},"varname":{"type":"variableName","refID":"id3"},"value":{"type":"number_raw","chain":[{"type":"number_raw","value":0.2}]}}],"resetVariables":false,"type":"actions"}}],"resetVariables":true,"type":"actions"},"_references":{"id0":{"id":"id0","tags":["number"],"data":{"value":"wave a","color":[260,0.7,1]},"connected":4},"id1":{"id":"id1","tags":["number"],"data":{"value":"wave b","color":[310,0.6,1]},"connected":4},"id2":{"id":"id2","tags":["number"],"data":{"value":"pitch a","color":[271,0.65,1]},"connected":2},"id3":{"id":"id3","tags":["number"],"data":{"value":"time","color":[200,0.81,1]},"connected":4},"id4":{"id":"id4","tags":["number"],"data":{"value":"frequency","color":[39,0.65,1]},"connected":3},"id5":{"id":"id5","tags":["number"],"data":{"value":"pitch b","color":[314,0.48,1]},"connected":2}}},
	fractal: {"instructions":{"actions":[{"type":"math/set","varname":{"type":"variableName","refID":"id0"},"value":{"type":"number_raw","chain":[{"type":"number_raw","value":100}]}},{"type":"math/set","varname":{"type":"variableName","refID":"id1"},"value":{"type":"number_raw","chain":[{"type":"number_raw","value":8}]}},{"type":"instructions/comment","value":"Create five rows of pitches... each row's pitch is 1.5x the one before, and has notes 1/4 the length as the last one's."},{"type":"instructions/repeat","count":{"type":"number","chain":[{"type":"number_raw","value":5}]},"actions":{"actions":[{"type":"math/set","varname":{"type":"variableName","refID":"id2"},"value":{"type":"number_raw","chain":[{"type":"number_raw","value":0}]}},{"type":"instructions/comment","value":"On each row, space out 32 notes... (notes will go \"off-screen\" for bottom three rows)"},{"type":"instructions/repeat","count":{"type":"number","chain":[{"type":"number_raw","value":32}]},"actions":{"actions":[{"type":"music/note","pitch":{"type":"number","chain":[{"type":"variableName","refID":"id0"}]},"time":{"type":"number","chain":[{"type":"variableName","refID":"id2"}]},"length":{"type":"number","chain":[{"type":"variableName","refID":"id1"}]}},{"type":"math/operation","operation":{"value":"+","type":"choose"},"varname":{"type":"variableName","refID":"id2"},"value":{"type":"number_raw","chain":[{"type":"variableName","refID":"id1"},{"type":"choose","value":"*"},{"type":"number_raw","value":2}]}}],"resetVariables":false,"type":"actions"}},{"type":"instructions/comment","value":"And then, the next row above has notes that are 1.5x the pitch, but 1/4 the length"},{"type":"math/operation","operation":{"value":"*","type":"choose"},"varname":{"type":"variableName","refID":"id0"},"value":{"type":"number_raw","chain":[{"type":"number_raw","value":1.5}]}},{"type":"math/operation","operation":{"value":"/","type":"choose"},"varname":{"type":"variableName","refID":"id1"},"value":{"type":"number_raw","chain":[{"type":"number_raw","value":4}]}}],"resetVariables":false,"type":"actions"}}],"resetVariables":true,"type":"actions"},"_references":{"id0":{"id":"id0","tags":["number"],"data":{"value":"pitch","color":[0,0.6,1]},"connected":3},"id1":{"id":"id1","tags":["number"],"data":{"value":"length","color":[30,0.8,1]},"connected":4},"id2":{"id":"id2","tags":["number"],"data":{"value":"time","color":[210,0.8,1]},"connected":3}}},
	blank: {}
};

// random
// shepherd's tone
// lines
// blank

// Music Box
window.music = new Music("#player");

// ANIMATION
var lastTimestep = null;
function step(timestamp) {
	if(!lastTimestep) lastTimestep = timestamp-(1000/60);
	var delta = timestamp-lastTimestep;
	music.update(delta);
	window.requestAnimationFrame(step);
	lastTimestep = timestamp;
}
window.requestAnimationFrame(step);


/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////


// Joy Editor
window.joy;
window.onload = function(){

	// Data
	var model = _getParameterByName("song");
	var data = model ? DEMOS[model] : Joy.loadFromURL();
	data = data || {};

	window.joy = Joy({
			
		init: "Let's make some music! {id:'instructions', type:'actions'}"+
			  "<hr> {type:'save'}",

		data: data,

		container: "#editor",
		modules: ["music", "instructions", "math", "random"],

		onupdate: function(my){

			music.clearNotes();
			my.instructions.act(music);
			music.restoreActive();

			// TOTAL HACK BUT W/E
			music.label = "";
			if(my.activePreview && my.activePreview.type=="actions"){
				var label = "";
				for(var key in music._variables){
					var value = music._variables[key];
					if(value.toString().length>10) value=music._variables[key].toFixed(2); // hax
					label += key+": "+value+"\n";
				}
				music.label = label;
			}

		}
	});

};

// Joy<->Music Actions
Joy.module("music", function(){

	Joy.add({
		name: "♫",
		type: "music/note",
		tags: ["music", "action"],
		init: "♫ at "+
			  "pitch {id:'pitch', type:'number', placeholder:400}Hz, "+
			  "time {id:'time', type:'number', placeholder:0}s, "+
			  //"volume {id:'volume', type:'number', placeholder:100}, "+
			  "length {id:'length', type:'number', placeholder:0.5}s.",
		onact: function(my){
			music.addNote({
				time: my.data.time,
        		pitch: my.data.pitch,
        		//volume: my.data.volume,
        		length: my.data.length
        	});
		}
	});

});
