const { EventEmitter } = require('events');

class Socket extends EventEmitter {
    constructor() {
        super();
        setTimeout(() => {
            this.emit('data', Buffer.from('+OK\r\n'));
        }, 10);
    }
    write() {
        this.emit('data', Buffer.from('-ERR POP3 is available only with SSL or TLS connection enabled\r\n'));
    }
}

module.exports = {
    createConnection: () => {
        return new Socket();
    },
};
