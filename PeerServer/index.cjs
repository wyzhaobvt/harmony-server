const jwt = require("jsonwebtoken")
const { v4: uuid } = require("uuid");
require("dotenv").config()
const ID = "peer:";

/**
 * @typedef {import("socket.io").Server} SocketIoServer
 * @typedef {import("socket.io").Socket} SocketIoSocket
 * @typedef {{socket: SocketIoSocket, currentRoom: string | null}} UserData
 */

/**
 * @param {SocketIoServer} io
 */

function peerServer(io) {
  /**
   * @type {Map<string, UserData>}
   */
  const sockets = new Map();
  /**
   * @type {Set<string>}
   */
  const rooms = new Set();

  io.on("connection", (socket) => {
    console.log("socket connected");

    sockets.set(socket.id, { socket, currentRoom: null });

    socket.use(([event, ...args], next) => {
      console.log(`Socket emitted: '${event}'`);
      next();
    });

    socket.on("error", (err) => {
      if (err && err.message === "unauthorized event") {
        console.log("bad request");
      }
    });

    socket.emit(ID + "me", socket.id);
    sendUsersOnlineUpdateToConnectedSockets(socket)


    socket.on("disconnect", () => {
      const currentRoom = sockets.get(socket.id).currentRoom;
      const roomIsClosed =
        io.sockets.adapter.rooms.get(currentRoom) === undefined;
      if (currentRoom && roomIsClosed) rooms.delete(currentRoom);
      sockets.delete(socket.id);
      console.log("socket disconnected",socket.id);
      sendUsersOnlineUpdateToConnectedSockets(socket)
    });

    socket.on(ID + "usersInRoom", (cb) => {
      const s = sockets.get(socket.id);
      if (!s.currentRoom) {
        cb(null);
        return;
      }
      cb(usersInRoomOfSocket(socket.id, true));
    });

    // add socket to room
    // create room if none provided
    // if two users in room request offer from newest socket
    socket.on(ID + "joinCall", (roomToJoin, cb) => {
      if (typeof roomToJoin === "function") cb = roomToJoin;
      const currentRoom = sockets.get(socket.id).currentRoom;
      if (currentRoom && roomToJoin === currentRoom) {
        cb(currentRoom);
        return;
      }
      if (currentRoom && roomToJoin !== currentRoom) {
        socket.leave(currentRoom);
      }
      const roomId = roomToJoin || "peer__" + uuid();
      socket.join(roomId);
      sockets.get(socket.id).currentRoom = roomId;
      rooms.add(roomId);
      cb(roomId);
      sendUsersOnlineUpdateToConnectedSockets(socket)
    });

    // attempts user call based on id from db
    socket.on(ID + "callUser", ({id, type}, cb) => {
      let toSocket = null
      if (type === "uid") {
        toSocket = getSocketIdFromUid(id);
      } else if (type === "socket") {
        toSocket = id
      }

      if (!toSocket) {
        cb({
          success: false,
          message: "user offline",
        });
        return;
      }
      const roomId = uuid();

      io.to(toSocket).emit(ID+"callUser", {socketId: socket.id, roomId, username: sockets.get(socket.id).socket.data.user.username});
      cb({success: true, message: "request sent", roomId})
    });

    socket.on(ID+"rejectCall", (socketId)=>{
      io.to(socketId).emit(ID+"rejectCall",socketId)
    })

    socket.on(ID + "leaveCall", () => {
      const s = sockets.get(socket.id);
      const currentRoom = s.currentRoom;
      const roomIsClosed =
        io.sockets.adapter.rooms.get(currentRoom) === undefined;
      socket.leave(currentRoom);
      if (currentRoom && roomIsClosed) rooms.delete(currentRoom);
      sendUsersOnlineUpdateToConnectedSockets(socket)
      s.currentRoom = null;
    });

    // from client that just created an offer which needs
    // to be sent to the user in the room
    // client should respond with "answer" emit
    socket.on(ID + "offer", (data) => {
      socket.to(data.socketId).emit(ID + "offer", {
        type: data.type,
        direction: "incoming",
        offer: data.offer,
        socketId: socket.id,
        room: data.room,
        streamTypes: data.streamTypes
      });
    });

    socket.on(ID + "answer", (data) => {
      socket.to(data.socketId).emit(ID + "answer", {
        answer: data.answer,
        socketId: socket.id,
        type: data.type,
        streamTypes: data.streamTypes
      });
    });

    socket.on(ID + "iceCandidate", (data) => {
      const { candidate } = data;
      const room = sockets.get(socket.id).currentRoom;
      socket.broadcast.to(room).emit(ID + "iceCandidate", {
        candidate,
        socketId: socket.id,
        type: data.type,
        direction: data.direction,
      });
    });

    /**
     * emits 'usersOnline' to all sockets that are in any of the same groups as 'fromSocket'
     * @param {SocketIoSocket} fromSocket socket to test sockets against
     */
    function sendUsersOnlineUpdateToConnectedSockets(fromSocket) {
      for (const socketId of io.sockets.adapter.sids.keys()) {
        const socket = sockets.get(socketId).socket
        const socketData = socket.data.user
        if (!socketData.groups.some(groupId=>fromSocket.data.user.groups.includes(groupId))) continue
        io.to(socketId).emit(ID + "usersOnline", getOnlineUsers(socket.id));
      }
    }

    function getSocketIdFromUid(userId) {
      const socketIds = io.sockets.adapter.sids.keys();
      for (const socketId of socketIds) {
        if (sockets.get(socketId)?.socket.data.user.uid === userId)
          return socketId;
      }
      return null;
    }

    function getOnlineUsers(socketId) {
      const myData = sockets.get(socketId).socket.data.user
      const users = Array.from(io.sockets.adapter.sids.keys()).reduce((prev,curr)=>{
        const socket = sockets.get(curr).socket
        const userData = socket.data.user
        if (curr !== socketId && !userData.groups.some(groupId=>myData.groups.includes(groupId))) {
          return prev
        }
        prev[curr] = {
          uid: userData.uid,
          username: userData.username,
        }
        return prev
      },{});

      const activeRooms = io.sockets.adapter.rooms;
      const groups = (socket.data.user.groups || []).reduce((prev, curr) => {
        const usersInRoom = activeRooms.get(curr);
        if (!usersInRoom) {
          prev[curr] = [];
        } else {
          prev[curr] = Array.from(usersInRoom);
        }
        return prev;
      }, {});
      return {
        users,
        groups,
      };
    }
  });

  /**
   * @param {string} id room id
   * @param {string} filter filter out `id` from returned sockets
   * @returns {string[]} list of socket ids in room
   */
  function usersInRoomOfSocket(id, filter) {
    const room = sockets.get(id).currentRoom;
    if (!room) return [];
    const socketsInRoom = Array.from(io.sockets.adapter.rooms.get(room));
    return filter
      ? socketsInRoom.filter((socketId) => socketId !== id)
      : socketsInRoom;
  }
}

const failedAuthAttempts = new Map();

function socketAuth(socket, next) {
  let failedAuth = failedAuthAttempts.get(socket.conn.remoteAddress);

  if (failedAuth === undefined) {
    failedAuthAttempts.set(socket.conn.remoteAddress, 0);
    failedAuth = 0;
  }

  if (failedAuth > 5) {
    socket.disconnect(true);
    return;
  }

  const token = socket.handshake.auth.token;

  if (!token) {
    failedAuthAttempts.set(socket.conn.remoteAddress, failedAuth + 1);
    return next(new Error("unauthorized event"));
  }

  jwt.verify(token, process.env.SIGNALING_KEY, (err, data) => {
    if (err) {
      failedAuthAttempts.set(socket.conn.remoteAddress, failedAuth + 1);
      return next(new Error("unauthorized event"));
    }
    failedAuthAttempts.delete(socket.conn.remoteAddress);
    socket.data.user = data
    next();
  });
}

module.exports = {peerServer, socketAuth};
