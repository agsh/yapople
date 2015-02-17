'use strict';
var net = require('net')
	, util = require('util')
	, EventEmitter = require('events').EventEmitter
	, tls = require('tls')
	, fs = require('fs')
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
	, DELE: 7
	, QUIT: 8
	, RSET: 9
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
	this.mailparser = options.mailparser || false;
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
		, sData = data.toString()
		;
	if (typeof this.flow === 'undefined') { // if we have first data chunk from server
		this.log('data on state: ' + Object.keys(state)[this._command.cmd]);
		this.log(sData);
		if (sData.substr(0, 4) === '-ERR') {
			err = sData.substring(5, sData.indexOf('\r\n'));
		} else if (sData.substr(0, 3) === '+OK') {
			succ = sData.substring(4, sData.indexOf('\r\n'));
		} else {
			err = sData;
		}

		if (this._command.cmd === state.RETR) {
			// extract first line of answer
			sData = sData.slice(sData.indexOf('\r\n') + 2);

			if (err) {
				console.log('err: ', err);
				if (this._command.callback) {
					this._command.callback.call(this, err);
				}
				this._command = {cmd: state.NOOP};
				this._runCommand();
			} else {
				this.flow = '';
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
		} else if (this._command.cmd === state.QUIT) {
			if (this._command.callback) {
				this._command.callback.call(this, err);
			}
			this._socket.end();
		} else {
			if (this._command.callback) {
				this._command.callback.call(this, err, succ);
			}
			this._command = {cmd: state.NOOP};
			this._runCommand();
		}
	}
	if (typeof this.flow !== 'undefined') {
		this.flow += sData;
		if (this.flow.slice(this.flow.length - 5) === '\r\n.\r\n') {
			this.flow = this.flow.slice(0, this.flow.length - 5);
			if (this.mailparser) {
				var MailParser = require('mailparser').MailParser
					, _mailparser = new MailParser()
					;
				_mailparser.on('end', this._command.callback.bind(this, null));
				_mailparser.end(this.flow);
			} else {
				this._command.callback.call(this, null, this.flow);
			}
			delete this.flow;
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

Client.prototype.quit = Client.prototype.disconnect = function(callback) {
	this._execute({cmd: state.QUIT, callback: callback});
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
			case state.DELE:
				this._write('DELE', this._command.number); break;
			case state.QUIT:
				this._write('QUIT'); break;
			case state.RSET:
				this._write('RSET'); break;
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

// TODO LIST is a streaming command
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

Client.prototype.dele = function(number, callback) {
	this._execute({cmd: state.DELE, callback: callback, number: number});
};

Client.prototype.count = function(callback) {
	this.stat(function(err, stat) {
		callback(err, err ? null : parseInt(stat.split(' ')[0]));
	})
};

Client.prototype.rset = function(callback) {
	this._execute({cmd: state.RSET, callback: callback});
};

function _set(who, how, what, callback) {
	if (Array.isArray(what)) {
		var length = what.length, result = [], error = false;
		what.forEach(function(num) {
			how.call(who, num, function(err, mail) {
				if (err) {
					error = true;
					callback(err);
				} else {
					result.push(mail);
				}
				if (!--length && !error) {
					callback(null, result);
				}
			})
		}.bind(this));
	} else {
		how.call(who, what, callback);
	}
}

Client.prototype.retrieve = function(what, callback) {
	_set(this, Client.prototype.retr, what, callback);
};

exports.Client = Client;