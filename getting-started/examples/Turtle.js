Math.TAU = Math.PI*2;

function Turtle(config){

	var self = this;

	// Config
	var data = config.data || {};
	if(data.frameX===undefined) data.frameX=config.width/2;
	if(data.frameY===undefined) data.frameY=config.height/2;

	// Canvas & Context (Retina!)
	self.width = config.width;
	self.height = config.height;
	var canvas = document.createElement("canvas");
	self.canvas = canvas;
	canvas.width = self.width*2;
	canvas.height = self.height*2;
	canvas.style.width = self.width+"px";
	canvas.style.height = self.height+"px";
	var ctx = canvas.getContext("2d");
	self.context = ctx;

	// Start off like this...
	self.reset = function(){
		ctx.setTransform(2, 0, 0, 2, 0, 0); // retina
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.translate(self.frameX, self.frameY);
		self.color = "#ff4040";
		self.x = self.width/2;
		self.y = self.height/2;
		self.angle = -Math.TAU/4; // facing up
		self.pen = true; // brush is active!
	};
	self.reset();

	// Turtle methods!
	self.forward = function(steps){

		// Move
		self.x += Math.cos(self.angle)*steps;
		self.y += Math.sin(self.angle)*steps;

		// Draw
		if(self.pen){
			ctx.lineTo(self.x, self.y);
		}

	};
	self.turn = function(angle){
		self.angle += angle*(Math.TAU/360);
	};

	// Turtle switch color...
	self.setColor = function(newColor){
		self.endLine();
		self.color = newColor;
		self.startLine();
	};

	// Pen up (off) or down (up)...
	self.setPen = function(pen){
		if(self.pen && !pen) self.endLine(); // Turning OFF pen? End that last line!
		if(!self.pen && pen) self.startLine(); // Turning ON a pen? Start a new line!
		self.pen = pen;
	};

	// Start & end drawing...
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	self.start = function(x,y){

		// reset & position
		self.reset();
		self.x = 0;
		self.y = 0;

		// draw
		self.startLine();
	};
	// end...
	self.endLine = function(){		
		ctx.strokeStyle = self.color;
		if(self.pen) ctx.stroke();
		ctx.closePath();
	};
	// ...and new
	self.startLine = function(){
		ctx.lineWidth = 5;
		ctx.beginPath();
		ctx.moveTo(self.x, self.y);
	};
	self.drawTurtle = function(){
		ctx.save();
		ctx.translate(self.x, self.y);
		ctx.rotate(self.angle+Math.TAU/4);
			// shadow
			ctx.fillStyle = "rgba(0,0,0,0.1)";
			ctx.beginPath();
			ctx.arc(0, 0, 16, 0, Math.TAU);
			ctx.fill();
			// body
			ctx.fillStyle = self.color;
			ctx.beginPath();
			ctx.arc(0, 0, 12, 0, Math.TAU);
			if(self.pen){
				ctx.fill();
			}else{
				ctx.fillStyle = "#fff";
				ctx.fill();
				ctx.lineWidth = 2;
				ctx.stroke();
			}
			// eyes
			var eyeX = 5.5;
			var eyeY = -4;
			ctx.fillStyle = "#fff";
			ctx.beginPath(); ctx.arc(-eyeX, eyeY, 4, 0, Math.TAU); ctx.fill();
			ctx.beginPath(); ctx.arc(eyeX, eyeY, 4, 0, Math.TAU); ctx.fill();
			ctx.fillStyle = "#000";
			ctx.beginPath(); ctx.arc(-eyeX, eyeY, 2, 0, Math.TAU); ctx.fill();
			ctx.beginPath(); ctx.arc(eyeX, eyeY, 2, 0, Math.TAU); ctx.fill();
		ctx.restore();
	};
	self.draw = function(){
		self.endLine();
		self.drawTurtle();
	};

	////////////////////////
	// Set Frame! & Drag! //
	////////////////////////

	if(!config.doNotDrag){

		self.frameX = 0;
		self.frameY = 0;
		self.setFrame = function(frameX, frameY){
			self.frameX = frameX;
			self.frameY = frameY;
		};
		self.ondrag = function(){}; // to implement

		// DRAG IT, BABY
		self.canvas.className = "cursor-grab";
		var isDragging = false;
		var startDragX, startFrameX,
			startDragY, startFrameY;
		var _onmousedown = function(event){
			isDragging = true;
			startDragX = event.clientX;
			startFrameX = self.frameX;
			startDragY = event.clientY;
			startFrameY = self.frameY;
			self.canvas.className = "cursor-grabbing";
		};
		var _onmousemove = function(event){
			if(isDragging){
				var dx = event.clientX - startDragX;
				var dy = event.clientY - startDragY;
				self.frameX = startFrameX + dx;
				self.frameY = startFrameY + dy;
				_ondrag();
			}
		};
		var _onmouseup = function(){
			isDragging = false;
			self.canvas.className = "cursor-grab";
		};

		// MOUSE EVENTS
		self.canvas.addEventListener("mousedown", _onmousedown);
		window.addEventListener("mousemove", _onmousemove);
		window.addEventListener("mouseup", _onmouseup);

		// On DRAG!
		self.setFrame(data.frameX, data.frameY);
		var _ondrag = function(){
			data.frameX = self.frameX;
			data.frameY = self.frameY;
			self.ondrag();
		};
		_ondrag();

	}else{
		self.frameX = data.frameX;
		self.frameY = data.frameY;
	}

	///////////////////////
	// Label the turtle! //
	///////////////////////

	self.label = function(label){
		ctx.save();
		ctx.translate(self.x, self.y);
		ctx.font = "14px sans-serif";
		ctx.textAlign = "center";
		ctx.fillStyle = "#444";
			var lines = label.split('\n');
			for(var i=0; i<lines.length; i++){
	    		ctx.fillText(lines[i], 0, 30+(i*16) );
	    	}
		ctx.restore();
	};

}