var code = {};
var maxTime = 0;
var actions = [];
var activeNodes = [];

var refreshMaxTime = function() {
	$('#spanMaxTime').text(maxTime);
};

var sortNumDescending = function(a) {
	return a.sort(function (a, b) { return b - a; });
};

var display = function(time) {
	var headerNode = $('<td>').text("Node");
	var headerInst = $('<td>').text("Instruction");
	var headerVal = $('<td>').text("Value Analysis");
	var headerRow = $('<tr>');
	headerRow.append(headerNode);
	headerRow.append(headerInst);
	headerRow.append(headerVal);
	var table = $('<table>');
	table.append(headerRow);
	var nodes = sortNumDescending(Object.keys(code).map(function (s) { return parseInt(s, 10); }));
	for (var i = 0, n = nodes.length; i < n; i++) {
		var node = nodes[i];
		var inst = code[node].inst;
		var va = code[node].va[time];
		if (va === undefined) {
			var lastUpdate = time;
			while (lastUpdate > 0 && code[node].va[lastUpdate] === undefined) {
				lastUpdate--;
			}
			va = code[node].va[lastUpdate];
		}
		//console.log("got va for curTime = " + time + ", va:" + va);
		var row = $('<tr>');
		row.append($('<td>').text(node));
		row.append($('<td>').text(inst));
		row.append($('<td>').text(va));
		if (activeNodes[time] == node) {
			row.addClass("highlight");
		}
		table.append(row);
	}
	//console.log("table = " + table);
	$('#result').empty();
	$('#result').append(table);
	$('#curAction').text(actions[time]);
};

var displayCurTime = function() {
	display(parseInt($('#curTime').val(),10));
};

var incTime = function() {
	var before = parseInt($('#curTime').val(),10);
	if (before >= maxTime) {
		before = -1;
	}
	$('#curTime').val(before+1);
	displayCurTime();
};

var decTime = function() {
	var before = parseInt($('#curTime').val(),10);
	if (before <= 0) {
		before = maxTime+1;
	}
	$('#curTime').val(before-1);
	displayCurTime();
};

var inputRtl = function() {
	var src = $('#rtlSource').val();
	srcLines = src.split(/\r?\n/);
	code = {};
	var n = srcLines.length;
	console.log("reading " + n + " source lines...");
	for (var i = 0; i < n; i++) {
		line = srcLines[i];
		if (line.match(/^\s*$/)) // Blank line
			continue;
		var parts = line.match(/^\s+(\d+):(.*)$/);
		if (parts === null) {
			console.log("Error: could not parse RTL line #" + i + ": " + line);
			continue;
		}
		var node = parts[1]; // Code is a STRING, not a number
		var inst = parts[2];
		code[node] = {};
		code[node].inst = inst;
		code[node].va = [];
		code[node].va[0] = "Bottom";
		//console.log("node = " + node + ", inst = " + inst);
	}
	console.log(n + " line(s) read.");
	display(0);
};

var inputVa = function() {
	var src = $('#vaSource').val();
	srcLines = src.split(/\r?\n/);
	var curMaxTime = 0;
	actions = [];
	activeNodes = [];
	for (var i = 0, n = srcLines.length; i < n; i++) {
		line = srcLines[i];
		if (line.match(/^\s*$/)) // Blank line
			continue;
		var parts = line.match(/^\s*time\s+(\d+):\s*node\s+(\d+): ([^:]+): \{(.*)\}$/);
		if (parts === null) {
			console.log("Error: could not parse VA trace line #" + i + ": " + line);
			continue;
		}
		var time = parseInt(parts[1],10);
		var node = parts[2];
		var action = parts[3];
		var val = parts[4];
		actions[time] = action + "(" + node + "): " + val;
		activeNodes[time] = node;
		if (!code[node]) {
			alert("Error: node " + node + " not found in RTL code.");
			return;
		}
		//TODO: use 'action'
		code[node].va[time] = val;
		//console.log("time = " + time);
		//console.log("node = " + node);
		//console.log("val = " + val);
		if (time > curMaxTime) curMaxTime = time;
	}
	maxTime = curMaxTime;
	refreshMaxTime();
	$('#curTime').val(maxTime);
	displayCurTime();
};
