'use strict';

const chat = module.exports = {};

const EventEmitter = require('events');
// const net = require('net');
const logger = require('./logger');
// const User = require('./../model/user');
const socketPool = require('./server');

chat.hi = 'hello world';

// const PORT = process.env.PORT || 3000;

// const server = net.createServer();
const event = new EventEmitter();
// const socketPool = {};

const parseData = (buffer) => {
  let text = buffer.trim();
  if (!text.startsWith('@')) return null;
  text = text.split(' '); // string to array
  const [command, ...message] = text; // decomp to first word and everything else
  message.join(' '); // return array to string
  return {
    command,
    message,
  };
};

chat.dispatchAction = (user, buffer) => {
  const entry = parseData(buffer);
  if (!entry) {
    logger.log(logger.INFO, `null, or non-@-prefixed data recieved from user ${user._id}`);
    user.socket.write(`Usage: @cmd message\n\nWhere: @cmd is @all, @dm, @list, @myname or @quit\nmessage is chat message or new nickename (with @myname)\n`); /* eslint-disable-line */
    return null;
  }
  // @command message received. No guarantee that @command is recognized.
  // if not recognized command it'll just get lost in the dark rececesses of the net...
  if (entry) event.emit(entry.command, entry.message, user);
  return true;
};

// these are all the event listeners
event.on('@all', (message, user) => {
  logger.log(logger.INFO, `@all rec'd: |${message}|`);
  Object.keys(socketPool).forEach((userIdKey) => {
    const targetedUser = socketPool[userIdKey];
    targetedUser.socket.write(`${user.nickname}>>: ${message}\n`);
  });
});

// change users nickname
event.on('@myname', (newName, user) => {
  logger.log(logger.INFO, `@myname rec'd: |${newName}|`);
  socketPool[user._id].nickname = newName;
  user.socket.write(`You have changed your user name to ${newName}\n`);
});

// returns a list of all users in the chat
event.on('@list', (ignored, user) => {
  logger.log(logger.INFO, `@list rec'd: |${ignored}|`);
  Object.keys(socketPool).forEach((userIdKey) => {
    user.socket.write(`${socketPool[userIdKey].nickname}\n`);
  });
});

event.on('@quit', (ignored, user) => {
  logger.log(logger.INFO, `@quit logging user ${user.nickname} off`);
  user.socket.write('So long!\n');
  user.socket.destroy();
  delete socketPool[user._id];
});

// server.on('connection', (socket) => {
//   const user = new User(socket);
//   socket.write(`Welcome to the chatroom, ${user.nickname}!\n`);
//   // keep a record of that user in our socketPool by making a  new 
//   // key value pair that looks like this:
//   // { 'dafsaed922919101: { 
//   //   _id: dafsaed922919101,
//   //   nickname: User no. dafsaed922919101,
//   //   socket: really big object
//   // }}
//   socketPool[user._id] = user;
//   logger.log(logger.INFO, `A new user ${user.nickname} has entered the chatroom!`);

//   socket.on('data', (buffer) => {
//     dispatchAction(user, buffer);
//   });
// });

// server.listen(PORT, () => {
//   logger.log(logger.INFO, `Server up on PORT: ${PORT}`);
// });
