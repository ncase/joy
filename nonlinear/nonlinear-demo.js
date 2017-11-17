var DEMOS = {
	waves: {"start":{"actions":[{"type":"graph/number","varname":{"type":"variableName","refID":"id0"},"value":{"type":"number","chain":[{"type":"number_raw","value":0}]}},{"type":"graph/number","varname":{"type":"variableName","refID":"id1"},"value":{"type":"number","chain":[{"type":"number_raw","value":1}]}}],"resetVariables":true,"type":"actions"},"iterations":{"value":100,"type":"number"},"iterate":{"actions":[{"type":"instructions/comment","value":"two linear rules = one non-linear result!\nthat's the magic of FEEDBACK LOOPS ✨"},{"type":"math/set","varname":{"type":"variableName","refID":"id2"},"value":{"type":"number","chain":[{"type":"number_raw","value":0.15}]}},{"type":"math/operation","operation":{"value":"+","type":"choose"},"varname":{"type":"variableName","refID":"id0"},"value":{"type":"number","chain":[{"type":"variableName","refID":"id1"},{"type":"choose","value":"*"},{"type":"variableName","refID":"id2"}]}},{"type":"math/operation","operation":{"value":"-","type":"choose"},"varname":{"type":"variableName","refID":"id1"},"value":{"type":"number","chain":[{"type":"variableName","refID":"id0"},{"type":"choose","value":"*"},{"type":"variableName","refID":"id2"}]}}],"resetVariables":false,"type":"actions"},"_references":{"id0":{"id":"id0","tags":["number"],"data":{"value":"X","color":[284,0.71,1]},"connected":3},"id1":{"id":"id1","tags":["number"],"data":{"value":"Y","color":[209,0.5,1]},"connected":3},"id2":{"id":"id2","tags":["number"],"data":{"value":"something","color":[358,0.69,1]},"connected":3}}},
	spring: {"start":{"actions":[{"type":"instructions/comment","value":"Let's simulate a simple spring system! Change the initial conditions & parameters as you please."},{"type":"graph/number","varname":{"type":"variableName","refID":"id0"},"value":{"type":"number","chain":[{"type":"number_raw","value":10}]}},{"type":"graph/number","varname":{"type":"variableName","refID":"id1"},"value":{"type":"number","chain":[{"type":"number_raw","value":0}]}}],"resetVariables":true,"type":"actions"},"iterations":{"value":100,"type":"number"},"iterate":{"actions":[{"type":"instructions/comment","value":"Hooke's Law for springs: F = -kx\nso, acceleration = (some negative number) * position"},{"type":"math/set","varname":{"type":"variableName","refID":"id2"},"value":{"type":"number","chain":[{"type":"number_raw","value":-0.05},{"type":"choose","value":"*"},{"type":"variableName","refID":"id0"}]}},{"type":"instructions/comment","value":"d/dt velocity = acceleration (by definition)\nd/dt position = velocity (by definition)"},{"type":"math/operation","operation":{"value":"+","type":"choose"},"varname":{"type":"variableName","refID":"id1"},"value":{"type":"number","chain":[{"type":"variableName","refID":"id2"}]}},{"type":"math/operation","operation":{"value":"+","type":"choose"},"varname":{"type":"variableName","refID":"id0"},"value":{"type":"number","chain":[{"type":"variableName","refID":"id1"}]}},{"type":"instructions/comment","value":"And finally, friction slows down the velocity:"},{"type":"math/operation","operation":{"value":"*","type":"choose"},"varname":{"type":"variableName","refID":"id1"},"value":{"type":"number","chain":[{"type":"number_raw","value":0.94}]}}],"resetVariables":false,"type":"actions"},"_references":{"id0":{"id":"id0","tags":["number"],"data":{"value":"position","color":[0,0.6,1]},"connected":3},"id1":{"id":"id1","tags":["number"],"data":{"value":"velocity","color":[30,0.8,1]},"connected":4},"id2":{"id":"id2","tags":["number"],"data":{"value":"acceleration","color":[210,0.8,1]},"connected":2}}},
	disease: {"start":{"actions":[{"type":"instructions/comment","value":"Let's simulate a basic model of disease spreading!"},{"type":"graph/number","varname":{"type":"variableName","refID":"id0"},"value":{"type":"number","chain":[{"type":"number_raw","value":10}]}},{"type":"graph/number","varname":{"type":"variableName","refID":"id1"},"value":{"type":"number","chain":[{"type":"number_raw","value":300}]}}],"resetVariables":true,"type":"actions"},"iterations":{"value":50,"type":"number"},"iterate":{"actions":[{"type":"math/set","varname":{"type":"variableName","refID":"id2"},"value":{"type":"number","chain":[{"type":"variableName","refID":"id1"},{"type":"choose","value":"-"},{"type":"variableName","refID":"id0"}]}},{"type":"instructions/comment","value":"The number of all POSSIBLE interactions would be [infected] x [non-infected], so the number of interactions that ACTUALLY pass on the infection would be that times some small constant."},{"type":"math/set","varname":{"type":"variableName","refID":"id3"},"value":{"type":"number","chain":[{"type":"variableName","refID":"id0"},{"type":"choose","value":"*"},{"type":"variableName","refID":"id2"},{"type":"choose","value":"*"},{"type":"number_raw","value":0.0005}]}},{"type":"math/operation","operation":{"value":"+","type":"choose"},"varname":{"type":"variableName","refID":"id0"},"value":{"type":"number","chain":[{"type":"variableName","refID":"id3"}]}}],"resetVariables":false,"type":"actions"},"_references":{"id0":{"id":"id0","tags":["number"],"data":{"value":"infected","color":[68,0.95,0.81]},"connected":4},"id1":{"id":"id1","tags":["number"],"data":{"value":"total population","color":[321,0.43,1]},"connected":2},"id2":{"id":"id2","tags":["number"],"data":{"value":"non-infected","color":[210,0.8,1]},"connected":2},"id3":{"id":"id3","tags":["number"],"data":{"value":"disease-spreading contacts","color":[260,0.7,1]},"connected":2}}},
	prey: {"start":{"actions":[{"type":"instructions/comment","value":"Let's simulate a basic predator-prey relationship!"},{"type":"graph/number","varname":{"type":"variableName","refID":"id0"},"value":{"type":"number","chain":[{"type":"number_raw","value":2}]}},{"type":"graph/number","varname":{"type":"variableName","refID":"id1"},"value":{"type":"number","chain":[{"type":"number_raw","value":100}]}}],"resetVariables":true,"type":"actions"},"iterations":{"value":169,"type":"number"},"iterate":{"actions":[{"type":"instructions/comment","value":"Rabbits multiply exponentially:"},{"type":"math/operation","operation":{"value":"*","type":"choose"},"varname":{"type":"variableName","refID":"id1"},"value":{"type":"number","chain":[{"type":"number_raw","value":1.03}]}},{"type":"instructions/comment","value":"How many rabbits eaten? The # of all POSSIBLE fox-rabbit encounters is [foxes] x [rabbits], so the # of ACTUAL encounters where a rabbit is eaten, is that number times some small constant."},{"type":"math/set","varname":{"type":"variableName","refID":"id2"},"value":{"type":"number","chain":[{"type":"variableName","refID":"id0"},{"type":"choose","value":"*"},{"type":"variableName","refID":"id1"},{"type":"choose","value":"*"},{"type":"number_raw","value":0.01}]}},{"type":"math/operation","operation":{"value":"-","type":"choose"},"varname":{"type":"variableName","refID":"id1"},"value":{"type":"number","chain":[{"type":"variableName","refID":"id2"}]}},{"type":"instructions/comment","value":"Foxes' reproduction depends on how many rabbits they eat! Since a fox needs to eat more than one rabbit to have the energy to create one new fox, [foxes] increases by [rabbits eaten] times some small constant."},{"type":"math/operation","operation":{"value":"+","type":"choose"},"varname":{"type":"variableName","refID":"id0"},"value":{"type":"number","chain":[{"type":"variableName","refID":"id2"},{"type":"choose","value":"*"},{"type":"number_raw","value":0.2}]}},{"type":"instructions/comment","value":"And finally, some fraction of foxes die at each step."},{"type":"math/set","varname":{"type":"variableName","refID":"id3"},"value":{"type":"number","chain":[{"type":"number_raw","value":0.09},{"type":"choose","value":"*"},{"type":"variableName","refID":"id0"}]}},{"type":"math/operation","operation":{"value":"-","type":"choose"},"varname":{"type":"variableName","refID":"id0"},"value":{"type":"number","chain":[{"type":"variableName","refID":"id3"}]}},{"type":"instructions/comment","value":"P.S: This is the classic Lotka-Volterra model. The population boom-busts aren't supposed to get bigger over time -- that's a \"glitch\" caused by this model being discrete-time, rather than continuous. Will fix later."}],"resetVariables":false,"type":"actions"},"_references":{"id0":{"id":"id0","tags":["number"],"data":{"value":"foxes","color":[29,0.95,1]},"connected":5},"id1":{"id":"id1","tags":["number"],"data":{"value":"rabbits","color":[307,1,1]},"connected":4},"id2":{"id":"id2","tags":["number"],"data":{"value":"rabbits eaten","color":[210,0.8,1]},"connected":3},"id3":{"id":"id3","tags":["number"],"data":{"value":"dead foxes","color":[0,0.6,1]},"connected":2}}},
	blank: {}
};

