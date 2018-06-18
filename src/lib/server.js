'use strict';

// const net = require('net');
const socketPool = module.exports = {};

const User = require('../model/user');
const logger = require('./logger');
const chat = require('./chatroom');

const net = require('net');

const PORT = process.env.PORT || 3000;

const server = net.createServer();


server.on('connection', (socket) => {
  const user = new User(socket);
  socket.setEncoding('utf8'); // set socket to text data
  socket.write(`Welcome to the chatroom, ${user.nickname}!\n`);
  // keep a record of that user in our socketPool by making a  new 
  // key value pair that looks like this:
  // { 'dafsaed922919101: { 
  //   _id: dafsaed922919101,
  //   nickname: User no. dafsaed922919101,
  //   socket: really big object
  // }}
  socketPool[user._id] = user;
  logger.log(logger.INFO, `A new user ${user.nickname} has entered the chatroom!`);

  socket.on('data', (buffer) => {
    chat.dispatchAction(user, buffer);
  });
});

server.listen(PORT, () => {
  logger.log(logger.INFO, `Server up on PORT: ${PORT}`);
});
