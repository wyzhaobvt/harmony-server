const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
require("dotenv").config();
const router = express.Router()

router.use(express.json({ limit: "50mb" }))

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

router.use(async function (req, res, next) {
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

router.use(express.json());
router.use(cookieParser())
router.use(cors({
    origin: `http://localhost:${process.env.CLIENT_PORT}`,
    credentials: true,
}));


router.use((req, res, next) => {
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

//Endpoints

//Register User
router.post("/registerUser",
    async function (req, res) {
        try {
            // Duplicate Email Check
            const dupeEmail = await isDupeEmail(req.body.email, req);
            
            if (dupeEmail) {
              res.status(409).json({ success: false, message: "Email already in use" });
              return;
            }      

            // Password Encryption
            const hashPW = await bcrypt.hash(req.body.password, 10);
            const user = { "email": req.body.email, "username": req.body.username, "securePassword": hashPW };

            //Create a personal call link/key
            const linkUID = Array.from(Array(254), () => Math.floor(Math.random() * 36).toString(36)).join('')
            const hashedLinkHead = await bcrypt.hash(req.body.email, 10)
            const calllink = `${hashedLinkHead}/${linkUID}`

            // Inserting new user into db
            await req.db.query('INSERT INTO users (email, password, username , userCallLink , profileURL , deleted) VALUES (:email, :password, :username , :calllink , "" , false)', {
                email: user.email,
                password: user.securePassword,
                username: req.body.username,
                calllink: calllink
            });

            const accessToken = jwt.sign(user, process.env.JWT_KEY);

            res.secureCookie("token", accessToken);
            
            res.status(201).json({ "success": true })
        } catch (error) {
            console.log(error);
            res.status(500).json({ "success": false, "message": "An error has occurred" });
        }
    }
);

//Login User
router.post("/loginUser",
    async function (req, res) {
        try {
            // Find User in DB
            const [[user]] = await req.db.query('SELECT * FROM users WHERE email = :email AND deleted = 0', { email: req.body.email });

            // Password Validation
            //const compare = user && validatePassword(req.body.password) && await bcrypt.compare(req.body.password, user.securePassword);
            const compare = user && await bcrypt.compare(req.body.password, user.password);

            if (!compare) {
                res.status(401).json({ "success": false, "message": "Incorrect username or password." });
                return;
            }

            const accessToken = jwt.sign({ "email": user.email, "username": user.username, "securePassword": user.password }, process.env.JWT_KEY);

            res.secureCookie("token", accessToken)

            res.status(200).json({ "success": true })
        } catch (error) {
            console.log(error);
            res.status(500).json({ "success": false, "message": "An error has occurred" });
        }
    }
);

//Logout User
router.post("/logoutUser",
    async function (req, res) {
      try {
        res.clearCookie("token");
        res.status(200).json({ success: true });
      } catch (error) {
        console.log(error);
        res.status(500).json({ "success": false, "message": "An error has occurred" });
      }
    }
);

//Functions
function validatePassword(password) {
    const lengthCheck = password.length >= 12;
    const specialCheck = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
    const forbiddenList = ['password', '123', '1234', '12345', '123456'];
    const forbiddenCheck = !forbiddenList.includes(password.toLowerCase());

    return lengthCheck && specialCheck && forbiddenCheck;
}

//retrieves users id from the stored cookie
async function findUID(userObj, req) {
    const [[queriedUser]] = await req.db.query(
        `SELECT * FROM users WHERE email = :userEmail AND password = :userPW AND deleted = 0`,
        {
            "userEmail": userObj.email,
            "userPW": userObj.securePassword
        }
    );
    return queriedUser.id
}

// Check for duplicate email
async function isDupeEmail(dupeCheckEmail, req) {
  const [testDupes] = await req.db.query(
    `SELECT * FROM users WHERE email = :dupeCheckEmail AND deleted = 0;`,
    {
      dupeCheckEmail,
    }
  );

  if (testDupes.length) {
    return true;
  }

  return false;
}

//router
module.exports = router
