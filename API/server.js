const express = require('express');
const cors = require('cors')
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const fs = require('fs');
const UserFileShareRoute = require('../user-to-user-fileshare/userFileShare')
const cloudinary = require('../cloudinary/cloudinary')

require('dotenv').config();

const calendarRoutes = require('../Calendar/calendarRoutes');

const port = process.env.SERVER_PORT;

const app = express();

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

// Upload or update user avatar
app.post('/uploadAvatar', async (req, res) => {
  const { image, avatarLink } = req.body;
  
  uploadOptions = {
    upload_preset: "unsigned_upload",
    allowed_formats: ["png", "jpg", "jpeg", "svg", "ico", "jfif", "webp"],
  }

  if (avatarLink) {
    // Find the index of the substring 'user-avatar/'
    const startIndex = avatarLink.indexOf('user-avatar/') + 'user-avatar/'.length;

    // Find the index of the end of the substring before the file extension
    const endIndex = avatarLink.lastIndexOf('.');

    // Extract id from 'avatarLink'
    const publicId = avatarLink.substring(startIndex, endIndex);

    uploadOptions.public_id = publicId;
  }

  const uploadedImage = await cloudinary.uploader.upload(
    image,
    uploadOptions,
    function (error, result) {
      if (error) {
        console.log(error);
      }
      console.log(result);
    }
  );

  // WRITE CODE TO STORE 'uploadedImage.secure_url' TO DATABASE HERE

  console.log(uploadedImage);

  try {
    res.status(200).json({ success: true, data: uploadedImage });
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => console.log(`Server listening on http://localhost:${process.env.SERVER_PORT}`));