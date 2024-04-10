const jwt = require("jsonwebtoken");
const peerServer = require("./signaling.cjs");
const updates = require("./updates.cjs");

/**
 * @typedef {import("socket.io").Server} SocketIoServer
 * @typedef {{socket: SocketIoSocket, currentRoom: string | null}} UserData
 */

/**
 * @type {Map<[userEmail: string], UserData}
 */
const uidMap = new Map();

/**
 * @param {{io: SocketIoServer}} param0
 */
function setup({ io, pool }) {
  io.use(async (socket, next) => {
    socket.data.db = function (sql, values) {
      return new Promise(async (resolve, reject) => {
        let db = null;
        try {
          db = await pool.getConnection();
          db.connection.config.namedPlaceholders = true;

          await db.query(`SET SESSION sql_mode = "TRADITIONAL"`);
          await db.query(`SET time_zone = '-8:00'`);

          const queriedData = await db.query(sql, values);

          db.release();
          resolve(queriedData);
        } catch (err) {
          console.log(err);
          if (db) db.release();
          reject(err);
          throw err;
        }
      });
    };
    next();
  });

  io.use((socket, next) => {
    socket.handshake.cookies = Object.fromEntries(
      socket.handshake.headers.cookie.split("; ").map((a) => a.split("="))
    );

    const token = socket.handshake.cookies.token;

    if (token == null) {
      return next(new Error("Invalid Token"));
    }

    jwt.verify(token, process.env.JWT_KEY, async (err, user) => {
      if (err) {
        console.log(err);
        return next(new Error("Invalid Token"));
      }
      try {
        const [[queriedUser]] = await socket.data.db(
          `SELECT * FROM users WHERE email = :userEmail AND password = :userPW AND deleted = 0`,
          {
            userEmail: user.email,
            userPW: user.securePassword,
          }
        );
        const userID = queriedUser.id;

        //get all owned teams
        const [ownedTeamsArr] = await socket.data.db(
          `SELECT uid FROM teams WHERE OwnerID = :ownerID AND deleted = false`,
          {
            ownerID: userID,
          }
        );

        //get all joined teams
        const [joinedTeamsArr] = await socket.data.db(
          ` SELECT teams.uid from teamslinks left join teams on teamslinks.teamID = teams.ID WHERE teamslinks.addUser = :addUser and teamslinks.deleted = false`,
          {
            addUser: userID,
          }
        );

        //append teams together
        const teamList = [...ownedTeamsArr, ...joinedTeamsArr].map(
          (team) => team.uid
        );
        socket.data.user = {
          uid: queriedUser.email,
          username: queriedUser.username,
          groups: teamList,
        };
        next();
      } catch (error) {
        console.error("Error getting socket user data: ", error);
        next(new Error("Error getting socket user data"));
      }
    });
  });

  const { sockets } = peerServer(io);

  updates(io, sockets, uidMap);
}

module.exports = { sockets: uidMap, setup };
