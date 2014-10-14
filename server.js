var WebSocketServer = require("ws").Server;
var http = require("http");
var pretty = require("prettyjson");
var express = require("express");
var app = express();
var port = process.env.PORT || 5000;
var shell = require('shelljs');
var packageName = process.argv[2] || 'com.test'; // PACKAGE NAME OF YOUR APP
var previousOutput = '';

var runExp = new RegExp("Run.*"+packageName+"\/(.*) t", "g");
var stopExp = new RegExp("Stop.*"+packageName+"\/(.*) t", "g");
var waitExp = new RegExp("Wait.*"+packageName+"\/(.*) t", "g");
var pauseExp = new RegExp("mPausingActivity.*"+packageName+"\/(.*) t", "g");
var resumeExp = new RegExp("mResumedActivity.*"+packageName+"\/(.*) t", "g");
var focusedExp = new RegExp("mFocusedActivity.*"+packageName+"\/(.*) t", "g");

app.use(express.static(__dirname + "/"));

var server = http.createServer(app);
server.listen(port);

console.log("http server listening on %d", port);

var wss = new WebSocketServer({server: server});
console.log("websocket server created");

wss.on("connection", function(ws) {
  var id = setInterval(function() {
	shell.exec('adb shell dumpsys activity package ' + packageName, {silent:true}, function(code, output) {
	  if(code == 0) {
	    if(previousOutput !== output) {
		    // var result = output.substring(output.indexOf(startPattern) + startPattern.length);
		    var result = output;
		    var obj = {
	    		running : {
	    			description : "Running activities (most recent first):",
	    			values : matcher(result, runExp)
	    		},
	    		stopping : {
	    			description : "Activities waiting to stop:",
	    			values : matcher(result, stopExp)
	    		},
	    		waiting : {
	    			description : "Activities waiting for another to become visible:",
	    			values : matcher(result, waitExp)
	    		},
	    		paused : {
	    			description : "Activities paused:",
	    			values : matcher(result, pauseExp)
	    		},
	    		resumed : {
	    			description : "Activities resumed:",
	    			values : matcher(result, resumeExp)
	    		},
	    		focused : {
	    			description : "Activities focused:",
	    			values : matcher(result, focusedExp)
	    		},
		    };
		    ws.send(pretty.render(obj, {noColor:true}), function() {  })
		    previousOutput = output;
	    }
	  }
	});
}, 500);

  console.log("websocket connection open");

  ws.on("close", function() {
    console.log("websocket connection close")
    clearInterval(id)
  });
});

function call() {
	shell.exec('adb shell dumpsys activity package ' + packageName, {silent:true}, function(code, output) {
	  if(code == 0) {
	    if(previousOutput !== output) {
		    var startPattern = 'Running activities (most recent first):';
		    var result = output.substring(output.indexOf(startPattern) + startPattern.length);
		    var obj = {
	    		running : {
	    			description : "Running activities (most recent first):",
	    			values : matcher(result, runExp)
	    		},
	    		stopping : {
	    			description : "Activities waiting to stop:",
	    			values : matcher(result, stopExp)
	    		},
	    		waiting : {
	    			description : "Activities waiting for another to become visible:",
	    			values : matcher(result, waitExp)
	    		},
	    		paused : {
	    			description : "Activities paused:",
	    			values : matcher(result, pauseExp)
	    		},
	    		resumed : {
	    			description : "Activities resumed:",
	    			values : matcher(result, resumeExp)
	    		},
	    		focused : {
	    			description : "Activities focused:",
	    			values : matcher(result, focusedExp)
	    		},
		    };
		    ws.send(JSON.stringify(obj, undefined, 2) , function() {  })
		    previousOutput = output;
	    }
	  }
	});
}

function matcher(data, regex) {
	var result = []; 
	var match = regex.exec(data);
	while (match != null) {
		var splittedArray = match[1].split(".");
	    result.push(splittedArray[splittedArray.length-1]);
	    match = regex.exec(data);
	}
	return result;
}
