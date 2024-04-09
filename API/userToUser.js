const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
require("dotenv").config();

const port = 2 + +process.env.SERVER_PORT;

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

//functions
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

//finds a target id from an email
async function findTargetUID(targetEmail, req) {
    const [[queriedUser]] = await req.db.query(
        `SELECT * FROM users WHERE email = :userEmail AND deleted = 0`,
        {
            "userEmail": targetEmail,
        }
    );
    return queriedUser.id
}

//finds team id from uid
async function findTeamID(teamUID, teamName, req) {
    const [[queriedTeam]] = await req.db.query(
        `SELECT * FROM teams WHERE uid = :uid and name = :teamName`,
        {
            uid: teamUID,
            teamName: teamName
        }
    );
    return queriedTeam.id
}

//checks if user is the owner of the team, outputs true or false
async function verifyTeamOwner(teamUID, userID, req) {
    const [queryList] = await req.db.query(`
    SELECT * FROM teams where uid = :uid AND ownerID = :ownerID AND deleted = false`,
        {
            uid: teamUID,
            ownerID: userID
        })

    if (queryList.length) {
        return true
    }
    else {
        return false
    }
}


//endpoints
//load friends list / user 1 is the sender and user 2 is the reciever
app.post("/loadFriendsList", async function (req, res) {
    try {
        const userID = await findUID(req.user, req);

        const [recievedList] = await req.db.query(`
        SELECT users.username , users.email 
        FROM usersLinks LEFT JOIN users ON userslinks.userID2 = users.id
        WHERE userID1 = :userID and deleted = false`,
            {
                userID: userID
            })

        const [sentList] = await req.db.query(`
            SELECT users.username , users.email 
            FROM usersLinks LEFT JOIN users ON userslinks.userID1 = users.id
            WHERE userID2 = :userID and deleted = false`,
            {
                userID: userID
            })

        const exportData = [...recievedList, ...sentList]

        res.status(200).json({ "success": true, "data": exportData })
    } catch (error) {
        console.log(error);
        res.status(500).send("An error has occurred");
    }
})

//remove friend
app.post("/removeFriend", async function (req, res) {
    try {
        const userID = await findUID(req.user, req);
        const targetID = await findTargetUID(req.targetEmail, req);

        await req.db.query(
            `UPDATE userslink
            SET deleted = true
            WHERE userID1 = :userID AND userID2 = :targetID AND deleted = false`,
            {
                userID: userID,
                targetID: targetID
            }
        )

        await req.db.query(
            `UPDATE userslink
            SET deleted = true
            WHERE userID2 = :userID AND userID1 = :targetID AND deleted = false`,
            {
                userID: userID,
                targetID: targetID
            }
        )

        res.status(200).json({ "success": true, "data": exportData })
    } catch (error) {
        console.log(error);
        res.status(500).send("An error has occurred");
    }
})


//listener
app.listen(port, () =>
    console.log(`Server listening on http://localhost:${port}`)
);
