Client = (require '../lib/yapople').Client
assert = require 'assert'

describe 'POP3 client tests', () ->
  options = {
    hostname: if process.env.HOSTNAME then process.env.HOSTNAME else 'pop.mail.ru'
    port: if process.env.PORT then parseInt(process.env.PORT) else 110
    username: 'yapople'
    password: 'yapopleyapopleyapopleyapople'
  }

  describe 'connect', () ->
    it 'should connect to the existing server', (done) ->
      client = new Client options
      client.connect (err, data) ->
        assert.equal err, null
        done()

    it 'should not login to TLS server', (done) ->
      client = new Client options
      client.connect (err, data) ->
        assert.equal err, null
        client.login (err, data) ->
          assert.notEqual err, null
          assert.equal err, 'POP3 is available only with SSL or TLS connection enabled'
          done()