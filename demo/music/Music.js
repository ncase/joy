// A KIND OF PLACEHOLDER THING
function Music(containerID){

	var self = this;

	// Create a lil' music canvas
	var canvas = document.createElement("canvas");
	canvas.width = 1000;
	canvas.height = 500;
	canvas.id = "music_sheet";
	var ctx = canvas.getContext('2d');
	document.querySelector(containerID).appendChild(canvas);

	// Reset canvas
	self.reset = function(){

		// Clear
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw music lines
		ctx.beginPath();
		ctx.strokeStyle = "#ccc";
		ctx.lineWidth = 1;
		var height = (1/TOTAL_ROWS)*canvas.height;
		for(var i=0; i<TOTAL_ROWS; i++){
			var y = i*height;
			ctx.moveTo(0,y);
			ctx.lineTo(canvas.width,y);
		}
		ctx.stroke();

	};

	// Place note
	// note: { time:0, row:9, volume:1, length:1}
	var TOTAL_TIME = 16;
	var TOTAL_ROWS = 20;
	self.note = function(note){

		// Bounds...
		if(note.time<0) note.time=0;
		if(note.row<0) note.row=0;
		if(note.volume<0) note.volume=0;
		if(note.volume>1) note.volume=1;
		if(note.length<0.125) note.length=0.125;

		// Draw box
		ctx.fillStyle = "#dd4040";
		ctx.strokeStyle = "#fff";
		ctx.lineWidth = 1;
		var x = (note.time/TOTAL_TIME)*canvas.width;
		var y = (1-((note.row+1)/TOTAL_ROWS))*canvas.height;
		var alpha = note.volume;
		var width = (note.length/TOTAL_TIME)*canvas.width;
		var height = (1/TOTAL_ROWS)*canvas.height;
		ctx.globalAlpha = alpha;
		ctx.beginPath();
		ctx.rect(x, y, width, height);
		ctx.fill();
		ctx.globalAlpha = 1;
		ctx.stroke();

	};

}