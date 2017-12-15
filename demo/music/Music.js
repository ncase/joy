// A KIND OF PLACEHOLDER THING
function Music(containerID){

	var self = this;

	var container = document.querySelector(containerID);

	// Create a lil' music canvas
	var canvas = document.createElement("canvas");
	canvas.width = 1000;
	canvas.height = 1000;
	canvas.id = "music_sheet";
	var ctx = canvas.getContext('2d');
	container.appendChild(canvas);

	// And also a play-pause overlay
	var overlay = document.createElement("div");
	overlay.id = "overlay";
	container.appendChild(overlay);

	// PLAY/PAUSE
	self.isPlaying = true;
	var _onclick = function(){
		if(self.isPlaying){
			// Deactivate all notes
			self.deactivateAllNotes();
			self.isPlaying = false;
			_onmousemove(event);
		}else{
			self.isPlaying = true;
		}

		// Overlay
		overlay.setAttribute("playing", self.isPlaying?"yes":"no");

	};
	var _onmousemove = function(event){
		if(!self.isPlaying){
			var x = event.offsetX;
			if(event.target!=container) x+=event.target.offsetLeft; // HACK
			var time = TOTAL_TIME*(x/(canvas.width/2));
			self.currentTime = time;
		}
	};
	container.addEventListener("click", _onclick, true);
	container.addEventListener("mousemove", _onmousemove, true);

	// POOL OF SYNTHS
	var MAX_SYNTHS = 16;
	//self.synthIndex = 0;
	self.synthPool = [];
	for(var i=0; i<MAX_SYNTHS; i++){
		var synth = new Tone.Synth().toMaster();
		self.synthPool.push(synth);
	}
	self.getSynthFromPool = function(targetPitch){

		// GET THE CLOSEST SYNTH (or, unused)
		var closestSynth;
		var smallestDistance = Infinity;
		var indexUsed;
		for(var i=0; i<self.synthPool.length; i++){
			var synth = self.synthPool[i];
			var pitch = synth._HACK_PITCH;
			if(!pitch){ // unused
				indexUsed = i;
				closestSynth = synth;
				break;
			}
			var distance = Math.abs(targetPitch - pitch);
			if(distance < smallestDistance){
				smallestDistance = distance;
				indexUsed = i;
				closestSynth = synth;
			}
		}

		closestSynth._HACK_PITCH = targetPitch;
		return closestSynth;

		//var synth = self.synthPool[self.synthIndex];
		//self.synthIndex = (self.synthIndex+1)%MAX_SYNTHS;
		//return synth;

	};

	// Notes
	var PITCH_LOWEST = 100;
	var PITCH_HIGHEST = 1000;
	var TOTAL_TIME = 8;
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
	self.deactivateAllNotes = function(){
		// End all synths
		for(var i=0; i<self.synthPool.length; i++){
			var synth = self.synthPool[i];
			synth.triggerRelease();
		}
		// Turn 'em ALL off
		for(var i=0; i<self.notes.length; i++){
			var note = self.notes[i];
			note.active = false;
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
		/*if(note.volume<0) note.volume=0;
		if(note.volume>100) note.volume=100;*/
		note.volume = 100;

		// NOT ACTIVE
		note.active = false;

		// ADD NOTE
		self.notes.push(note);

	};

	// Update, too, I suppose... with DELTA
	self.currentTime = 0;
	self.update = function(delta){

		// ONLY WHEN PLAYING
		if(self.isPlaying){

			// Current Time
			self.currentTime += delta/1000;
			if(self.currentTime>TOTAL_TIME){
				self.deactivateAllNotes();
				joy.update(); // TOTAL HACK, WHATEVER
			}
			while(self.currentTime>TOTAL_TIME) self.currentTime-=TOTAL_TIME;

			// Active Notes?
			for(var i=0; i<self.notes.length; i++){
				var note = self.notes[i];
				var begin = note.time;
				var end = note.time+note.length;
				var isActive = (begin<self.currentTime && self.currentTime<end);
				if(!note.active && isActive){ // START PLAYING!

					if(!isNaN(note.pitch)){
						var synth = self.getSynthFromPool(note.pitch);
						var length = note.length - (self.currentTime-begin); // minus already started
						synth.triggerAttackRelease(note.pitch, length);
					}

				}
				note.active = isActive;
			}
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
		ctx.beginPath();
		ctx.strokeStyle = "#000";
		ctx.lineWidth = 2;
		var width = (1/TOTAL_TIME)*canvas.width;
		for(var i=0; i<TOTAL_TIME; i++){
			var x = i*width;
			ctx.moveTo(x,0);
			ctx.lineTo(x,canvas.height);
		}
		ctx.stroke();

		// Draw note boxes
		for(var i=0; i<self.notes.length; i++){
			var note = self.notes[i];
			var pitch = (note.pitch-PITCH_LOWEST)/(PITCH_HIGHEST-PITCH_LOWEST);
			ctx.fillStyle = d3.interpolateRainbow(pitch);
			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 4;
			var rectHeight = 30;
			var x = (note.time/TOTAL_TIME)*canvas.width;
			var y = (1-pitch)*(canvas.height-rectHeight);
			var alpha = note.volume/100;
			var width = (note.length/TOTAL_TIME)*canvas.width;
			var height = rectHeight; //(1/TOTAL_ROWS)*canvas.height;
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

		// Label the variables!
		ctx.save();
		ctx.translate(960, 50);
		ctx.font = "40px sans-serif";
		ctx.textAlign = "right";
		ctx.fillStyle = "#fff";
		var lines = self.label.split('\n');
		for(var i=0; i<lines.length; i++){
    		ctx.fillText(lines[i], 0, 30+(i*45) );
    	}
		ctx.restore();

	};
	self.label = "";

}