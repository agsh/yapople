# yapople
Yet another POP3 library

[![Build Status](https://travis-ci.org/agsh/yapople.png)](https://travis-ci.org/agsh/yapople)
[![Coverage Status](https://coveralls.io/repos/agsh/yapople/badge.svg?branch=master)](https://coveralls.io/r/agsh/yapople?branch=master)

The design propose of the library is simplicity. A lot of common tasks with you POP3 mailbox doesn't require knowledge of
the eleven POP3 commands. You just want to retrieve some messages from your mailbox and that's all! So here is quick
example how to do this with `yapople`:

```javascript
var Client = require('yapople').Client;
new Client({
  hostname: 'pop.mail.ru'
  port:  995
  tls: true
  mailparser: true
  username: @username
  password: @password
}).connect().retrieveAll(function(err, messages) {
  messages.forEach(function(message) {
    console.log(message.subject);
  });
}).quit();
```

Also this is a callback-driven and command-queued library instead of [poplib](https://github.com/ditesh/node-poplib)
So you can run methods in chain, don't think about already running command and get what you want in callback instead of
putting somewhere event-listener functions to retrieve data.

Uses the last TLS Api (since crypto.createCredentials is deprecated),
so it works only with then node.js v.0.12 or later.