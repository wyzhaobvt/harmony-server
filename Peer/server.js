const userChatSocket = require("./userChatSocket");

const server = require("http").createServer(function (req,res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.write("Signaling Server Running")
  res.end()
});
require("dotenv").config()

const peerServer = require("./signaling.cjs")
const socketAuth = require("./socketAuth.cjs");


const PORT = process.env.SIGNALING_PORT

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
})

// io.use(socketAuth(process.env.SIGNALING_KEY))

// peerServer(io)
userChatSocket(io)
server.listen(PORT, () => {
  console.log(`Signaling Port Started on http://localhost:${PORT}`)
})