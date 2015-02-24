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
	 * Connected state
	 * @type {boolean}
	 */
	this.connected = false;
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
		if (this._command.cmd === state.RETR || this._command.cmd === state.LIST && typeof this._command.number === 'undefined') {
			// extract first line of answer
			sData = sData.slice(sData.indexOf('\r\n') + 2);

			if (err) {
				if (this._command.callback) {
					this._command.callback.call(this, err);
				}
				this._command = {cmd: state.NOOP};
				this._runCommand();
			} else {
				this.flow = '';
			}
		} else if (this._command.cmd === state.USER || this._command.cmd === state.CONNECTING) {
			if (err) {
				this._queue = []; // remove commands from stack
				if (this._command.callback) {
					this._command.callback.call(this, err);
				}
			} else {
				this._command = {cmd: state.NOOP};
				this._runCommand(); // run PASS or USER command
			}
		} else if (this._command.cmd === state.QUIT) {
			this._socket.end();
			this.connected = false;
			if (this._command.callback) {
				this._command.callback.call(this, err);
			}
		} else {
			if (this._command.cmd === state.PASS && !err) {
				this.connected = true;
			}
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

			if (this._command.cmd === state.RETR) {
				if (this.mailparser) {
					var MailParser = require('mailparser').MailParser
						, _mailparser = new MailParser()
						;
					_mailparser.on('end', this._command.callback.bind(this, null));
					_mailparser.end(this.flow);
				} else {
					this._command.callback.call(this, null, this.flow);
				}
			} else if (this._command.cmd === state.LIST) {
				var res = {};
				this.flow.split('\r\n').forEach(function(msg) {
					msg = msg.split(' ');
					res[msg[0]] = parseInt(msg[1]);
				});
				this._command.callback.call(this, null, res);
			}

			delete this.flow;
			this._command = {cmd: state.NOOP};
			this._runCommand();
		}
	}
}

Client.prototype.connect = function(callback) {
	if (this.connected) {
		return callback(null);
	}
	this._command = {cmd: state.CONNECTING, callback: callback};
	this._execute({cmd: state.USER, callback: callback});
	this._execute({cmd: state.PASS, callback: callback});
	if (this.tls) {
		this._socket = tls.connect(this.port, this.hostname, function() {
		}.bind(this));
	} else {
		this._socket = net.createConnection(this.port, this.hostname, function() {
		}.bind(this));
	}
	this._socket.on('data', onData.bind(this));
	this._socket.on('error', function(err) {
		callback(err);
		this._queue = [];
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
		if (!this.connected && this._command.cmd !== state.USER && this._command.cmd !== state.PASS) {
			if (this._command.callback) {
				this._command.callback(new Error('Not connected to the mail server.'));
			}
			return;
		}
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
				if (err && !error) {
					error = true;
					callback(err);
				} else {
					result.push(mail);
				}
				if (!--length && !error) {
					callback(null, result);
				}
			})
		});
	} else {
		how.call(who, what, callback);
	}
}

function _all(count) {
	var result = [];
	for (var i = 1; i <= count; i++) {
		result.push(i);
	}
	return result;
}

Client.prototype.retrieve = function(what, callback) {
	_set(this, Client.prototype.retr, what, callback);
};

Client.prototype.delete = function(what, callback) {
	_set(this, Client.prototype.dele, what, function(err, data) {
		if (err) {
			this.rset(function(rsetErr) {
				callback(rsetErr || err);
			});
		} else {
			callback(err, data);
		}
	}.bind(this));
};

function _fall(who, what, callback) {
	who.count(function(err, count) {
		if (err) {
			callback(err);
		} else {
			what.call(who, _all(count), callback);
		}
	});
}

Client.prototype.retrieveAll = function(callback) {
	_fall(this, Client.prototype.retrieve, callback);
};

Client.prototype.deleteAll = function(callback) {
	_fall(this, Client.prototype.delete, callback);
};

Client.prototype.retrieveAndDeleteAll = function(callback) {
	this.count(function(err, count) {
		if (err) {
			callback(err);
		} else {
			var nums = _all(count);
			this.retrieve(nums, function(err, msgs) {
				if (err) {
					this.rset(function(rsetErr) {
						callback(rsetErr || err);
					});
				} else {
					this.delete(nums, function(err) {
						callback(err, msgs);
					});
				}
			}.bind(this));
		}
	}.bind(this));
};

exports.Client = Client;