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
	, USER: 2
	, PASS: 3
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

	this.debug = true;

	/**
	 * mail server hostname
	 * @type {string}
	 */
	this.hostname = options.hostname;
	/**
	 * mail server port
	 * @type {number}
	 */
	this.port = options.port || 110;
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
	this._command = { cmd: state.NOOP };
	// this.connect()
};

util.inherits(Client, EventEmitter);

function onData(data) {
	var err = null
		, suc = ''
		;
	data = data.toString();
	console.log('data on state: ' + Object.keys(state)[this._command.cmd]);
	console.log(data);
	if (data.substr(0, 4) === '-ERR') {
		err = data.substring(5, data.length - 2);
	} else if (data.substr(0, 3) === '+OK') {
		suc = data.substr(4);
	} else {
		err = data;
	}
	switch (this._command.cmd) {
		case state.CONNECTING:
			if (this._command.callback) {
				this._command.callback.call(this, err, suc);
			}
			break;
		case state.USER:
			if (err) {
				this._command.callback.call(this, err);
			}
			break;
		case state.PASS:
			if (this._command.callback) {
				this._command.callback.call(this, err, suc);
			}
			break;
	}
	this._command = { cmd: state.NOOP };
	this._runCommand();
}

Client.prototype.connect = function(callback) {
	this._command = {cmd: state.CONNECTING, callback: callback};
	var socket = this._socket = net.createConnection(this.port, this.hostname, function() {
		console.log('> connected');
		// this.login();
	}.bind(this));
	socket.on('data', onData.bind(this));
	socket.on('error', function(err) {
		this.emit('error', err);
	}.bind(this));
};

Client.prototype._write = function(cmd, args) {
	if (this.debug) {
		console.log(cmd, args);
	}
	this._socket.write(cmd + ' ' + args + '\r\n');
};

Client.prototype._runCommand = function() {
	if (this._command.cmd === state.NOOP && this._queue.length) {
		this._command = this._queue.shift();
		switch (this._command.cmd) {
			case state.USER:
				this._write('USER', this.username); break;
			case state.PASS:
				this._write('PASS', this.password);	break;
		}
	}
};

Client.prototype._execute = function(fun) {
	this._queue.push(fun);
	this._runCommand();
};

Client.prototype.login = function(callback) {
	this._execute({cmd: state.USER, callback: callback});
	this._execute({cmd: state.PASS, callback: callback})
};

exports.Client = Client;