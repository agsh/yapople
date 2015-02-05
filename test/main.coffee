Client = (require '../lib/yapople').Client
assert = require 'assert'

describe 'POP3 client tests', () ->
  client = null
  before (done) ->
    options = {
      hostname: if process.env.HOSTNAME then process.env.HOSTNAME else 'smtp.mail.ru'
      port: if process.env.PORT then parseInt(process.env.PORT) else 25
      username: 'yapople'
      password: 'yapopleyapopleyapopleyapople'
    }
    client = new Client options

  describe 'connect', () ->
    it 'should connect to the existing server', (done) ->
      client.connect (err, data) ->
        assert.equal err, null
        client.login()
        done()