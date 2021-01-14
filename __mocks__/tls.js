const { EventEmitter } = require('events');

class Socket extends EventEmitter {
    constructor() {
        super();
        setTimeout(() => {
            this.emit('data', Buffer.from('+OK\r\n'));
        }, 10);
    }
    write(data) {
        const message = data.toString();
        if (message.startsWith('USER')) {
            this.emit('data', Buffer.from('+OK \r\n'));
        } else if (message.startsWith('PASS')) {
            this.emit('data', Buffer.from('+OK Logged in.\r\n'));
        } else if (message.startsWith('QUIT')) {
            this.emit('data', Buffer.from('+OK\r\n'));
        }
    }
    end() {
        setTimeout(() => {
            this.emit('end');
        }, 10);
    }
}

module.exports = {
    connect: () => {
        return new Socket();
    },
};
