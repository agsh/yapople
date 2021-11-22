'use strict';
var net = require('net')
    , util = require('util')
    , tls = require('tls')
;

/**
 * @callback DefaultCallback
 * @param {Error?} error
 * @param {*} data
 */

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
    , TOP: 10,
};

/**
 * POP3 client class
 * @param {object} options
 * @param {string} options.hostname
 * @param {number} options.port
 * @param {boolean} [options.tls] Use TLS
 * @param {Object} [options.tlsOptions] TLS options
 * @constructor
 */
var Client = function(options) {
    this.debug = false;

    /**
     * Mail server hostname
     * @type {string}
     */
    this.host = options.host || options.hostname;
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
     * TLS options
     * @type {object}
     */
    this.options = options.options || {};
    /**
     * socket property
     * @type {null|net.Socket|tls.TLSSocket}
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
        if (sData.substr(0, 3) === '+OK') {
            succ = sData.substring(4, sData.indexOf('\r\n'));
        } else {
            err = new Error(sData.substring(5, sData.indexOf('\r\n')));
        }
        // RETR, LIST and TOP are multiline commands
        if (
            this._command.cmd === state.RETR
            || this._command.cmd === state.LIST && typeof this._command.number === 'undefined'
            || this._command.cmd === state.TOP
        ) {
            if (err) {
                if (this._command.callback) {
                    this._command.callback.call(this, err);
                }
                this._command = { cmd: state.NOOP };
                this._runCommand();
            } else {
                data = data.slice(sData.indexOf('\r\n') + 2); // remove first line of answer
                this.flow = Buffer.allocUnsafe(0); // initialise buffer, all other work is below
            }
        } else if (this._command.cmd === state.USER || this._command.cmd === state.CONNECTING) {
            if (err) {
                this._queue = []; // remove commands from stack
                if (this._command.callback) {
                    this._command.callback.call(this, err);
                }
            } else {
                this._command = { cmd: state.NOOP };
                this._runCommand(); // run PASS or USER command
            }
        } else if (this._command.cmd === state.QUIT) {
            this._socket.removeAllListeners();
            this._socket.end();
            this._socket.once('end', function() {
                this.connected = false;
                if (this._command.callback) {
                  this._command.callback.call(this, null);
                }
                if (this._socket.destroy) {
                    this._socket.destroy(); // socket connection close
                }
            }.bind(this));
        } else {
            if (this._command.cmd === state.PASS && !err) {
                this.connected = true;
            } else if (this._command.cmd === state.STAT) {
                succ = succ.split(' ');
                succ = {
                    count: parseInt(succ[0])
                    , length: parseInt(succ[1]),
                };
            }
            if (this._command.callback) {
                this._command.callback.call(this, err, succ);
            }
            this._command = { cmd: state.NOOP };
            this._runCommand();
        }
    }
    if (typeof this.flow !== 'undefined') { // for first and all next data chunks
        this.flow = Buffer.concat([this.flow, data]); // append chunk to buffer

        if (
            this.flow.slice(this.flow.length - 3).toString() === '.\r\n' ||
            sData.substr(-3) === '.\r\n'
        ) {
            this.flow = this.flow.slice(0, this.flow.length - 5);
            if (this.mailparser) {
                var MailParser = require('mailparser').MailParser
                    , _mailparser = new MailParser()
                ;
            }
            switch (this._command.cmd) {
                case state.RETR:
                    if (this.mailparser) {
                        _mailparser.once('end', this._command.callback.bind(this, null));
                        _mailparser.end(this.flow);
                    } else {
                        this._command.callback.call(this, null, this.flow);
                    }
                    break;
                case state.LIST:
                    var res = {};
                    if (this.flow.length > 2) { // condition for 0 msg count
                        this.flow.toString().split('\r\n').forEach(function (msg) {
                            msg = msg.split(' ');
                            res[msg[0]] = parseInt(msg[1]);
                        });
                    }
                    this._command.callback.call(this, null, res);
                    break;
                case state.TOP:
                    if (this.mailparser) {
                        _mailparser.once('end', this._command.callback.bind(this, null));
                        _mailparser.end(this.flow);
                    } else {
                        this._command.callback.call(this, null, this.flow);
                    }
                    break;
            }
            delete this.flow;
            this._command = { cmd: state.NOOP };
            this._runCommand();
        }
    }
}

/**
 *
 * @param {Object} [options]
 * @param {DefaultCallback} [callback]
 * @returns {Promise<string>}
 */
Client.prototype.connect = function(options, callback) {
    if (callback === undefined) {
        callback = options;
        options = {};
    }
    if (this.connected) {
        return callback(null);
    }
    options = Object.assign({}, { host: this.host, port: this.port }, this.options, options);
    this._command = { cmd: state.CONNECTING, callback: callback };
    this._execute({ cmd: state.USER, callback: callback });
    this._execute({ cmd: state.PASS, callback: callback });
    if (this.tls) {
        this._socket = tls.connect(options, function() {
        }.bind(this));
    } else {
        this._socket = net.createConnection(options, function() {
        }.bind(this));
    }
    this._socket.on('data', onData.bind(this));
    this._socket.on('error', function(err) {
        callback(err);
        this._queue = [];
    }.bind(this));
};

Client.prototype.quit = Client.prototype.disconnect = function(callback) {
    this._execute({ cmd: state.QUIT, callback: callback });
};

Client.prototype._write = function(cmd, args) {
    this._socket.write(cmd + (args !== undefined ? ' ' + args : '') + '\r\n');
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
                this._write('PASS', this.password); break;
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
            case state.TOP:
                this._write('TOP', this._command.number + ' ' + this._command.linesCount); break;
        }
    }
};

