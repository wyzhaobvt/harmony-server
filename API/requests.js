require('dotenv').config();
const express = require('express');
const cors = require('cors')
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");

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

function authenticateToken(req, res, next) {
    const token = req.cookies.token
    if (token == null) { return res.sendStatus(401) };

    jwt.verify(token, process.env.JWT_KEY, (err, user) => {
        if (err) { console.log(err); return res.sendStatus(403) }
        req.user = user;
        next()
    })
}

app.use(authenticateToken);

//Functions
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

//checks if the uid exists in the database and outputs true or false in response
async function UIDChecker(uid, req) {
    const [dupeList] = await req.db.query(
        `SELECT * FROM requests
        WHERE uid = :uid AND deleted = false`,
        {
            uid: uid
        }
    )
    if (dupeList.length) {
        return true
    }
    else {
        return false
    }
}

//Endpoints
app.post("/createTeamRequest", async function (req, res) {
    try {
        const userID = await findUID(req.user, req)
        let requestUID = Array.from(Array(254), () => Math.floor(Math.random() * 36).toString(36)).join("")
        const targetID = await findTargetUID(req.body.targetEmail, req)
        const dataRaw = { teamName: req.body.teamName, teamUID: req.body.teamID }
        const data = JSON.stringify(dataRaw)

        //duplicate checking
        while (await UIDChecker(requestUID, req)) {
            requestUID = Array.from(Array(254), () => Math.floor(Math.random() * 36).toString(36)).join('')
        }

        await req.db.query(`
        INSERT INTO requests (uid , senderID , recieverID , data , operation , status , deleted)
        VALUES (:uid , :senderID , :recieverID ,:data , "addToTeam" , "pending" , false);`,
            {
                uid: requestUID,
                senderID: userID,
                recieverID: targetID,
                data: data
            })

        res.status(200).json({ success: true })
    } catch (error) {
        console.log(error);
        res.status(500)
    }
})

app.get("/loadIncomingTeamRequest", async function (req, res) {
    try {
        const userID = await findUID(req.user, req);

        const [requestList] = await req.db.query(
            `SELECT requests.uid , requests.timeCreated, users.username , users.email
            FROM requests LEFT JOIN users on requests.SenderID = users.id
            WHERE requests.status = "pending" AND requests.deleted = false AND requests.recieverID = :userID;`,
            {
                userID: userID
            }
        )

        res.status(200).json({ success: true, data: requestList })
    } catch (error) {
        console.log(error);
        res.status(500)
    }
})

app.post("/resolveIncomingTeamRequest", async function (req, res) { //remove add to team on the team management file or edit to communinicate redundancy
    try {
        //Accept/Deny Check
        const acceptedCheck = req.body.accepted

        //Deny Resolve
        if (!acceptedCheck) {
            await req.db.query(
                `UPDATE requests
                SET status = "declined" , deleted = true , timeResolved = now()
                WHERE uid = :requestUID AND deleted = false`,
                {
                    requestUID: req.body.requestUID
                }
            )
            res.status(200).json({ success: true })
            return
        }

        //Accept Resolve
        else {
            const [[reqDataRaw]] = await req.db.query(
                `SELECT recieverID , data FROM requests WHERE uid = :requestUID`
                ,
                {
                    requestUID : req.body.requestUID
                }
            );
            
            const {teamUID , teamName} = JSON.parse(reqDataRaw.data)

            const targetID = reqDataRaw.recieverID
            const teamID = await findTeamID(teamUID , teamName, req)

            await req.db.query(
                `INSERT INTO teamsLinks(teamID , addUser , deleted) 
                VALUES(:teamID , :addUser , false);`,
                {
                    addUser: targetID,
                    teamID: teamID
                }
            )
            await req.db.query(
                `UPDATE requests
                SET status = "accepted" , deleted = true , timeResolved = now()
                WHERE uid = :requestUID AND deleted = false`,
                {
                    requestUID: req.body.requestUID
                }
            )

            res.status(200).json({ "success": true })
        }
    } catch (error) {
        console.log(error);
        res.status(500)
    }
})

//Need Friends List Endpoints

//Listener
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));