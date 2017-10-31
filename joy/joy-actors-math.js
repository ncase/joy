/////////////////////////////////////////
// MATH ACTORS //////////////////////////
/////////////////////////////////////////

Joy.add({
	name: "Set [thing] to [number]",
	type: "math/var",
	tags: ["numbers", "action"],
	widget: "Set {data:'varname', type:'variableName', variableType:'number'} to {data:'value', type:'number'}",
	act: function(topdata, data, target){
		var vars = target._vars;
		var varname = data.varname; // it's just a synchronized string
		vars[varname] = data.value; // Set the variable
	}
});

Joy.add({
	
	name: "Do math to [thing]",
	type: "math/var/op",
	tags: ["numbers", "action"],

	widget: JSON.stringify({
		data:'operation', type:'choose',
		placeholder: "+",
		options:[
			{ label:"+ Increase", value:"+" },
			{ label:"- Decrease", value:"-" },
			{ label:"&times; Multiply", value:"*" },
			{ label:"&divide; Divide", value:"/" }
		]
	})+" {data:'varname', type:'variableName', variableType:'number'}"
	+" by {data:'value', type:'number'}",

	act: function(topdata, data, target){

		var vars = target._vars;
		var varname = data.varname;
		if(vars[varname]===undefined) vars[varname]=0; // Set to 0, if nothing's there.

		switch(data.operation){
			case "+": vars[varname] += data.value; break;
			case "-": vars[varname] -= data.value; break;
			case "*": vars[varname] *= data.value; break;
			case "/": vars[varname] /= data.value; break;
		}

	}

});
