# yapople
Yet another POP3 library

[![Build Status](https://travis-ci.org/agsh/yapople.png)](https://travis-ci.org/agsh/yapople)
[![Coverage Status](https://coveralls.io/repos/agsh/yapople/badge.svg?branch=master)](https://coveralls.io/r/agsh/yapople?branch=master)

The design propose of the library is simplicity. A lot of common tasks with you POP3 mailbox doesn't require knowledge of
the eleven POP3 commands. You just want to retrieve some messages from your mailbox and that's all! So here is quick
example how to do this with 'yapople':

```javascript
const { Client } = require('yapople');
const client = new Client({
  host: 'pop.mail.ru',
  port:  995,
  tls: true,
  mailparser: true,
  username: 'username',
  password: 'password',
  options: {
    secureContext: {
      passphrase: "passphrase"
    }
  }
});
(async () => {
    await client.connect();
    const messages = await client.retrieveAll();
    messages.forEach((message) => {
      console.log(message.subject);
    });
    await client.quit();
})().catch(console.error);
```

Or with the old callback style:

```javascript
var Client = require('yapople').Client;
var client = new Client({
  host: 'pop.mail.ru',
  port:  995,
  tls: true,
  mailparser: true,
  username: 'username',
  password: 'password',
  options: {
    secureContext: {
      passphrase: "passphrase"
    }
  }
});
client.connect(function() {
  client.retrieveAll(function(err, messages) {
    messages.forEach(function(message) {
      console.log(message.subject);
    });
    client.quit();
  })
})
```

Also this is a callback-driven and command-queued library instead of [poplib](https://github.com/ditesh/node-poplib)
So you can run methods in chain, don't think about already running command and get what you want in callback instead of
putting somewhere event-listener functions to retrieve data. You can add connection options (optional) after callback.

> Uses the last TLS Api (since crypto.createCredentials is deprecated),
> so it works only with node.js v.0.12 or later.

## Installation
`npm install yapople`

## Tests
`npm test`

## Constructor properties
When you create new Client object you should pass an object which describes connection properties.

* **host** or **hostname** - _string_ - mailserver hostname
* **port** - _number_ - port, usually 110 or 995 for TLS connection
* **username** - _string_ - mailbox username
* **password** - _string_ - mailbox password
* **mailparser** - _boolean_ - use [mailparser](https://github.com/andris9/mailparser) library to automatically decode messages
* **tls** - _boolean_ - use TLS encryption
* **options** - _object_ - Optional configuration JSON object for socket creation. 
(see. [TLS](https://nodejs.org/dist/latest-v12.x/docs/api/tls.html#tls_tls_connect_options_callback) 
and [NET](https://nodejs.org/dist/latest-v12.x/docs/api/net.html#net_socket_connect_options_connectlistener))

## Properties

* **connected** - _boolean_ - connect and login state

## Methods

All the methods can be used both callback-style or promise-style if callback has been omitted.
In the examples below only async-await style will be used.

### connect([options], [callback])
- **options** - __object__
- **callback** - __function(err)__

Connect to the mailserver using `hostname` and `port`. Starts TLS connection if `tls` property is true.
Then login into your mailbox using credentials properties `username` and `password`.

If `options` is defined, valuse from `options` will be used to connect for `tls.connect` or `net.createConnection` functions. 
Precedence goes to them instead of constructor `options`.

### count([callback])
- **callback** - __function(err, count)__

Returns a count of the messages in the mailbox

### retrieve(what, [callback])
- **what** - __number or array of numbers__ - message number, or an array of message numbers
- **callback** - __function(err, messages)__

Retrieve a message/messages by its number/numbers. If the `mailparser` argument is true returned messages will be parsed
and looks like an objects. Otherwise it will be strings. Notice that results are sparse array with indexes representing
message numbers. You can access message with its number like that `messages[number]` and use all HOF like this
`messages.map(function(mail, num){ return [num, mail.subject]; })`.
Or you can represent it like normal array with construction like this: `messages.filter(a => a)`

### retrieveAll([callback])
- **callback** - __function(err, messages)__

Retrieve all messages in mailbox. Result is a sparse array starting from 1.

### delete(what, [callback])
- **what** - __number or array of numbers__ - message number, or an array of message numbers
- **callback** - __function(err, messages)__

Delete a message/messages by its number/numbers.
If you delete several messages and get an error for some message, all you delete transaction will be reset.

Note that if your connection to the server is broken at all then the messages will not actually be deleted.
You need to cleanly disconnect from the mail server for this to happen.

### deleteAll([callback])
- **callback** - __function(err, statuses)__

Delete all messages in mailbox.

### retrieveAndDeleteAll([callback])
- **callback** - __function(err, messages)__

Retrieve and delete all messages in mailbox. Result is a sparse array starting from 1.
In a callback function you'll get an error message or an array of retrieved emails. 
If you get an error for some reason, all you delete transaction will be reset.

### list(number, [callback])
- **number** - __number (optional)__ - message number
- **callback** - __function(err, info)__

Returns length of a message in octets. If no number passed, list returns an object contains message numbers as a keys
and message lengths as a values

### quit([callback])
### disconnect([callback])
- **callback** - __function(err)__

Finish current session and disconnect. All messages marked as deleted after this command will be erased.

## Protocol methods

### retr(what, [callback])
- **what** - __number or string__ - message number
- **callback** - __function(err, message)__

Retrieve full message by its number.

### stat([callback])
- **what** - __number or string__ - message number
- **callback** - __function(err, stat)__

Returns an `stat` object representing the number of messages currently in the mailbox (`count` property)
and the size in bytes (`length` property).

### top(number, linesCount, [callback])
- **number** - __number or string__ - message number
- **linesCount** - __number or string__ - the number of lines of the message body you would like returned
- **callback** - __function(err)__

Retrieve part of the message including headers, or only headers.

### dele(number, [callback])
- **number** - __number or string__ - message number
- **callback** - __function(err, response)__

Delete a message by its number.

## Changelog

**0.4.0**
- all methods returns promises
- tests were rewritten in js and jest
- additional parameter `options` in the `constructor` and `connect` method
