'use strict';
var net = require('net')
	, util = require('util')
	, EventEmitter = require('events').EventEmitter
	;

/**
 * connection states
 * @readonly
 * @enum {number}
 */
var state = {
	NOOP: 0
	, CONNECTING: 1
	, LOGIN: 2
};

/**
 * POP3 client class
 * @param {object} options
 * @param {string} options.hostname
 * @param {number} options.port
 * @constructor
 */
var Client = function(options) {
	EventEmitter.call(this);
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
	this.username = options.username;
	this.password = options.password;
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

util.inherits(Client, EventEmitter);

function onData(data) {
	console.log('data on state: ' + Object.keys(state)[this.state]);
	console.log(data.toString());
	switch (this.state) {
		case state.CONNECTING:
			console.log('connected: ' + data.toString());
			this.state = state.NOOP;
			this._runCommand();
			break;
	}
}

Client.prototype.connect = function(callback) {
	this.state = state.CONNECTING;
	var socket = this._socket = net.createConnection(this.port, this.hostname, function() {
		console.log('> connected');
		this.login();
	}.bind(this));
	socket.on('data', onData.bind(this));
	socket.on('error', function(err) {
		this.emit('error', err);
	}.bind(this));
};

Client.prototype._runCommand = function() {
	console.log('run command');
	if (this.state === state.NOOP && this._queue.length) {
		var command = this._queue.shift();
		this.state = command.cmd;
		switch (command.cmd) {
			case state.LOGIN:
				console.log('USER', this.username);
				this._socket.write('USER ' + this.username + '\n');
				break;
		}
	}
};

Client.prototype._execute = function(fun) {
	this._queue.push(fun);
	this._runCommand();
};

Client.prototype.login = function(callback) {
	this._execute({cmd: state.LOGIN, callback: callback});
};

exports.Client = Client;