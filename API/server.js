const express = require('express');
const {createServer} = require("http")
const app = express();
const server = createServer(app)
const cors = require('cors')
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const fs = require('fs');
const io = require("socket.io", {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})
const UserFileShareRoute = require('../user-to-user-fileshare/userFileShare')

require('dotenv').config();

const calendarRoutes = require('../Calendar/calendarRoutes');
const {peerServer, socketAuth} = require('../PeerServer/index.cjs');

const port = process.env.SERVER_PORT;

io.use(socketAuth)

peerServer(io)

app.use('/api/calendar', calendarRoutes);

app.use(express.json());
app.use(cookieParser())
app.use(cors({
    origin: `http://localhost:${process.env.CLIENT_PORT}`,
    credentials: true,
  }));
  
app.use('/files', UserFileShareRoute)

app.get("/", (req, res) => {
  res.send("Server is functioning properly.")
})

app.get("/peer/authenticate", ( req, res) => {
  const token = jwt.sign(
    { uid: req.user.uid, username: req.user.username, groups: req.user.groups},
    process.env.SIGNALING_KEY,
    {expiresIn: 1}
  )
  res.status(200).json({success: true, message: "peer authorized", data: token})
})


server.listen(port, () => console.log(`Server listening on http://localhost:${process.env.SERVER_PORT}`));




