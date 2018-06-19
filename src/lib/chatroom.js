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
  console.log('input buffer', buffer);
  let text = buffer.trim();
  if (!text.startsWith('@')) return null;
  text = text.split(' '); // string to array
  console.log(text);
  const [command, ...msg] = text; // decomp to first word and everything else
  const message = msg.join(' '); // return array to string
  console.log(message);
  return {
    command,
    message,
  };
};

chat.dispatchAction = (user, stringBuffer) => {
  const entry = parseData(stringBuffer);
  if (!entry) {
    logger.log(logger.INFO, `null, or non-@-prefixed data recieved from user ${user._id}`);
    event.emit('@help', null, user);
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

event.on('@dm', (message, user) => {
  logger.log(logger.INFO, `@dm rec'd: |${message}|`);
  const getDmUserSocket = (username) => {
    const dmSocket = Object.keys(socketPool)
      .map((poolItem) => {
        return { 
          nickname: socketPool[poolItem].nickname,
          socket: socketPool[poolItem].socket,
        };
      })
      .filter(users => users.nickname === username);
    return dmSocket.length > 0 ? dmSocket[0].socket : null;
  };

  const chunks = message.split(' ');
  const [dmUser, ...chatMessage] = chunks;
  const chatMsg = chatMessage.join(' ');
  const dmSocket = getDmUserSocket(dmUser);
  console.log(dmSocket);
  if (dmSocket) dmSocket.write(`${user.nickname}@dm>> ${chatMsg}\n`);
});

event.on('@help', (cmd, user) => {
  logger.log(logger.INFO, `@help rec'd: |${cmd}| typeof ${typeof cmd}`);
  if (cmd === null) {
    user.socket.write(`Usage: @cmd message\n\nWhere: @cmd is @all, @dm, @list, @myname, @help or @quit\nmessage is chat message, new nickename (with @myname) or @cmd (with @help)\n`); /* eslint-disable-line */
    return;
  }
  // switch (cmd) {
  //   case '@all':
  if (cmd === '@all') {
    user.socket.write('@all <message> broadcasts <message> to all chat users.\n');
  }
  // break;
  // case '@dm':
  if (cmd === '@dm') {
    user.socket.write('@dm <user> <message> sends <message> directly to <user>. user @list to get list of users.\n');
  }
  //   break;
  // default:
  //     user.socket.write(`Unrecognized help request: ${cmd}\n`)
  // }
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
