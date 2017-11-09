window.onload = function(){

	// Joy
	window.joy = new Joy({
		
		init: "Let's graph these numbers: {id:'start', type:'actions', onlyActions:['graph/number','instructions/comment']}"+
			  "Do this on each of {id:'iterations', type:'number', placeholder:50} steps: "+
			  "{id:'iterate', type:'actions', resetVariables:false, onlyActions:['math/operation','math/set','instructions/comment']}"+
			  "<hr> {type:'save'}",

		data: Joy.loadFromURL(),
		allowPreview: true,
		container: "#editor",
		modules: ["graph", "math", "instructions"],

		onupdate: function(my){

			// Log, as an array of time series, ALL the variables.
			var obj = {};
			var lines = [];
			var _log = function(time){
				var things = obj._variables;
				var graph = obj._graph || {};
				for(var thingName in things){

					// No line yet? Make one!
					var line = lines.find(function(line){
						return line.name==thingName;
					});
					if(!line){
						line = {
							name: thingName,
							series: []
						};
						// Color this line? Only if it's in _graph!
						if(graph[thingName]){
							line.color = _HSVToRGBString(Joy.getReferenceById(my, graph[thingName]).data.color);
						}
						lines.push(line);
					}

					// Push the value to the line's timeseries
					line.series.push({
						time: time,
						value: things[thingName]
					});

				}
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

			// Update the graph!
			_updateGraph({
				iterations: iterations,
				lines: lines
			});

		}
	});	

};

Joy.module("graph", function(){

	Joy.add({
		name: "Start [number] at...",
		type: "graph/number",
		tags: ["graph", "action"],
		init: "Start {id:'varname', type:'variableName', variableType:'number'} "+
			  "at {id:'value', type:'number'}",
		onact: function(my){

			// COLOR
			//my.target._colors = my.target._colors || {}; // colors object, if none!
			//my.target._colors[my.data.varname] = my.data.color; // store color
			my.target._graph = my.target._graph || {};
			my.target._graph[my.data.varname] = my.actor.varname.data.refID; // total hack

			// SET VAR
			var _variables = my.target._variables;
			var varname = my.data.varname; // it's just a synchronized string
			_variables[varname] = my.data.value; // Set the variable

		}
	});

});

/////////////////////////

// set the dimensions and margins of the graph
var margin = {top:50, right:75, bottom:50, left:50},
    width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// set the ranges
var x = d3.scaleLinear().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

// Appends a chart
var chart = d3.select("#player").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate("+margin.left+","+margin.top+")");

// Append the path, xAxis, and yAxis.
var lineContainer = chart.append("g");
var xAxis = chart.append("g").attr("class", "x axis");
var yAxis = chart.append("g").attr("class", "y axis");

// ON UPDATE
function _updateGraph(data){

	var iterations = data.iterations;
	var lines = data.lines.reverse(); // because first to graph should stay on top!!

	// Get domain of data
	x.domain([0, iterations]);
	var min = d3.min(lines, function(line){
		return d3.min(line.series, function(d){return d.value;});
	});
	var max = d3.max(lines, function(line){
		return d3.max(line.series, function(d){return d.value;});
	});
	y.domain([
		(min<0) ? min-1 : 0,
		(max>=0) ? max+1 : 0
	]);

	// path line getter
	var pathline = d3.line()
	    .x(function(d){ return x(d.time); })
	    .y(function(d){ return y(d.value); });

	// REJOIN DATA EACH TIME.
	var update = lineContainer.selectAll("g").data(lines);
	var enter = update.enter().append("g");
		enter.attr("class", "line");
		enter.append("path");
		enter.append("text");
	var exit = update.exit().remove();
	var merge = update.merge(enter);
	merge.select("path")
		.style("stroke", function(d){ return d.color || ""; })
		.attr("d", function(d){
			return pathline(d.series);
		})
		.attr("class", function(d){ return d.color?"":"small"; });
	merge.select("text")
		.attr("transform", function(d){
			var last = d.series[d.series.length-1];
			var lastY = last.value;
			return "translate(" + x(last.time) + "," + y(last.value) + ")";
		})
		.attr("x", 3)
		.attr("dy", "0.35em")
		.style("fill", function(d){ return d.color || ""; })
		.text(function(d){
			return d.name;
		});

	// Set the X Axis
	xAxis.attr("transform", "translate(0,"+height+")")
	  .call(d3.axisBottom(x));

	// Set the Y Axis
	yAxis.call(d3.axisLeft(y));

}
