/********************

MODAL:
Places a big ol' modal dialogue bubble over the editor!

********************/
(function(){

// SINGLETON
var modal = {};
Joy.modal = modal;

modal.init = function(master){

	// The main modal container
	modal.dom = document.createElement("div");
	modal.dom.id = "joy-modal";
	document.body.appendChild(modal.dom);

	// Transparent background you click to kill!
	modal.bg = document.createElement("div");
	modal.bg.id = "joy-bg";
	modal.bg.onclick = function(){
		modal.currentUI.kill();
	};
	modal.dom.appendChild(modal.bg);

	// The actual bubble box
	modal.box = document.createElement("div");
	modal.box.id = "joy-box";
	modal.box.className = "arrow_box";
	modal.dom.appendChild(modal.box);

	// NO SCROLL
	modal.dom.addEventListener('wheel', function(event){
		event.preventDefault();
		return false;
	});

};
modal.show = function(ui){

	modal.dom.style.display = "block"; // hi

	// Remember & add UI
	modal.currentUI = ui;
	modal.box.appendChild(ui.dom);
	
	// Position the Box
	var position = ui.config.position || "below";
	modal.box.setAttribute("position", position);
	var boxBounds = modal.box.getBoundingClientRect();
	var sourceBounds = ui.config.source.getBoundingClientRect();
	var x,y, margin=20;
	switch(position){ // TODO: smarter positioning
		case "below":
			var x = sourceBounds.x + sourceBounds.width/2; // x: middle
			var y = sourceBounds.y + sourceBounds.height + margin; // y: bottom
			x -= boxBounds.width/2;
			break;
		case "left":
			var x = sourceBounds.x - margin; // x: left
			var y = sourceBounds.y + sourceBounds.height/2; // y: middle
			x -= boxBounds.width;
			y -= boxBounds.height/2;
			break;
	}
	modal.box.style.left = x+"px";
	modal.box.style.top = y+"px";

	// On Open
	if(modal.currentUI.onopen) modal.currentUI.onopen();

};
modal.hide = function(){

	_emptyDOM(modal.box);
	modal.dom.style.display = "none"; // bye

	// On Close
	if(modal.currentUI.onclose) modal.currentUI.onclose();

};

/********************
Chooser's config:
{
	source: [who this modal dialog should be "coming from"]
	value: [currently selected value, if any]
	options: [label-value pairs],
	onchange: function(value){}, // callback 
	position: "below" // default is "below"
};
********************/
modal.Chooser = function(config){

	var self = {}; // just an obj to scope this stuff

	// Config
	self.config = config;

	// Create DOM
	var dom = document.createElement("div");
	dom.className = "joy-modal-chooser";
	self.dom = dom;

	// Create List DOM
	var list = document.createElement("div");
	dom.appendChild(list);

	// Populate with list of options
	self.options = [];
	self.categories = {};
	var _placeholder_ = "_placeholder_";
	var _makeCategory = function(category){

		// dom
		var categoryDOM = document.createElement("div");
		list.appendChild(categoryDOM);

		// remember
		self.categories[category] = categoryDOM;

	};
	self.populate = function(){

		// Create categories, if any!
		var _anyCategories = false;
		for(var i=config.options.length-1; i>=0; i--){ // in REVERSE order.
			var option = config.options[i];
			var category = option.category;
			if(category){
				// Category doesn't exist yet... make it!
				if(!self.categories[category]){
					_makeCategory(category);
					_anyCategories = true;
				}
			}
		}
		// If none, make a placeholder one!
		if(!_anyCategories) _makeCategory(_placeholder_);

		// Create options
		for(var i=0; i<config.options.length; i++){

			// Create option
			var option = config.options[i];
			var optionDOM = document.createElement("div");
			optionDOM.innerHTML = option.label;

			// Put it in its category!
			var category = option.category || _placeholder_;
			self.categories[category].appendChild(optionDOM);

			// On Click!
			(function(option){
				// TODO: Hover & preview mode?
				optionDOM.onclick = function(event){
					self.onchange(option.value);
					event.stopPropagation(); // no, don't double-fire
				};
			})(option);

		}
	}
	self.populate();

	// On Select
	self.onchange = function(value){
		self.kill();
		config.onchange(value); // on select AFTER kill, since can create ANOTHER modal
	};

	// Kill & Remove
	self.kill = function(){
		modal.hide(); // hide modal
	};

	// Show me!
	modal.show(self);

};

/********************
Color's config:
{
	source: [who this modal dialog should be "coming from"]
	value: [currently selected value, if any]
	onchange: function(value){}, // callback 
	onclose: function(){}
};
********************/
modal.Color = function(config){

	var self = {}; // just an obj to scope this stuff

	// Config
	self.config = config;

	// Create DOM
	var dom = document.createElement("div");
	dom.className = "joy-modal-color";
	self.dom = dom;

	// COLOR is HSV.
	config.value = config.value || [0,1,1];
	self.h = config.value[0];
	self.s = config.value[1];
	self.v = config.value[2];

	// THREE ELEMENTS:
	// 1. Color Wheel
	// 2. Color Value
	// 3. Color Pickers

	var WHEEL_SIZE = 150;
	var SPECTRUM_WIDTH = 15;
	var MARGIN_1 = 10;
	var MARGIN_2 = 10;
	var MARGIN_3 = 10;

	var FULL_WIDTH = MARGIN_1+WHEEL_SIZE+MARGIN_2+SPECTRUM_WIDTH+MARGIN_3;
	var FULL_HEIGHT = MARGIN_1+WHEEL_SIZE+MARGIN_3;

	self.dom.style.width = FULL_WIDTH;
	self.dom.style.height = FULL_HEIGHT;

	/////////////////////////////
	// 1) The Color Wheel ///////
	/////////////////////////////

	var wheelCanvas = document.createElement("canvas");
	wheelCanvas.id = "joy-color-wheel";
	var wheelContext = wheelCanvas.getContext("2d");
	wheelCanvas.width = WHEEL_SIZE*2;
	wheelCanvas.height = WHEEL_SIZE*2;
	wheelCanvas.style.width = wheelCanvas.width/2;
	wheelCanvas.style.height = wheelCanvas.height/2;
	dom.appendChild(wheelCanvas);

	wheelCanvas.style.top = MARGIN_1;
	wheelCanvas.style.left = MARGIN_1;

	var _updateWheel = function(){

		// Image Data!
		var ctx = wheelContext;
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		var w = wheelCanvas.width;
		var h = wheelCanvas.height;
		var image = ctx.createImageData(w,h);
		var imageData = image.data;

		// Create a circle of colors
		// Thanks to: https://medium.com/@bantic/hand-coding-a-color-wheel-with-canvas-78256c9d7d43
		var cx = w/2;
		var cy = h/2;
		var radius = w/2; // buffer for the crosshair
		var radiusBuffered = radius + 2; // small buffer for clipping
		for(var x=0; x<w; x++){
			for(var y=0; y<h; y++){
				var dx = x-cx;
				var dy = y-cy;
				var distance = Math.sqrt(dx*dx+dy*dy);
				if(distance<radiusBuffered){ // buffer for clipping
					if(distance>=radius) distance=radius;

					// Angle & Distance, re-mapped to [0,1]
					var angle = Math.atan2(dy,dx); // from [-tau/2, tau/2]
					angle = ((angle/Math.TAU)+0.5)*360; // to [0,360]
					distance = (distance/radius); // to [0,1]

					// HSV! (capitals, coz already using 'h')
					var H = angle;
					var S = distance;
					var V = self.v;

					// TO RGB
					var rgb = _HSVtoRGB(H,S,V);
					var i = (x + (y*w))*4;
					imageData[i] = rgb[0];
					imageData[i+1] = rgb[1];
					imageData[i+2] = rgb[2];
					imageData[i+3] = 255;

				}
			}
		}
		ctx.putImageData(image, 0, 0);

		// Clip it, for aliasing
		ctx.save();
		ctx.globalCompositeOperation = "destination-in";
		ctx.beginPath();
		ctx.fillStyle = "#fff";
		ctx.arc(cx,cy,radius,0,Math.TAU);
		ctx.fill();
		ctx.restore();

	};
	_updateWheel();

	/////////////////////////////
	// 2) The Value Spectrum ////
	/////////////////////////////

	var spectrumCanvas = document.createElement("canvas");
	spectrumCanvas.id = "joy-color-value";
	var spectrumContext = spectrumCanvas.getContext("2d");
	spectrumCanvas.width = SPECTRUM_WIDTH*2;
	spectrumCanvas.height = WHEEL_SIZE*2;
	spectrumCanvas.style.width = spectrumCanvas.width/2;
	spectrumCanvas.style.height = spectrumCanvas.height/2;
	dom.appendChild(spectrumCanvas);

	spectrumCanvas.style.top = MARGIN_1;
	spectrumCanvas.style.right = MARGIN_3;

	var _updateSpectrum = function(){

		// Image data
		var ctx = spectrumContext;
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		var w = spectrumCanvas.width;
		var h = spectrumCanvas.height;
		var image = ctx.createImageData(w,h);
		var imageData = image.data;

		// Just a good ol' spectrum of values
		for(var x=0; x<w; x++){
			for(var y=0; y<h; y++){

				// HSV! (capitals, coz already using 'h')
				var H = self.h;
				var S = self.s;
				var V = 1-(y/h);

				// TO RGB
				var rgb = _HSVtoRGB(H,S,V);
				var i = (x + (y*w))*4;
				imageData[i] = rgb[0];
				imageData[i+1] = rgb[1];
				imageData[i+2] = rgb[2];
				imageData[i+3] = 255;

			}
		}
		ctx.putImageData(image, 0, 0);

	};
	_updateSpectrum();

	/////////////////////////////
	// 3) The Color Pickers /////
	/////////////////////////////

	var pickerCanvas = document.createElement("canvas");
	pickerCanvas.id = "joy-color-picker";
	var pickerContext = pickerCanvas.getContext("2d");
	pickerCanvas.width = FULL_WIDTH*2;
	pickerCanvas.height = FULL_HEIGHT*2;
	pickerCanvas.style.width = pickerCanvas.width/2;
	pickerCanvas.style.height = pickerCanvas.height/2;
	dom.appendChild(pickerCanvas);

	var _updatePickers = function(){

		// What's the color?
		var x,y;
		var ctx = pickerContext;
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.fillStyle = _HSVToRGBString(self.h, self.s, self.v);
		ctx.strokeStyle = "#fff";
		ctx.lineWidth = 2;

		// Draw it on the circle
		var cx = MARGIN_1*2 + wheelCanvas.width/2;
		var cy = MARGIN_1*2 + wheelCanvas.height/2;
		var angle = self.h*(Math.TAU/360);
		var radius = self.s*(wheelCanvas.width/2);
		x = cx - Math.cos(angle)*radius;
		y = cy - Math.sin(angle)*radius;
		ctx.beginPath();
		ctx.arc(x, y, SPECTRUM_WIDTH, 0, Math.TAU);
		ctx.fill();
		ctx.stroke();

		// Draw it on the spectrum
		var sx = MARGIN_1*2 + wheelCanvas.width + MARGIN_2*2 + spectrumCanvas.width/2;
		var sy = MARGIN_1*2;
		x = sx;
		y = sy + spectrumCanvas.height*(1-self.v);
		ctx.beginPath();
		ctx.arc(x, y, SPECTRUM_WIDTH, 0, Math.TAU);
		ctx.fill();
		ctx.stroke();

	};
	_updatePickers();

	// THE MOUSE EVENTS FOR THE PICKERS
	var editMode;
	var isDragging = false;
	var _update = function(event){

		if(event.target!=pickerCanvas) return; // if outta bounds forget it

		var x = event.offsetX*2;
		var y = event.offsetY*2;
		if(editMode=="hs"){
			x -= MARGIN_1*2;
			y -= MARGIN_1*2;
			_updateHS(x,y);
		}else{
			x -= MARGIN_1*2 + wheelCanvas.width + MARGIN_2*2;
			y -= MARGIN_1*2;
			_updateV(x,y);
		}

		// HEY TELL THE SOURCE
		_updateSource();

	};
	var _updateHS = function(x,y){

		// get polar
		var radius = wheelCanvas.width/2;
		var dx = x - radius;
		var dy = y - radius;
		var angle = Math.atan2(dy, dx);
		var distance = Math.sqrt(dx*dx+dy*dy);

		// Re-map
		angle = ((angle/Math.TAU)+0.5)*360; // to [0,360]
		if(angle<0) angle=0;
		if(angle>360) angle=360;
		distance = (distance/radius); // to [0,1]
		if(distance<0) distance=0;
		if(distance>1) distance=1;

		// update
		self.h = angle;
		self.s = distance;
		_updateSpectrum();
		_updatePickers();

	};
	var _updateV = function(x,y){
		self.v = 1-(y/spectrumCanvas.height);
		if(self.v<0) self.v=0;
		if(self.v>1) self.v=1;
		_updateWheel();
		_updatePickers();
	};
	var _onmousedown = function(event){
		isDragging = true;
		if(event.offsetX*2 < MARGIN_1*2 + wheelCanvas.width + MARGIN_2){
			editMode = "hs";
		}else{
			editMode = "v";
		}
		_update(event);
	};
	var _onmousemove = function(event){
		if(isDragging) _update(event);
	};
	var _onmouseup = function(){
		isDragging = false;
	};

	// MOUSE EVENTS
	pickerCanvas.addEventListener("mousedown", _onmousedown);
	window.addEventListener("mousemove", _onmousemove);
	window.addEventListener("mouseup", _onmouseup);

	// UPDATE SOURCE
	var _updateSource = function(){
		var newValue = [self.h, self.s, self.v];
		config.onchange(newValue);
	};

	// Kill
	self.kill = function(){
		
		// KILL LISTENERS
		dom.removeEventListener("mousedown", _onmousedown);
		window.removeEventListener("mousemove", _onmousemove);
		window.removeEventListener("mouseup", _onmouseup);

		// Hide Modal
		modal.hide();

	};

	// Show me!
	modal.show(self);

}

})();