window.onload = function(){

	// Data
	var model = _getParameterByName("model");
	var data = model ? DEMOS[model] : Joy.loadFromURL();

	// Joy
	window.joy = new Joy({
		
		init: "Let's graph these numbers: {id:'start', type:'actions', onlyActions:['graph/number','instructions/comment']}"+
			  "Do this on each of {id:'iterations', type:'number', min:1, placeholder:50, noVariables:true} steps: "+
			  "{id:'iterate', type:'actions', resetVariables:false, onlyActions:['math/operation','math/set','instructions/comment']}"+
			  "<hr> {type:'save'}",

		data: data,
		container: "#editor",
		modules: ["graph", "math", "instructions"],

		previewActions: true,
		previewNumbers: true,

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
			var stopMessage = my.start.act(obj);
			_log(0);

			// Iterate
			var iterations = my.iterations.get();
			for(var i=0; i<iterations; i++){
				if(stopMessage!="STOP") my.iterate.act(obj);
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
var margin = {top:30, right:75, bottom:50, left:60},
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

// Axis Labels
chart.append("text")
	.attr("transform", "translate(" + (width) + "," + (height+31) + ")")
	.attr("class", "axis-label")
	.style("text-anchor", "end")
	.html("steps &rarr;");
chart.append("text")
	.attr("transform", "translate(" + (-31) + "," + (0) + ") rotate(-90)")
	.attr("class", "axis-label")
	.style("text-anchor", "end")
	.html("number &rarr;");

// Append the Zero
var zero = chart.append("rect")
	.attr("x",0)
	.attr("y",0)
	.attr("width",width)
	.attr("height",100)
	.attr("class", "zero");

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
		.call(
			d3.axisBottom(x).tickFormat(function(e){
        		if(Math.floor(e)!=e) return; // INTEGERS ONLY
        		return e;
        	})
    	);

	// Set the Y Axis
	yAxis.call(d3.axisLeft(y));

	// ZERO
	zero.attr("visibility", (min<0) ? "visible" : "hidden" );
	if(min<0){
		zero.attr("y", y(0))
			.attr("height", y(min-1)-y(0))
	}

}
