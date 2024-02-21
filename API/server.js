const express = require('express');
const cors = require('cors')
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const fs = require('fs');
const multer = require('multer');
const path = require('path');

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


// Define a route to handle file saving to local drive
app.post('/saveFile', (req, res) => {
  const { fileName, fileContent, recipient } = req.body;
  
  // Check if all required parameters are provided
  if (!fileName || !fileContent || !recipient) {
      return res.status(400).send('Missing parameters');
  }
  /*
  file info object to send to db
  {
    id, userOwnerID, teamsSharedID, data, deleted
  }
  this is the front end form 
  convert to react
  <form action="/profile" method="post" enctype="multipart/form-data">
    <input type="file" name="avatar" />
  </form>
  */

  // Here you might have some logic to determine the recipient's contact information,
  // such as their email address, or username, or any other identifier.

  // Assuming recipientContactInfo is obtained

  // Write the file to the recipient's location
  const filePath = `/recipient/${fileName}.txt`;
  fs.writeFile(filePath, fileContent, (err) => {
      if (err) {
          console.error(err);
          return res.status(500).send('Error saving file');
      }
      console.log(`File saved to ${filePath}`);
      res.status(200).send('File saved successfully');
  });
});
/////////////////////////////////////////////


// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// File upload route
app.post('/upload/file', upload.single('file'), (req, res) => {
  res.json({ filename: req.file.originalname });
});

// File download route
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  res.download(path.join(__dirname, 'uploads', filename));
});
/////////////////////////////////////////////////


app.listen(port, () => console.log(`Server listening on http://localhost:${process.env.SERVER_PORT}`));




