const express = require('express');
const cors = require('cors')
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
require('dotenv').config();

const port = process.env.SERVER_PORT;

const app = express();

app.use(express.json());
app.use(cookieParser())
app.use(cors({
    origin: `http://localhost:${process.env.CLIENT_PORT}`,
    credentials: true,
  }));

app.get("/", (req, res) => {
  res.send("Server is functioning properly.")
})

app.listen(port, () => console.log(`Server listening on http://localhost:${process.env.SERVER_PORT}`));




