Client = (require '../lib/yapople').Client
assert = require 'assert'

describe 'POP3 client tests', () ->
  options = {
    hostname: 'pop.mail.ru'
    port: 110
    username: 'yapople'
    password: 'yapopleyapopleyapopleyapople'
  }
  tlsOptions = {
    hostname: 'pop.mail.ru'
    port: 995
    tls: true
    username: 'yapople'
    password: 'yapopleyapopleyapopleyapople'
  }

  describe 'connect', () ->
    it 'should connect to the existing server', (done) ->
      client = new Client options
      client.connect (err, data) ->
        assert.equal err, null
        client.disconnect()
        done()

    this.timeout(50000);
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

  this.timeout(10000);
  describe 'stat command', () ->
    it 'return message stat count', (done) ->
      client = new Client tlsOptions
      client.debug = true
      client.connect (err, data) ->
        assert.equal err, null
        client.login (err, data) ->
          assert.equal err, null
          client.stat (err, data) ->
            assert.equal err, null
            console.log data
            client.disconnect()
            done()

  this.timeout(10000);
  describe 'list command', () ->
    it 'return message list count', (done) ->
      client = new Client tlsOptions
      client.connect (err, data) ->
        assert.equal err, null
        client.login (err, data) ->
          assert.equal err, null
          client.list (err, data) ->
            assert.equal err, null
            console.log data
            client.disconnect()
            done()