Client = (require '../lib/yapople').Client
assert = require 'assert'
nodemailer = require 'nodemailer'

describe 'POP3 client tests', () ->
  this.timeout 120000
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
      subject: 'msg 0 сообщение'
      text: 'msg 0 сообщение'
      html: '<b>Hello world ✔ Дорждынька</b>'
    }
    transporter.sendMail mailOptions, (error) ->
      if error
        console.log error
      else
        mailOptions.subject = 'msg 1 сообщение'
        mailOptions.text = 'msg 1 сообщение'
        transporter.sendMail mailOptions, (error) ->
          if error
            console.log error
          else
            mailOptions.subject = 'msg 2 сообщение'
            mailOptions.text = 'msg 2 сообщение'
            transporter.sendMail mailOptions, (error) ->
              if error
                console.log error
              else
                mailOptions.subject = 'msg 3 сообщение'
                mailOptions.text = 'msg 3 сообщение'
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
        client.disconnect done

    it 'should not login to TLS server without tls option', (done) ->
      client = new Client options
      client.connect (err, data) ->
        assert.equal err, null
        client.login (err, data) ->
          assert.notEqual err, null
          assert.equal err, 'POP3 is available only with SSL or TLS connection enabled'
          done()

    it 'should login to TLS server with tls option', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        assert.equal err, null
        client.login (err, data) ->
          assert.equal err, null
          assert.equal data, 'Welcome!'
          client.disconnect done

  describe 'stat command', () ->
    it 'returns message stat count', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        assert.equal err, null
        client.login (err, data) ->
          assert.equal err, null
          client.stat (err, data) ->
            assert.equal err, null
            client.disconnect done

  describe 'list command', () ->

    it 'returns message list count', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        assert.equal err, null
        client.login (err, data) ->
          assert.equal err, null
          client.list (err, data) ->
            assert.equal err, null
            client.disconnect
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
            client.disconnect done

    it 'should return an error for unknown message', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        client.login (err, data) ->
          client.retr 666, (err, data) ->
            assert.notEqual err, null
            client.disconnect done

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
            client.disconnect done

  describe 'count command', () ->
    it 'should return message count', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        client.login (err, data) ->
          client.count (err, data) ->
            assert.equal err, null
            assert.ok data >= 0
            count = data
            client.disconnect done

  describe 'dele command', () ->

    it 'should mark last message as deleted', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        client.login (err, data) ->
          client.dele count, (err, data) ->
            assert.equal err, null
            client.quit done

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
            client.disconnect done

  describe 'rset command', () ->
    it 'should mark last message as deleted, then reset', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        client.login (err, data) ->
          client.dele count, (err, data) ->
            assert.equal err, null
            client.rset (err, data) ->
              assert.equal err, null
              client.quit done

    it 'should not be deleted after the end of transaction', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        assert.equal err, null
        client.login (err, data) ->
          assert.equal err, null
          client.count (err, data) ->
            assert.equal err, null
            assert.equal data, count
            client.disconnect done
  describe 'connect', () ->
    it 'should properly connect after disconnection', (done) ->
      client = new Client tlsOptions
      client.connect (err) ->
        assert.equal err, null
        client.disconnect (err) ->
          assert.equal err, null
          client.connect (err) ->
            assert.equal err, null
            client.disconnect (err) ->
              assert.equal err, null
              done()

  describe 'retrieve', () ->
    it 'should properly works on array of message numbers', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        client.login (err, data) ->
          client.retrieve [count, count - 1, count - 2], (err, data) ->
            assert.equal err, null
            assert.ok Array.isArray data
            assert.equal data.length, 3
            # TODO message checking
            client.disconnect done

  describe 'delete', () ->
    it 'should properly delete an array of messages', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        client.login (err, data) ->
          client.delete [count, count - 1, count - 2], (err, data) ->
            assert.equal err, null
            assert.ok Array.isArray data
            assert.equal data.length, 3
            data.forEach (msg) ->
              assert.ok /^message (\d)* deleted$/.test(msg)
            client.rset (err, data) ->
              assert.equal err, null
              client.disconnect done

  describe 'retrieveAndDeleteAll', () ->
    it 'should return all messages and delete them', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        client.login (err, data) ->
          client.retrieveAndDeleteAll (err, data) ->
            assert.equal err, null
            assert.ok Array.isArray data
            assert.equal data.length, count
            client.disconnect () ->
              client.connect () ->
                client.login () ->
                  client.count (err, count) ->
                    assert.equal err, null
                    assert.equal count, 0
                    client.disconnect done

  # TODO command sequence test