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

	window.joy = Joy({
			
		init: "Let's make some music! {id:'instructions', type:'actions'}"+
			  "<hr> {type:'save'}",

		data: Joy.loadFromURL(),
		
		previewActions: true,
		previewNumbers: true,

		container: "#editor",
		modules: ["music", "instructions", "math"],

		onupdate: function(my){

			music.clearNotes();
			my.instructions.act(music);
			music.restoreActive();

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
			  "pitch {id:'pitch', type:'number', placeholder:200}, "+
			  "time {id:'time', type:'number', placeholder:0}, "+
			  "volume {id:'volume', type:'number', placeholder:100}, "+
			  "length {id:'length', type:'number', placeholder:1}.",
		onact: function(my){
			music.addNote({
				time: my.data.time,
        		pitch: my.data.pitch,
        		volume: my.data.volume,
        		length: my.data.length
        	});
		}
	});

});
