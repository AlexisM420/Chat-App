/* ------------------------- THIS IS THE SERVER SIDE ------------------------ */
/* ------------------------- THIS IS THE SERVER SIDE ------------------------ */
/* ------------------------- THIS IS THE SERVER SIDE ------------------------ */

const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// socket.emit -> send to specific client
// io.emit -> send to every clients
// socket.broadcast.emit -> send to every clients except specific one
// io.to.emit -> send to everyone in specified room (to)
//      same as upper line, socket.broadcast.to.emit

/* ------------------------------ Connection fx ----------------------------- */
//#region
io.on('connection', (socket) => {
  console.log('New WebSocket connection')

  // join with specific username and room
  socket.on('join', (options, callback) => {
    // ... => destructuring (spread operator)
    const { error, user } = addUser({ id: socket.id, ...options })
    // si probleme création user
    if (error) {
      return callback(error)
    }

    // si bien créée...
    socket.join(user.room)

    socket.emit('message', generateMessage('Welcome!'))
    socket.broadcast
      .to(user.room)
      .emit('message', generateMessage(`${user.username} has joined!`))

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    })

    callback()
  })

  // Callback -> event acknowledgement -> needs changes on client & server
  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id)
    const filter = new Filter()

    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed')
    }

    io.to(user.room).emit('message', generateMessage(user.username, message))
    callback()
  })

  socket.on('sendLocation', (coords, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit(
      'locationMessage',
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`,
      ),
    )
    callback()
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage(`${user.username} has left!`),
      )
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      })
    }
  })
})
//#endregion
/* -------------------------------------------------------------------------- */

server.listen(port, () => {
  console.log('Server is up on port ', port, '!')
})
