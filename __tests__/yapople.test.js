const { Client } = require('../lib/yapople');

jest.mock('tls');
jest.mock('net');

describe('integration tests for callback style', () => {
    let count = 0;

    beforeAll(() => {
        jest.setTimeout(60000);
    });

    const options = {
        hostname: 'pop.mail.ru',
        port: 110,
        username: 'yapople@bk.ru',
        password: 'elpopayelpopayelpopayelpopay',
    };
    const tlsOptions = {
        hostname: 'pop.mail.ru',
        port:  995,
        tls: true,
        username: 'yapople@bk.ru',
        password: 'elpopayelpopayelpopayelpopay',
    };

    describe('connect', () => {

        it('should not executes commands not being connected', (done) => {
            const client = new Client(options);
            client.list((err) => {
                expect(err).not.toBe(null);
                done();
            });
        });

        it('should not login to TLS server without tls option', (done) => {
            const client = new Client(options);
            client.connect((err) => {
                expect(err).not.toBe(null);
                expect(err.message).toBe('POP3 is available only with SSL or TLS connection enabled');
                done();
            });
        });

        it('should login to TLS server with tls option', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err, data) => {
                expect(err).toBe(null);
                expect(data).toBe('Logged in.');
                client.disconnect(done);
            });
        });

        it('should login to TLS server with tls option in connect argument', (done) => {
            const client = new Client(tlsOptions);
            client.connect(tlsOptions, (err, data) => {
                expect(err).toBe(null);
                expect(data).toBe('Logged in.');
                client.disconnect(done);
            });
        });

        it('should login to TLS server with promise-based approach', async () => {
            const client = new Client(tlsOptions);
            const message = await client.connect();
            expect(message).toBe('Logged in.');
            await client.disconnect();
        });

    });

    describe('stat command', () => {
        it('returns message stat count', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err) => {
                expect(err).toBe(null);
                client.stat((err, data) => {
                    expect(err).toBe(null);
                    expect(typeof data.count).toBe('number');
                    expect(typeof data.length).toBe('number');
                    client.disconnect(done);
                });
            });
        });
    });

    describe('list command', () => {
        it('returns message list count', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err) => {
                expect(err).toBe(null);
                client.list((err, data) => {
                    expect(err).toBe(null);
                    expect(Object.keys(data).length).toBeGreaterThanOrEqual(0);
                    client.disconnect(done);
                });
            });
        });

        it('returns info about message', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err) => {
                expect(err).toBe(null);
                client.list(1, (err) => {
                    expect(err).toBe(null);
                    client.disconnect(done);
                });
            });
        });
    });

    describe('retr command', () => {
        it('should return message body for known message', (done) => {
            const client = new Client(tlsOptions);
            client.connect(err => {
                expect(err).toBe(null);
                client.retr(1, err => {
                    expect(err).toBe(null);
                    client.disconnect(done);
                });
            });
        });

        it('should return an error for unknown message', (done) => {
            const client = new Client(tlsOptions);
            client.connect(err => {
                expect(err).toBe(null);
                client.retr(666, err => {
                    expect(err).not.toBe(null);
                    expect(err).toBeInstanceOf(Error);
                    client.disconnect(done);
                });
            });
        });

        it('should return parsed message using mailparser', (done) => {
            const client = new Client({
                ...tlsOptions,
                mailparser: true,
            });
            client.connect(err => {
                expect(err).toBe(null);
                client.retr(1, (err, data) => {
                    expect(err).toBe(null);
                    expect(data.text).toBeDefined();
                    expect(data.subject).toBeDefined();
                    expect(data.headers).toBeDefined();
                    client.disconnect(done);
                });
            });
        });
    });

    describe('count command', () => {
        it('should return message count', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err) => {
                expect(err).toBe(null);
                client.count((err, data) => {
                    expect(err).toBe(null);
                    expect(data).toBeGreaterThanOrEqual(0);
                    count = data;
                    client.disconnect(done);
                });
            });
        });
    });

    describe('dele command', () => {
        it('should mark last message as deleted', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err) => {
                expect(err).toBe(null);
                client.dele(count, (err) => {
                    expect(err).toBe(null);
                    client.quit(done);
                });
            });
        });

        it('should be deleted after the end of transaction', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err) => {
                expect(err).toBe(null);
                client.count((err, data) => {
                    expect(err).toBe(null);
                    expect(data).toBe(count - 1);
                    count = data;
                    client.disconnect(done);
                });
            });
        });
    });

    describe('rset command', () => {
        it('should mark last message as deleted, then reset', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err) => {
                expect(err).toBe(null);
                client.dele(count, (err) => {
                    expect(err).toBe(null);
                    client.rset((err) => {
                        expect(err).toBe(null);
                        client.quit(done);
                    });
                });
            });
        });

        it('should not be deleted after the end of transaction', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err) => {
                expect(err).toBe(null);
                client.count((err, data) => {
                    expect(err).toBe(null);
                    expect(data).toBe(count);
                    count = data;
                    client.disconnect(done);
                });
            });
        });
    });

    describe('connect', () => {
        it('should properly connect after disconnection', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err) => {
                expect(err).toBe(null);
                client.disconnect((err) => {
                    expect(err).toBe(null);
                    client.connect((err) => {
                        expect(err).toBe(null);
                        client.disconnect(done);
                    });
                });
            });
        });
    });

    describe('top', () => {
        it('should return an error for wrong message number', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err) => {
                expect(err).toBe(null);
                client.top(0, 0, (err) => {
                    expect(err).toBeDefined();
                    expect(err).toBeInstanceOf(Error);
                    client.disconnect(done);
                });
            });
        });

        it('should return raw message headers', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err) => {
                expect(err).toBe(null);
                client.top(1, 0, (err, data) => {
                    expect(err).toBe(null);
                    expect(data).toBeInstanceOf(Buffer);
                    client.disconnect(done);
                });
            });
        });

        it('should return raw message headers and body', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err) => {
                expect(err).toBe(null);
                client.top(1, 10, (err, data) => {
                    expect(err).toBe(null);
                    expect(data).toBeInstanceOf(Buffer);
                    client.disconnect(done);
                });
            });
        });

        it('should return parsed message headers', (done) => {
            const client = new Client({
                ...tlsOptions,
                mailparser: true,
            });
            client.connect((err) => {
                expect(err).toBe(null);
                client.top(1, 0, (err, res) => {
                    expect(err).toBe(null);
                    expect(res.subject).toBeDefined();
                    expect(res.from).toBeDefined();
                    expect(res.to).toBeDefined();
                    expect(res.date).toBeDefined();
                    client.disconnect(done);
                });
            });
        });
    });

    describe('retrieve', () => {
        it('should properly works on message number', (done) => {
            const client = new Client({
                ...tlsOptions,
                mailparser: true,
            });
            client.connect((err) => {
                expect(err).toBe(null);
                client.retrieve(count, (err, data) => {
                    expect(err).toBe(null);
                    expect(data).toBeInstanceOf(Object);
                    client.disconnect(done);
                });
            });
        });

        it('should properly works on array of message numbers', (done) => {
            const client = new Client({
                ...tlsOptions,
                mailparser: true,
            });
            client.connect((err) => {
                expect(err).toBe(null);
                client.retrieve([count, count - 1, count - 2], (err, data) => {
                    expect(err).toBe(null);
                    expect(data).toBeInstanceOf(Array);
                    expect(data.filter(a => a).length).toBe(3);
                    data.forEach(msg => expect(msg).toBeInstanceOf(Object));
                    client.disconnect(done);
                });
            });
        });

        it('should return an error with bad arguments', (done) => {
            const client = new Client({
                ...tlsOptions,
                mailparser: true,
            });
            client.connect((err) => {
                expect(err).toBe(null);
                client.retrieve([count, count + 1, count + 2], (err) => {
                    expect(err).toBeInstanceOf(Error);
                    client.disconnect(done);
                });
            });
        });
    });

    describe('delete', () => {
        it('should properly delete an array of messages', (done) => {
            const client = new Client({
                ...tlsOptions,
                mailparser: true,
            });
            client.connect((err) => {
                expect(err).toBe(null);
                client.delete([count, count - 1, count - 2], (err, data) => {
                    expect(err).toBe(null);
                    expect(data).toBeInstanceOf(Array);
                    expect(data.filter(a => a).length).toBe(3);
                    console.log(data);
                    data.forEach(msg => expect(/OK/.test(msg)).toBe(true));
                    client.rset((err) => {
                        expect(err).toBe(null);
                        client.disconnect(done);
                    });
                });
            });
        });

        it('should return an error with bad arguments and make a rset after all', (done) => {
            const client = new Client({
                ...tlsOptions,
                mailparser: true,
            });
            client.connect((err) => {
                expect(err).toBe(null);
                client.delete([count, count + 1, count + 2], (err) => {
                    expect(err).toBeInstanceOf(Error);
                    client.disconnect((err) => {
                        expect(err).toBe(null);
                        client.connect((err) => {
                            expect(err).toBe(null);
                            client.count((err, cou) => {
                                expect(cou).toBe(count);
                                client.disconnect(done);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('retrieveAll', () => {
        it('should return all messages', (done) => {
            const client = new Client({
                ...tlsOptions,
                mailparser: true,
            });
            client.connect((err) => {
                expect(err).toBe(null);
                client.retrieveAll((err, data) => {
                    expect(err).toBe(null);
                    expect(data).toBeInstanceOf(Array);
                    expect(data.filter(a => a).length).toBe(count);
                    data.forEach(msg => expect(msg).toBeInstanceOf(Object));
                    data.forEach(msg => expect(typeof msg.subject).toBe('string'));
                    client.disconnect(done);
                });
            });
        });
    });

    describe('deleteAll', () => {
        it('should delete all messages', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err) => {
                expect(err).toBe(null);
                client.deleteAll((err, data) => {
                    expect(err).toBe(null);
                    expect(data).toBeInstanceOf(Array);
                    expect(data.filter(a => a).length).toBe(count);
                    client.rset((err) => {
                        expect(err).toBe(null);
                        client.disconnect(done);
                    });
                });
            });
        });
    });

    describe('retrieveAndDeleteAll', () => {
        it('should return all messages and delete them', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err) => {
                expect(err).toBe(null);
                client.retrieveAndDeleteAll((err, data) => {
                    expect(err).toBe(null);
                    expect(data).toBeInstanceOf(Array);
                    expect(data.filter(a => a).length).toBe(count);
                    client.disconnect((err) => {
                        expect(err).toBe(null);
                        client.connect((err) => {
                            expect(err).toBe(null);
                            client.count((err, count) => {
                                expect(err).toBe(null);
                                expect(count).toBe(0);
                                client.disconnect(done);
                            });
                        });
                    });
                });
            });
        });
    });

    describe( 'retrieve zero messages', () => {
        it('should return an empty array', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err) => {
                expect(err).toBe(null);
                client.retrieveAll((err, data) => {
                    expect(err).toBe(null);
                    expect(data).toBeInstanceOf(Array);
                    expect(data.length).toBe(0);
                    client.disconnect(done);
                });
            });
        });
    });

    describe('list zero messages', () => {
        it('should return empty object', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err) => {
                expect(err).toBe(null);
                client.list((err, data) => {
                    expect(err).toBe(null);
                    expect(Object.keys(data).length).toBe(0);
                    client.disconnect(done);
                });
            });
        });
    });
});
