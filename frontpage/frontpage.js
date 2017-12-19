window.onload = function(){

	var _MakeAnimatedThumb = function(config){

		var thumb = document.querySelector(config.dom);
		
		var pxWidth = config.pxWidth;
		var pxHeight = config.pxHeight;
		var width = config.width;
		var height = config.height;
		thumb.style.backgroundSize = pxWidth+"px";

		var isAnimating = false;
		var frame = 0;
		var totalFrames = config.totalFrames;
		var reverse = false;

		thumb.addEventListener("mouseover", function(){
			isAnimating = true;
		});
		thumb.addEventListener("mouseout", function(){
			isAnimating = false;
		});
		
		setInterval(function(){
			if(isAnimating){
				
				var x = frame%width;
				var y = Math.floor(frame/width);
				var squareSize = pxWidth/width;
				x = (-x*squareSize)+"px";
				y = (-y*squareSize)+"px";
				thumb.style.backgroundPosition = x+" "+y;

				if(reverse){
					frame--;
					if(frame==0){
						reverse = false;
					}
				}else{
					frame++;
					if(config.loop){
						if(frame==totalFrames){
							frame=0;
						}
					}else{
						if(frame==totalFrames-1){
							reverse = true;
						}
					}
				}

			}
		},1000/12);

	};

	_MakeAnimatedThumb({
		dom: "#demo_turtle_thumb",
		pxWidth: 1000,
		pxHeight: 750,
		width: 4,
		height: 3,
		totalFrames: 12
	});

	_MakeAnimatedThumb({
		dom: "#demo_music_thumb",
		pxWidth: 1750,
		pxHeight: 1250,
		width: 7,
		height: 5,
		totalFrames: 32,
		loop: true
	});

	_MakeAnimatedThumb({
		dom: "#demo_nonlinear_thumb",
		pxWidth: 1500,
		pxHeight: 1000,
		width: 6,
		height: 4,
		totalFrames: 23
	});

};