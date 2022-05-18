module.exports = (app, io) => {
  console.log('websocket')
  io.on('connection', socket => {
    console.log('a new server device just identified.')
    socket.on('messageEvent', (info) => {
      console.log('this make movement')
       io.sockets.emit('messageEvent', info)
    })
  })
};