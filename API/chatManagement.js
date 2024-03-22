const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const port = 3 + +process.env.SERVER_PORT;

const app = express();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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
app.use(cookieParser());
app.use(
  cors({
    origin: `http://localhost:${process.env.CLIENT_PORT}`,
    credentials: true,
  })
);

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

app.post("/loadTeamChat", async (req, res) => {
  try {
    const { teamUID, teamName } = req.body;
    const userId = await findUserId(req);
    const {teamId} = await findJoinedTeamId(userId, teamUID, teamName, req);

    if (!teamId) {
      res
        .status(403)
        .json({ success: false, message: "User does not have access to team" });
      return;
    }
    
    const [chats] = await req.db.query(
      `SELECT chats.uid, chats.sentAt, users.username AS sender, chats.message, users.profileURL, chats.isFile, chats.edited
      FROM teamschats AS chats
      JOIN users ON chats.messageUser = users.id
      WHERE chats.teamID = :teamId AND chats.deleted = 0;`,
      {
        teamId: teamId,
      }
    );

    res.json({ success: true, data: chats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

app.post("/createTeamChat", async (req, res) => {
  try {
    const { message, teamUID, teamName } = req.body;
    const uid = Array.from(Array(254), () =>
      Math.floor(Math.random() * 36).toString(36)
    ).join("");
    const userId = await findUserId(req);
    const {teamId} = await findJoinedTeamId(userId, teamUID, teamName, req);

    if (!teamId) {
      console.error("user not in team")
      res
        .status(403)
        .json({ success: false, message: "User does not have access to team" });
      return;
    }

    await req.db.query(
      `INSERT INTO teamschats (uid, teamID, messageUser, message, isFile, edited, deleted)
      VALUES (:uid, :teamId, :userId, :message, 0, 0, 0);`,
      {
        uid,
        teamId,
        userId,
        message,
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

app.post("/editTeamChat", async (req, res) => {
  try {
    const { chatUID, teamUID, teamName, message } = req.body;
    const userId = await findUserId(req);
    const {teamId} = await findJoinedTeamId(userId, teamUID, teamName, req);

    if (!teamId) {
      res
        .status(403)
        .json({ success: false, message: "User does not have access to team" });
      return;
    }

    await req.db.query(
      `UPDATE teamschats SET message = :message, edited = 1
      WHERE uid = :uid AND messageUser = :userId AND deleted = false;`,
      {
        message,
        uid: chatUID,
        userId: userId,
      }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

app.delete("/deleteTeamChat", async (req, res) => {
  try {
    const { chatUID, teamUID, teamName } = req.body;
    const userId = await findUserId(req);
    const {teamId} = await findJoinedTeamId(userId, teamUID, teamName, req);

    if (!teamId) {
      res
        .status(403)
        .json({ success: false, message: "User does not have access to team" });
      return;
    }

    await req.db.query(
      `UPDATE teamschats SET deleted = 1
      WHERE uid = :uid
      AND teamID = :teamId
      AND (messageUser = :userId OR teamId IN (
        SELECT id FROM teams WHERE ownerID = :userId
      ))
      AND deleted = 0;`,
      {
        uid: chatUID,
        userId,
        teamId
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "An error has occurred" });
  }
});

//Listener
app.listen(port, () =>
  console.log(`Chat server listening on http://localhost:${port}`)
);

//Functions
//retrieves users id from the stored cookie
async function findUserId(req) {
  const [[queriedUser]] = await req.db.query(
    `SELECT * FROM users WHERE email = :userEmail AND password = :userPW AND deleted = 0`,
    {
      userEmail: req.user.email,
      userPW: req.user.securePassword,
    }
  );
  return queriedUser.id;
}

/**
 * finds team id from uid that user is in 
 * @returns {Promise<{teamId?: number, ownerId?: number}>}
 */
async function findJoinedTeamId(userId, teamUID, teamName, req) {
  const [[team]] = await req.db.query(
    `SELECT teamID AS teamId, teams.ownerID as ownerId
    FROM teamslinks
    JOIN teams ON teamslinks.teamID = teams.id
    WHERE ((teamslinks.addUser = :userId OR teams.ownerID = :userId) AND teams.uid = :uid AND teams.name = :teamName)
    AND teams.deleted = false;`,
    {
      userId: userId,
      uid: teamUID,
      teamName: teamName,
    }
  );

  return team || {};
}
