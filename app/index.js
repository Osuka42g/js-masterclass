/*
 * Primary file for the API
 * 
 */

// Dependencies
var http = require("http");
var url = require("url");
var StringDecoder = require("string_decoder").StringDecoder;
var config = require("./config");

var server = http.createServer(function(req, res) {

    var parsedUrl = url.parse(req.url, true);

    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/\/+|\/+$/g, "");

    var queryStringObject = parsedUrl.query;

    var method = req.method.toLowerCase();

    var headers = req.headers;

    var decoder = new StringDecoder("utf-8");
    var buffer = "";
    
    req.on("data", function(data) {
         buffer += decoder.write(data);
    });

    req.on("end", function() {
        buffer += decoder.end();

        var chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        var data = {
            trimmedPath, queryStringObject,
            method,
            headers,
            payload: buffer
        };

        chosenHandler(data, function(statusCode, payload) {
            statusCode = typeof(statusCode) === "number" ? statusCode : 200;
            
            payload = typeof(payload) === "object" ? payload : {};

            var payloadString = JSON.stringify(payload);

            res.setHeader("Content-Type", "application/json");
            res.writeHead(statusCode);
            
            res.end(payloadString);
            
            console.log("Returning response:", statusCode, payloadString);
        });
    });

});

server.listen(config.port, function() {
    console.log("The server is listening on port " + config.port + " in " + config.envName + " mode");
});

var handlers = {};

handlers.sample = function(data, callback) {
    callback(406, {"name": "sample handler"});
};

handlers.notFound = function(data, callback) {
    callback(404);
};

var router = {
    sample: handlers.sample
};