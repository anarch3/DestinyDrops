var config = require('./config.json');

var colors = require('colors');
var fs = require('fs');
var cluster = require('cluster');
var os = require('os');

var Website = require('./lib/workers/website.js');

try {
    var posix = require('posix');
    try {
        posix.setrlimit('nofile', {
            soft: 100000,
            hard: 100000
        });
    } catch (e) {
        if (cluster.isMaster)
            logging('Init','debug', 'POSIX', 'Connection Limit', '(Safe to ignore) Must be ran as root to increase resource limits');
    } finally {
        // Find out which user used sudo through the environment variable
        var uid = parseInt(process.env.SUDO_UID);
        // Set our server's uid to that user
        if (uid) {
            process.setuid(uid);
            logging('Init', 'debug', 'POSIX', 'Connection Limit', 'Raised to 100K concurrent connections, now running as non-root user: ' + process.getuid());
        }
    }
} catch (e) {
    if (cluster.isMaster)
        console.log('POSIX Connection Limit (Safe to ignore) POSIX module not installed and resource (connection) limit was not raised');
}

if (cluster.isWorker) {
    switch (process.env.workerType) {
        case 'website':
            new Website();
            break;
    }

    return;
}

function startWebsite() {
    if (!config.website.enabled) return;

    var worker = cluster.fork({
        workerType: 'website',
        config: JSON.stringify(config)
    });
    worker.on('exit', function(code, signal) {
        logging('Website', 'error', 'Website process died, spawning replacement...')
        setTimeout(function() {
            startWebsite(config);
        }, 2000);
    });
}

function createEmptyLogs() {
    try {
        fs.readFileSync('./logs/blocks.json')
    } catch (err) {
        if (err.code === "ENOENT") {
            fs.writeFileSync('./logs/blocks.json', '[]');
        } else {
            throw err;
        }
    }
}

(function init() {
	createEmptyLogs();
	startWebsite();
})();
