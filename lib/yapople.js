'use strict';
var net = require('net')
	, util = require('util')
	, EventEmmitter = require('events').EventEmitter
	;

/**
 * connection states
 * @readonly
 * @enum {number}
 */
var state = {
	NOOP: 0
	, CONNECTING: 1
};

/**
 * POP3 client class
 * @param {object} options
 * @param {string} options.hostname
 * @param {number} options.port
 * @constructor
 */
var Client = function(options) {
	/**
	 * mail server hostname
	 * @type {string}
	 */
	this.hostname = options.hostname;
	/**
	 * mail server port
	 * @type {number}
	 */
	this.port = options.port;
	/**
	 * socket property
	 * @type {null|net.Socket}
	 * @private
	 */
	this._socket = null;
	/**
	 * command stack
	 * @type {Array}
	 * @private
	 */
	this._queue = [];
	this.state = state.NOOP;
	this.connect()
};

util.inherits(Client, EventEmmitter);

function onData(data) {
	switch (this.state) {
		case state.CONNECTING:
			console.log('connecting');
			break;
	}
	console.log(data.toString());
}

Client.prototype.connect = function(callback) {
	this.state = state.CONNECTING;
	var socket = this._socket = net.createConnection(this.port, this.hostname, function() {
		console.log('> connected');
	});
	socket.on('data', onData.bind(this));
	socket.on('error', function(err) {
		this.emit('error', err);
	}.bind(this));
};

Client.prototype._runCommand = function() {
	if (this.state === state.NOOP && this._queue.length) {
		var cmd = this._queue.shift();

	}
};

Client.prototype.login = function(callback) {
	console.log('USER', this.username);
	this._socket.write('USER', this.username);
};

exports.Client = Client;