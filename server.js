var http = require('http');
var express = require('express');
var router = express();
var server = http.createServer(router);

var controllers = require('./Controllers');

router.get('/foo', controllers.foo);

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  var addr = server.address();
  console.log("listening at", addr.address + ":" + addr.port);
});

// zipCode取得後にコントローラを書き換える
var promises = require('./promises');
promises.zipCode.then(function(response) {
  controllers.getControllerObject.set(function(req, res) {
    res.send(response);
  });
});
