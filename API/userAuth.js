const express = require('express');
const cors = require('cors')
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
require('dotenv').config();

const port = process.env.SERVER_PORT;

const app = express();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

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
app.use(cookieParser())
app.use(cors({
    origin: `http://localhost:${process.env.CLIENT_PORT}`,
    credentials: true,
}));


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

//Endpoints

//Register User
app.post("/registerUser",
    async function (req, res) {
        try {
            // Duplicate Email Check
            const dupeCheckEmail = req.body.email;

            const [testDupes] = await req.db.query(
                `SELECT * FROM users WHERE email = :dupeCheckEmail AND deleted = 0;`, {
                dupeCheckEmail,
            })

            if (testDupes.length) {
                res.status(409).json({ "success": false, "message": "Email already in use" });
                return
            }

            // Password Encryption
            const hashPW = await bcrypt.hash(req.body.password, 10);
            const user = { "email": req.body.email, "securePassword": hashPW };

            //To Do: Create a personal call link/key


            // Inserting new user into db
            await req.db.query('INSERT INTO users (email, password, username , userCallLink , deleted) VALUES (:email, :password, :email , :calllink , false)', {
                email: user.email,
                password: user.securePassword,
                calllink: "temp"
            });

            const accessToken = jwt.sign(user, process.env.JWT_KEY);

            res.secureCookie("token", accessToken);

            res.status(201).json({ "success": true })
        } catch (error) {
            console.log(error);
            res.status(500).send("An error has occurred");
        }
    }
);

//Login User
app.post("/loginUser",
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

            const accessToken = jwt.sign({ "email": user.email, "securePassword": user.password }, process.env.JWT_KEY);

            res.secureCookie("token", accessToken)

            res.status(200).json({ "success": true})
        } catch (error) {
            console.log(error);
            res.status(500).send("An error has occurred");
        }
    }
);


//Delete User


//Update Username


//Functions
function validatePassword(password) {
    const lengthCheck = password.length >= 12;
    const specialCheck = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
    const forbiddenList = ['password', '123', '1234', '12345', '123456'];
    const forbiddenCheck = !forbiddenList.includes(password.toLowerCase());

    return lengthCheck && specialCheck && forbiddenCheck;
}

//Listener

app.listen(port, () => console.log(`Server listening on http://localhost:${process.env.SERVER_PORT}`));