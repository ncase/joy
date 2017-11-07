window.onload = function(){

	// Joy
	window.joy = new Joy({
		
		init: "Start with: {id:'start', type:'actions'}"+
			  "For {id:'iterations', type:'number', placeholder:100} days, do: "+
			  "{id:'iterate', type:'actions', resetVariables:false}"+
			  "<hr> {type:'save'}",
			  // TODO: don't allow var for num of days

		data: Joy.loadFromURL(),
		allowPreview: true,
		container: "#editor",
		modules: ["math", "instructions"],

		onupdate: function(my){

			var timeseries = [];
			var _log = function(time){
				timeseries.push({
					time: time,
					value: obj._variables.thing
				});
			};

			// Start
			var obj = {};
			my.start.act(obj);
			_log(0);

			// Iterate
			var iterations = my.iterations.get();
			for(var i=0; i<iterations; i++){
				my.iterate.act(obj);
				_log(i+1);
			}

			_updateGraph(timeseries);

		}
	});	

};

/////////////////////////

// set the dimensions and margins of the graph
var margin = {top:50, right:50, bottom:50, left:50},
    width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// set the ranges
var x = d3.scaleLinear().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// define the line
var valueline = d3.line()
    .x(function(d){ return x(d.time); })
    .y(function(d){ return y(d.value); });

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("#player").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate("+margin.left+","+margin.top+")");

// Append the path, xAxis, and yAxis.
var path = svg.append("path");
var xAxis = svg.append("g").attr("class", "x axis");
var yAxis = svg.append("g").attr("class", "y axis");

// ON UPDATE
function _updateGraph(data){

	// format the data
	data.forEach(function(d){
		d.time = +d.time;
		d.value = +d.value;
	});

	// Scale the range of the data
	x.domain(d3.extent(data, function(d){ return d.time; }));
	y.domain([
		Math.min(0, d3.min(data, function(d){ return d.value; })), // 0 or lower...
		d3.max(data, function(d){ return d.value; })+3 // max value, plus 3
	]);

	// Set the valueline path.
	path.data([data])
	  .attr("class", "line")
	  .attr("d", valueline);

	// Set the X Axis
	xAxis.attr("transform", "translate(0,"+height+")")
	  .call(d3.axisBottom(x));

	// Set the Y Axis
	yAxis.call(d3.axisLeft(y));

}
