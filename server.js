const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const users = require("./users.json")

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(express.json())


const PORT = process.env.PORT || 3000;



app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post("/auth-login",(req,res)=>{
    let email = req.body.email;
    let password = req.body.password;
    let user = users.find(ele=>ele.email === email && password === ele.password);
    if(!user) return res.status(400).json({msg:"not exist"})
    res.status(200).json(user)
})

app.get('/user/:email',(req,res)=>{
    let email = req.params.email;
    let user = users.filter(ele=>ele.email !== email);
    res.json(user)
})

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
  });

  app.get('/users', (req, res) => {
    res.sendFile(__dirname + '/public/users.html');
  });



let onlineUsers = {};

io.on('connection', (socket) => {

    
    onlineUsers[socket.handshake.query.id] = true;
    console.log(onlineUsers,"online")
    updateOnlineUsers(onlineUsers);
    socket.on('join_rooms', (roomIds) => {
    console.log(roomIds,"roomId")
    socket.join(roomIds)
  });


  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  function updateOnlineUsers(onlineUsers) {
    console.log(onlineUsers,"updateOnlineUsers",Object.keys(onlineUsers))
    io.emit('onlineUsers', Object.keys(onlineUsers));
  }

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.handshake.query.id}`);
    delete onlineUsers[socket.handshake.query.id];
    console.log(`User ${socket.handshake.query.id} is offline`);
    io.emit('onlineUsers', Object.keys(onlineUsers)); // Update online users list
    io.emit("offline",socket.handshake.query.id)

  });

  socket.on('private_message', (data) => {
    const { room, message } = data;
    io.to(room).emit('private_message', {message,id:socket.handshake.query.id,room});
  });

  socket.on('start_typing',({room,currentUser})=>{
    console.log(room,currentUser)
    io.to(room).emit('start_typing', {room,currentUser});
  })

  socket.on('stop_typing',({room,currentUser})=>{
    io.to(room).emit('stop_typing', {room,currentUser});
  })

  


});

server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
