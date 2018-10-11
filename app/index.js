/*
 * Primary file for the API
 * 
 */

// Dependencies
var http = require("http");
var https = require("https");
var url = require("url");
var StringDecoder = require("string_decoder").StringDecoder;
var config = require("./config");
var fs = require("fs");
var handlers = require("./lib/handlers");
var helpers = require("./lib/helpers")


// Instanciate HTTP Server
var httpServer = http.createServer(function(req, res) {
    unifiedServer(req, res);
});

// Start HTTP Server
httpServer.listen(config.httpPort, function() {
    console.log("The HTTP server is listening on port " + config.httpPort);
});

var httpsServerOptions = {
    key: fs.readFileSync("./https/key.pem"),
    cert: fs.readFileSync("./https/cert.pem")
};

// Instanciate HTTPS Server
var httpsServer = https.createServer(httpsServerOptions, function (req, res) {
    unifiedServer(req, res);
});

// Start HTTPS Server
httpsServer.listen(config.httpsPort, function () {
    console.log("The HTTPS server is listening on port " + config.httpsPort);
});

// All the server logic for both the http and https server
var unifiedServer = function(req, res) {
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
            trimmedPath,
            queryStringObject,
            method,
            headers,
            payload: helpers.parseJsonToObject(buffer)
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
};

var router = {
    ping: handlers.ping,
    users: handlers.users,
    tokens: handlers.tokens,
    checks: handlers.checks
};