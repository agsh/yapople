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
  username: 'username'
  password: 'password'
}).connect().retrieveAll(function(err, messages) {
  messages.forEach(function(message) {
    console.log(message.subject);
  });
}).quit();
```

Also this is a callback-driven and command-queued library instead of [poplib](https://github.com/ditesh/node-poplib)
So you can run methods in chain, don't think about already running command and get what you want in callback instead of
putting somewhere event-listener functions to retrieve data.

> Uses the last TLS Api (since crypto.createCredentials is deprecated),
> so it works only with then node.js v.0.12 or later.

## Installation
`npm install yapople`

## Tests
`npm test`

## Constructor properties
When you creates new Client object you should pass an object which describes connection properties.

* **hostname** - _string_ - mailserver hostname
* **port** - _number_ - port, usually 110 or 995 for TLS connection
* **tls** - _boolean_ - use TLS encryption
* **username** - _string_ - mailbox username
* **password** - _string_ - mailbox password
* **mailparser** - _boolean_ - use [mailparser](https://github.com/andris9/mailparser) library to automatically decode messages

## Properties

* **connected** - _boolean_ - connect and login state

## Methods

### connect
Connect to the mailserver using `hostname` and `port`. Starts TLS connection if `tls` property is true.
Then login into your mailbox using credentials properties `username` and `password`.

### count(callback)
- **callback** - __function(err, count)__
Returns a count of the messages in the mailbox

### retrieve(what, callback)
- **what** - __number or array of numbers__ - message number, or an array of message numbers
- **callback** - __function(err, messages)__
Retrieve a message/messages by its number/numbers.

### retrieveAll(callback)
- **callback** - __function(err, messages)__
Retrieve all messages in mailbox.

### delete(what, callback)
- **what** - __number or array of numbers__ - message number, or an array of message numbers
- **callback** - __function(err, messages)__
Delete a message/messages by its number/numbers.
If you delete several messages and get an error for some message, all you delete transaction will be reset.

### deleteAll(callback)
- **callback** - __function(err, statuses)__
Delete all messages in mailbox.

### retrieveAndDeleteAll(callback)
- **callback** - __function(err, messages)__
Retrieve and delete all messages in mailbox. In a callback function you'll get an error message or an array of
retrieved emails. If you get an error for some reason, all you delete transaction will be reset.

### list(number, callback)
- **number** - __number (optional)__ - message number
- **callback** - __function(err, info)__
Returns length of a message in octets. If no number passed, list returns an object contains message numbers as a keys
and message lengths as a values

### quit(callback)
- **callback** - __function(err)__
Finish current session and disconnect. All messages marked as deleted after this command will be erased.