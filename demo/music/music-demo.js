// Music Box
window.music = new Music("#player");

// Joy<->Music Actions
Joy.module("music", function(){

	Joy.add({
		name: "Play note",
		type: "music/note",
		tags: ["music", "action"],
		init: "Play note at "+
			  "time {id:'time', type:'number', placeholder:0}, "+
			  "row {id:'row', type:'number', placeholder:0}, "+
			  "volume {id:'volume', type:'number', placeholder:1}, "+
			  "length {id:'length', type:'number', placeholder:1}.",
		onact: function(my){
			music.note({
				time: my.data.time,
        		row: my.data.row,
        		volume: my.data.volume,
        		length: my.data.length
        	});
		}
	});

});

// Joy Editor
window.joy = Joy({
		
	init: "Let's make some music! {id:'instructions', type:'actions'}"+
		  "<hr> {type:'save'}",

	data: Joy.loadFromURL(),
	allowPreview: true,
	container: "#editor",
	modules: ["music", "instructions", "math"],

	onupdate: function(my){
		music.reset();
		my.instructions.act(music);
	}
});