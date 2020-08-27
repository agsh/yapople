const nodemailer = require('nodemailer');
const { Client } = require('../lib/yapople');

describe('integration tests for callback style', () => {
    // beforeAll(() => {
    //     jest.setTimeout(120000);
    //
    //     const transporter = nodemailer.createTransport({
    //         service: 'Mail.ru',
    //         auth: {
    //             user: 'yapople@mail.ru',
    //             pass: 'yapopleyapopleyapopleyapople',
    //         },
    //     });
    //
    //     const mailOptions = {
    //         from: 'yapople@mail.ru',
    //         to: 'yapople@mail.ru',
    //         html: '<b>Hello world ✔ Дорждынька</b>',
    //     };
    //
    //     return Promise.all([0,1,2,3].map(cou => transporter.sendMail({
    //         ...mailOptions,
    //         subject: `msg ${cou} сообщение`,
    //         text: `msg ${cou} сообщение`,
    //     })));
    // });

    const options = {
        hostname: 'pop.mail.ru',
        port: 110,
        username: 'yapople',
        password: 'yapopleyapopleyapopleyapople',
    };
    const tlsOptions = {
        hostname: 'pop.mail.ru',
        port:  995,
        tls: true,
        username: 'yapople',
        password: 'yapopleyapopleyapopleyapople',
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
                expect(data).toBe('Welcome!');
                client.disconnect(done);
            });
        });

    });

    describe('stat command', () => {
        it('returns message stat count', (done) => {
            const client = new Client(tlsOptions);
            client.connect((err, data) => {
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
            jest.setTimeout(120000);
            const client = new Client(tlsOptions);
            client.connect((err, data) => {
                expect(err).toBe(null);
                console.log(data);
                client.list((err, data) => {
                    expect(err).toBe(null);
                    expect(Object.keys(data).length).toBeGreaterThanOrEqual(0);
                    client.disconnect(done);
                });
            });
        });
    });
});
