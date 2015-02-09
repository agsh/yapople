'use strict';
var net = require('net')
	, util = require('util')
	, EventEmitter = require('events').EventEmitter
	, tls = require('tls')
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
	, STAT: 4
	, LIST: 5
	, RETR: 6
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

	this.debug = false;

	/**
	 * Mail server hostname
	 * @type {string}
	 */
	this.hostname = options.hostname;
	/**
	 * Mail server port
	 * @type {number}
	 */
	this.port = options.port || 110;
	this.username = options.username;
	this.password = options.password;
	/**
	 * Use TLS
	 * @type {boolean}
	 */
	this.tls = options.tls || false;
	/**
	 * socket property
	 * @type {null|net.Socket}
	 * @private
	 */
	this._socket = null;
	/**
	 * Command stack
	 * @type {Array}
	 * @private
	 */
	this._queue = [];
	this._command = { cmd: state.NOOP };
	// this.connect()
};

util.inherits(Client, EventEmitter);

Client.prototype.log = function() {
	if (this.debug) {
		console.log.apply(console, arguments);
	}
};

/**
 * Data event handler
 * @param {Buffer} data
 */
function onData(data) {
	var err = null
		, succ = ''
		, sData = ''
		;
	if (this.flow) {
		this.flow.chunks.push(data);
		this.flow.length += data.length;
		if (data.slice(data.length - 5).toString() === '\r\n.\r\n') {
			sData = Buffer.concat(this.flow.chunks, this.flow.length).toString();
			switch (this._command.cmd) {
				case state.RETR:
					delete this.flow;
					if (this._command.callback) {
						this._command.callback.call(this, err, sData);
					}
					this._command = {cmd: state.NOOP};
					this._runCommand();
					break;
			}
		}
	} else {
		sData = data.toString();
		this.log('data on state: ' + Object.keys(state)[this._command.cmd]);
		this.log(data);
		if (sData.substr(0, 4) === '-ERR') {
			err = sData.substring(5, sData.length - 2);
		} else if (sData.substr(0, 3) === '+OK') {
			succ = sData.substring(4, sData.length - 2);
		} else {
			err = sData;
		}

		if (this._command.cmd === state.RETR) {
			if (err) {
				if (this._command.callback) {
					this._command.callback.call(this, err);
				}
				this._command = {cmd: state.NOOP};
				this._runCommand();
			} else {
				this.flow = {
					chunks: []
					, length: 0
				};
			}
		} else if (this._command.cmd === state.USER) {
			if (err) {
				this._queue.shift(); // remove pass command from stack
				if (this._command.callback) {
					this._command.callback.call(this, err);
				}
			} else {
				this._command = {cmd: state.NOOP};
				this._runCommand(); // run PASS command
			}
		} else {
			if (this._command.callback) {
				this._command.callback.call(this, err, succ);
			}
			this._command = {cmd: state.NOOP};
			this._runCommand();
		}
	}
}

Client.prototype.connect = function(callback) {
	this._command = {cmd: state.CONNECTING, callback: callback};
	if (this.tls) {
		this._socket = tls.connect(this.port, this.hostname, function() {
			this.log('> secure connected');
		}.bind(this));
	} else {
		this._socket = net.createConnection(this.port, this.hostname, function() {
			this.log('> connected');
		}.bind(this));
	}
	this._socket.on('data', onData.bind(this));
	this._socket.on('error', function(err) {
		this.emit('error', err);
	}.bind(this));
};

Client.prototype.disconnect = function() {
	this._socket.end();
};

Client.prototype._write = function(cmd, args) {
	this.log(cmd, args);
	this._socket.write(cmd + (args ? ' ' + args : '') + '\r\n');
};

Client.prototype._runCommand = function() {
	if (this._command.cmd === state.NOOP && this._queue.length) {
		this._command = this._queue.shift();
		switch (this._command.cmd) {
			case state.USER:
				this._write('USER', this.username); break;
			case state.PASS:
				this._write('PASS', this.password);	break;
			case state.STAT:
				this._write('STAT'); break;
			case state.LIST:
				this._write('LIST', this._command.number); break;
			case state.RETR:
				this._write('RETR', this._command.number); break;
			default:
				this.log('unreq command: ' + this._command);
		}
	}
};

Client.prototype._execute = function(fun) {
	this._queue.push(fun);
	this._runCommand();
};

Client.prototype.login = function(callback) {
	this._execute({cmd: state.USER, callback: callback});
	this._execute({cmd: state.PASS, callback: callback});
};

Client.prototype.stat = function(callback) {
	this._execute({cmd: state.STAT, callback: callback});
};

Client.prototype.list = function(number, callback) {
	if (typeof number === 'function') {
		callback = number;
		number = undefined;
	}
	this._execute({cmd: state.LIST, callback: callback, number: number});
};


Client.prototype.retr = function(number, callback) {
	this._execute({cmd: state.RETR, callback: callback, number: number});
};

exports.Client = Client;