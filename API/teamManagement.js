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

//Endpoints

//Create Team
app.post("/createTeam", async function (req, res) {
    try {
        const UID = Array.from(Array(254), () => Math.floor(Math.random() * 36).toString(36)).join('');
        const UserID = await findUID(req.user, req);

        //Optional: Create a duplicate name prevention function

        //Optional: Create a duplicate uid prevention function

        await req.db.query(
            `INSERT INTO teams (uid , ownerID , teamCallLink , name , deleted)
            VALUES (:uid , :ownerID , :callLink , :name , false)`,
            {
                uid: UID,
                ownerID: UserID,
                callLink: "temp",
                name: req.body.teamName
            }
        );

        res.status(200).json({ "success": true })
    } catch (error) {
        console.log(error);
        res.status(500).send("An error has occurred");
    }
})

//Add Team Link
app.post("/addToTeam", async function (req, res) {
    try {
        const userID = await findUID(req.user, req);
        const targetID = await findTargetUID(req.body.targetEmail, req);
        const teamID = await findTeamID(req.body.teamID, req.body.teamName, req);

        //to do, check if command giver either is owner or member of team

        await req.db.query(
            `INSERT INTO teamsLinks(teamID , addUser , deleted) 
            VALUES(:teamID , :addUser , false);`,
            {
                addUser: targetID,
                teamID: teamID
            }
        )
        res.status(200).json({ "success": true })
    } catch (error) {
        console.log(error);
        res.status(500).send("An error has occurred");
    }
})

//Load Team List
app.get("/loadJoinedTeams", async function (req, res) {
    try {
        const userID = await findUID(req.user, req);
        const [teamList] = await req.db.query(
            `SELECT name , uid FROM teams FULL JOIN teamslinks WHERE ownerID = :userID OR addUser = :userID`, //redo query to filter out deleted. current issue "deleted column is ambiguous"
            {
                userID: userID
            })
        res.status(200).json({ "success": true, "data": teamList })
    } catch (error) {
        console.log(error);
        res.status(500).send("An error has occurred");
    }
})

//Remove Team Link
app.post("/removeTeamLink", async function (req, res) {
    try {
        const userID = await findUID(req.user, req);
        const isOwner = await verifyTeamOwner(req.body.teamUID, userID, req)
        if (!isOwner) {
            res.status(400).json({ "succcess": false })
            return
        }

        const targetID = findTargetUID(req.body.targetEmail, req)
        const teamID = findTeamID(req.body.teamUID, req.body.teamName, req)
        await req.db.query(`
        UPDATE teamslinks
        SET deleted = true
        WHERE addUser = :addUser AND teamID = :teamID AND deleted = false`,
            {
                addUser: targetID,
                teamID: teamID
            })

        res.status(200).json({ "success": true })
    } catch (error) {
        console.log(error);
        res.status(500).send("An error has occurred");
    }
})

//Leave Team
app.post("/leaveTeam", async function (req, res) {
    try {
        const userID = await findUID(req.user, req);
        const teamID = await findTeamID(req.body.teamUId, req.body.teamName, req);
        const ownerCheck = await verifyTeamOwner(req.body.teamUID, userID, req);

        if (ownerCheck) {
            res.status(400).send("Owner cannot remove self. Please transfer ownership or use Delete Team").json({ "success": false });
            return
        }

        await req.db.query(`
        UPDATE teamslinks
        SET deleted = true
        WHERE addUser = :userID AND teamID = :teamID`,
            {
                userID: userID,
                teamID : teamID
            });

        res.status(200).json({ "succcess": true })
    } catch (error) {
        console.log(error);
        res.status(500).send("An error has occurred");
    }

})

//Update Team Name
app.post("updateTeamName", async function (req, res) {
    try {
        const userID = await findUID(req.user, req);
        const ownerCheck = await verifyTeamOwner(req.body.teamUID, userID, req);
        const teamID = await findTeamID(req.body.teamUID, req.body.teamNameOld, req);

        if (!ownerCheck) {
            res.status(400).json({"success" : false}.send("Only the owner of a team may change its name"))
            return
        }

        await req.db.query(`
        UPDATE teams
        SET name = :newName
        WHERE ID = :teamID AND UID = :UID AND ownerID = :ownerID AND deleted = false`,
        {
            newName : req.body.teamNameNew,
            ownerID : userID,
            UID : req.body.teamUID,
            teamID : teamID
        })

        res.status(200).json({"success" : true})
    } catch (error) {
        console.log(error);
        res.status(500).send("An error has occurred");
    }
})

//Delete Team
app.post("deleteTeam", async function (req, res) {
    try {
        const userID = await findUID(req.user, req);
        const ownerCheck = await verifyTeamOwner(req.body.teamUID, userID, req);
        const teamID = await findTeamID(req.body.teamUID, req.body.teamName, req);

        if (!ownerCheck) {
            res.status(400).json({"success" : false}.send("Only the owner of a team may delete it"))
            return
        }

        //remove team links
        await req.db.query(`
        UPDATE teamlinks
        SET deleted = true
        WHERE teamID = :teamID`,
        {
            teamID : teamID
        })

        //delete team
        await req.db.query(
            `UPDATE teams
            SET deleted = true
            WHERE id = :teamID`,
            {
                teamID : teamID
            }
        )
        
        res.status(200).json({"success" : true})
    } catch (error) {
        console.log(error);
        res.status(500).send("An error has occurred");
    }
})

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

//Listener

app.listen(port, () => console.log(`Server listening on http://localhost:${process.env.SERVER_PORT}`));