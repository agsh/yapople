Client = (require '../lib/yapople').Client
assert = require 'assert'
nodemailer = require 'nodemailer'

describe 'POP3 client tests', () ->
  this.timeout 20000
  count = 0
  before (done) ->
    transporter = nodemailer.createTransport {
      service: 'Mail.ru'
      auth: {
        user: 'yapople@mail.ru'
        pass: 'yapopleyapopleyapopleyapople'
      }
    }
    mailOptions = {
      from: 'yapople@mail.ru'
      to: 'yapople@mail.ru'
      subject: 'Hello ✔'
      text: 'Hello world ✔'
      html: '<b>Hello world ✔</b>'
    }
    transporter.sendMail mailOptions, (error) ->
      if error
        console.log error
      else
        done()

  options = {
    hostname: 'pop.mail.ru'
    port: 110
    username: 'yapople'
    password: 'yapopleyapopleyapopleyapople'
  }
  tlsOptions = {
    hostname: 'pop.mail.ru'
    port:  995
    tls: true
    username: 'yapople'
    password: 'yapopleyapopleyapopleyapople'
  }

  describe 'connect', () ->
    it 'should connect to the existing server', (done) ->
      client = new Client options
      client.connect (err) ->
        assert.equal err, null
        client.disconnect()
        done()

    it 'should not login to TLS server without tls option', (done) ->
      client = new Client options
      client.connect (err, data) ->
        assert.equal err, null
        client.login (err, data) ->
          assert.notEqual err, null
          assert.equal err, 'POP3 is available only with SSL or TLS connection enabled'
          client.disconnect()
          done()

    it 'should login to TLS server with tls option', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        assert.equal err, null
        client.login (err, data) ->
          assert.equal err, null
          assert.equal data, 'Welcome!'
          client.disconnect()
          done()

  describe 'stat command', () ->
    it 'returns message stat count', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        assert.equal err, null
        client.login (err, data) ->
          assert.equal err, null
          client.stat (err, data) ->
            assert.equal err, null
            client.disconnect()
            done()

  describe 'list command', () ->
    it 'returns message list count', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        assert.equal err, null
        client.login (err, data) ->
          assert.equal err, null
          client.list (err, data) ->
            assert.equal err, null
            client.disconnect()
            done()
    it 'returns info about message', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        assert.equal err, null
        client.login (err, data) ->
          assert.equal err, null
          client.list 1, (err, data) ->
            assert.equal err, null
            client.disconnect()
            done()

  describe 'retr command', () ->
    it 'should return message body for known message', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        client.login (err, data) ->
          client.retr 1, (err, data) ->
            assert.equal err, null
            client.disconnect()
            done()

    it 'should return an error for unknown message', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        client.login (err, data) ->
          client.retr 666, (err, data) ->
            assert.notEqual err, null
            client.disconnect()
            done()

  describe 'retr command', () ->

    it 'should return parsed message when using mailparser', (done) ->
      tlsOptions.mailparser = true
      client = new Client tlsOptions
      client.connect (err, data) ->
        client.login (err, data) ->
          client.retr 1, (err, data) ->
            assert.equal err, null
            assert.ok data.text
            console.log data if not data.subject
            assert.ok data.subject
            assert.ok data.headers
            client.disconnect()
            done()

  describe 'count command', () ->
    it 'should return message count', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        client.login (err, data) ->
          client.count (err, data) ->
            assert.equal err, null
            assert.ok data >= 0
            count = data
            client.disconnect()
            done()

  describe 'dele command', () ->

    it 'should mark last message as deleted', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        client.login (err, data) ->
          client.dele count, (err, data) ->
            assert.equal err, null
            client.quit(done)

    it 'should be deleted after the end of transaction', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        assert.equal err, null
        client.login (err, data) ->
          assert.equal err, null
          client.count (err, data) ->
            assert.equal err, null
            assert.equal data, count - 1
            count = data
            client.disconnect()
            done()

  describe 'rset command', () ->
    it 'should mark last message as deleted, then reset', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        client.login (err, data) ->
          client.dele count, (err, data) ->
            assert.equal err, null
            client.rset (err, data) ->
              assert.equal err, null
              client.quit(done)

    it 'should not be deleted after the end of transaction', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        assert.equal err, null
        client.login (err, data) ->
          assert.equal err, null
          client.count (err, data) ->
            assert.equal err, null
            assert.equal data, count
            client.disconnect()
            done()



  # TODO command sequence test