const http = require("http")
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();
const chatRoutes = require("../Chat/routes");
const calendarRoutes = require('../Calendar/calendarRoutes');

const requestRoutes = require('../Database/requests.js');
const teamRoutes = require('../Database/teamManagement.js');
const authRoutes = require('../Database/userAuth.js');
const userUtilsRoutes = require('../Database/userUtilities.js');
const userToUserRoutes = require('../Database/userToUser.js');
const fileRoutes = require("../user-to-user-fileshare/userFileShare")
const {setup: socketSetup} = require("../Peer/sockets.cjs")

const port = process.env.PORT || process.env.SERVER_PORT;

const app = express();

const server = http.createServer(app)
const socketIo = require("socket.io");

const io = new socketIo.Server(server, {
  cors: {
    origin: "http://localhost:"+process.env.CLIENT_PORT,
    methods: ["GET", "POST"],
    credentials: true,
    cookie: true
  }
})

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

socketSetup({io, pool})

app.use(async function (req, res, next) {
  try {
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    await req.db.query(`SET SESSION sql_mode = "TRADITIONAL"`);
    await req.db.query(`SET time_zone = '-8:00'`);

    await next();

    req.db.release();
  } catch (err) {
    console.log(err);

    if (req.db) req.db.release();
    throw err;
  }
});

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: `http://localhost:${process.env.CLIENT_PORT}`,
    credentials: true,
  })
);
app.use('/api/calendar', calendarRoutes);

app.use((req, res, next) => {
  res.secureCookie = (name, val, options = {}) => {
    res.cookie(name, val, {
      sameSite: "strict",
      httpOnly: true,
      secure: true,
      ...options,
    });
  };
  next();
});

app.use("/api/users" , authRoutes)

function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_KEY, (err, user) => {
    if (err) {
      console.log(err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

app.use(authenticateToken);

app.use(express.static(path.join(__dirname, "../dist")));

app.use("/api/chat", chatRoutes);

app.use("/api/database" , requestRoutes)
app.use("/api/database" , teamRoutes)
app.use("/api/database" , userToUserRoutes)
app.use("/api/database" , userUtilsRoutes)
app.use("/files", fileRoutes)

app.get("/server/status", (req, res) => {
  res.send("Server is functioning properly.");
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

server.listen(port, () =>
  console.log(`Server listening on http://localhost:${port}`)
);
