const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const port = process.env.SERVER_PORT;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: `http://localhost:${process.env.CLIENT_PORT}`,
    credentials: true,
  })
);

app.use(express.static(path.join(__dirname, "../dist")));

app.get("/server/status", (req, res) => {
  res.send("Server is functioning properly.");
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

app.listen(port, () =>
  console.log(`Server listening on http://localhost:${port}`)
);