var fs = require('fs');
var path = require('path');
var express = require('express');
var engine = require('express-dot-engine');
var async = require('async');

var logging = require('../modules/logging.js');

module.exports = function() {
	var config = JSON.parse(process.env.config);
	var websiteConfig = config.website;
	
	var app = express();
	
	app.engine('dot', engine.__express);
    app.set('views', path.join(process.cwd() + '/website/public'));
    app.set('view engine', 'dot');

	app.get('/', function(req, res) {
		res.render('index', {});
	});
	
	app.get('/api', function(req, res) {
        res.render('api', {});
	});
	
	app.get('/data.json', function(req, res) {
        res.sendFile(process.cwd() + '/logs/data.json');
	});
	
	app.get('/main.js', function(req, res) {
        res.sendFile(process.cwd() + '/website/public/main.js');
	});
	
	var server = app.listen(websiteConfig.port, function() {
		var host = websiteConfig.host;
		var port = server.address().port;
		
		logging("Website", "debug", "Example app listening at http://" + host + ":" + port);
	});
};