Client.prototype._execute = function(fun) {
    this._queue.push(fun);
    this._runCommand();
};

Client.prototype.stat = function(callback) {
    this._execute({ cmd: state.STAT, callback: callback });
};

Client.prototype.list = function(number, callback) {
    if (typeof number === 'function') {
        callback = number;
        number = undefined;
    }
    this._execute({ cmd: state.LIST, callback: callback, number: number });
};

Client.prototype.retr = function(number, callback) {
    this._execute({ cmd: state.RETR, callback: callback, number: number });
};

Client.prototype.dele = function(number, callback) {
    this._execute({ cmd: state.DELE, callback: callback, number: number });
};

Client.prototype.count = function(callback) {
    this.stat(function(err, stat) {
        callback(err, err ? null : stat.count);
    });
};

Client.prototype.rset = function(callback) {
    this._execute({ cmd: state.RSET, callback: callback });
};


/**
 * @private
 */
function _set(who, how, what, callback) {
    if (Array.isArray(what)) {
        if (what.length === 0) {
            return callback(null, []);
        }
        var length = what.length, result = [], error = false;
        what.forEach(function(num) {
            how.call(who, num, function(err, mail) {
                if (err && !error) {
                    error = true;
                    return callback(err);
                } else {
                    result[num] = mail;
                }
                if (!--length && !error) {
                    callback(null, result);
                }
            });
        });
    } else {
        how.call(who, what, callback);
    }
}

/**
 * Create an array of all messages until `count`
 * @param {number} count
 * @returns {Array}
 * @private
 */
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

/**
 * Call prototype function for all messages
 * @param {Client} who
 * @param {function} what
 * @param {function(Error?,*?)} [callback]
 * @private
 */
function _fall(who, what, callback) {
    who.count(function(err, count) {
        if (err) {
            callback(err);
        } else {
            what.call(who, _all(count), callback);
        }
    });
}

/**
 * Retrieve all messages from mailbox
 * @param {function(Error?,Array<object|Buffer>)} [callback]
 */
Client.prototype.retrieveAll = function(callback) {
    _fall(this, Client.prototype.retrieve, callback);
};

/**
 * Delete all messages from mailbox
 * @param {function(Error?)} [callback]
 * @returns {Promise}
 */
Client.prototype.deleteAll = function(callback) {
    _fall(this, Client.prototype.delete, callback);
};

/**
 * Retrieve and delete all messages from mailbox
 * @param {function(Error?, Array<object|Buffer>?)} [callback]
 * @returns {Promise<object|Buffer>}
 */
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

/**
 * Top command
 * @param {number|string} number
 * @param {number|string} linesCount
 * @param {function} [callback]
 */
Client.prototype.top = function(number, linesCount, callback) {
    this._execute({ cmd: state.TOP, callback: callback, number: number, linesCount: linesCount });
};

if (parseInt(process.versions.node.split('.')[0]) >= 8) {
    var callbackConnect = Client.prototype.connect;
    Client.prototype.connect = function(options, callback) {
        var self = this;
        if (typeof options === 'function') {
            return callbackConnect.call(this, options);
        } else {
            if (typeof callback === 'function') {
                return callbackConnect.call(this, options, callback);
            } else {
                return new Promise(function(resolve, reject) {
                    callbackConnect.call(self, function(err, data) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(data);
                        }
                    });
                });
            }
        }
    };
    Client.prototype.disconnect = util.promisify(Client.prototype.disconnect);
    Client.prototype.stat = util.promisify(Client.prototype.stat);
    Client.prototype.list = util.promisify(Client.prototype.list);
    Client.prototype.retr = util.promisify(Client.prototype.retr);
    Client.prototype.dele = util.promisify(Client.prototype.dele);
    Client.prototype.count = util.promisify(Client.prototype.count);
    Client.prototype.rset = util.promisify(Client.prototype.rset);
    Client.prototype.retrieve = util.promisify(Client.prototype.retrieve);
    Client.prototype.retrieveAll = util.promisify(Client.prototype.retrieveAll);
    Client.prototype.delete = util.promisify(Client.prototype.delete);
    Client.prototype.deleteAll = util.promisify(Client.prototype.deleteAll);
    Client.prototype.retrieveAndDeleteAll = util.promisify(Client.prototype.retrieveAndDeleteAll);
    Client.prototype.top = util.promisify(Client.prototype.top);
}

exports.Client = Client;
