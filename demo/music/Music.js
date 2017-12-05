// A KIND OF PLACEHOLDER THING
function Music(containerID){

	var self = this;

	// Create a lil' music canvas
	var canvas = document.createElement("canvas");
	canvas.width = 1000;
	canvas.height = 1000;
	canvas.id = "music_sheet";
	var ctx = canvas.getContext('2d');
	document.querySelector(containerID).appendChild(canvas);

	// POOL OF SYNTHS
	var MAX_SYNTHS = 5;
	self.synthIndex = 0;
	self.synthPool = [];
	for(var i=0; i<MAX_SYNTHS; i++){
		var synth = new Tone.Synth().toMaster();
		self.synthPool.push(synth);
	}
	self.getSynthFromPool = function(){
		var synth = self.synthPool[self.synthIndex];
		self.synthIndex = (self.synthIndex+1)%MAX_SYNTHS;
		return synth;
	};

	// Notes
	var PITCH_LOWEST = 200;
	var PITCH_HIGHEST = 1000;
	var TOTAL_TIME = 6;
	self.notes = [];
	self.clearNotes = function(){
		self._pastNotes = self.notes;
		self.notes = [];
	};
	self.restoreActive = function(){
		for(var i=0; i<self.notes.length; i++){
			var note = self.notes[i];
			var pastNote = self._pastNotes[i];
			if(pastNote){
				note.active = pastNote.active;
			}
		}
	}
	self.addNote = function(note){

		// BOUNDS
		// 200Hz < pitch < 1000Hz
		if(note.pitch<PITCH_LOWEST) note.pitch=PITCH_LOWEST;
		if(note.pitch>PITCH_HIGHEST) note.pitch=PITCH_HIGHEST;
		// 0s < time < 6s (or... loop around?)
		if(note.time<0) note.time=0;
		if(note.time>TOTAL_TIME) note.time=TOTAL_TIME;
		// 0s < length < 6s
		if(note.length<0) note.length=0;
		if(note.length>TOTAL_TIME) note.length=TOTAL_TIME;
		// 0% < volume < 100%
		if(note.volume<0) note.volume=0;
		if(note.volume>100) note.volume=100;

		// NOT ACTIVE
		note.active = false;

		// ADD NOTE
		self.notes.push(note);

	};

	// Update, too, I suppose... with DELTA
	self.currentTime = 0;
	self.update = function(delta){

		// Current Time
		self.currentTime += delta/1000;
		while(self.currentTime>TOTAL_TIME) self.currentTime-=TOTAL_TIME;

		// Active Notes?
		for(var i=0; i<self.notes.length; i++){
			var note = self.notes[i];
			var begin = note.time;
			var end = note.time+note.length;
			var isActive = (begin<self.currentTime && self.currentTime<end);
			if(!note.active && isActive){ // START PLAYING!

				var synth = self.getSynthFromPool();
				synth.triggerAttackRelease(note.pitch, note.length);

			}
			note.active = isActive;
		}

		// Draw!
		self.draw();

	};

	// Reset canvas
	self.draw = function(){

		// Clear
		ctx.fillStyle = "#222";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw BG lines
		/*ctx.beginPath();
		ctx.strokeStyle = "#ccc";
		ctx.lineWidth = 1;
		var height = (1/TOTAL_ROWS)*canvas.height;
		for(var i=0; i<TOTAL_ROWS; i++){
			var y = i*height;
			ctx.moveTo(0,y);
			ctx.lineTo(canvas.width,y);
		}
		ctx.stroke();*/

		// Draw note boxes
		for(var i=0; i<self.notes.length; i++){
			var note = self.notes[i];
			var pitch = (note.pitch-PITCH_LOWEST)/(PITCH_HIGHEST-PITCH_LOWEST);
			ctx.fillStyle = d3.interpolateRainbow(pitch);
			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 4;
			var x = (note.time/TOTAL_TIME)*canvas.width;
			var y = (1-pitch)*canvas.height;
			var alpha = note.volume/100;
			var width = (note.length/TOTAL_TIME)*canvas.width;
			var height = 50; //(1/TOTAL_ROWS)*canvas.height;
			ctx.globalAlpha = alpha;
			ctx.beginPath();
			ctx.rect(x, y, width, height);
			ctx.fill();
			ctx.globalAlpha = 1;
			if(note.active){
				ctx.stroke();
			}
		}

		// Draw currentTime
		ctx.beginPath();
		ctx.lineWidth = 5;
		ctx.strokeStyle = "#fff";
		var x = (self.currentTime/TOTAL_TIME)*canvas.width;
		ctx.moveTo(x, 0);
		ctx.lineTo(x, canvas.height);
		ctx.stroke();

	};

}