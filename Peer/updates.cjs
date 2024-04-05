/**
 * @typedef {import("socket.io").Server} SocketIoServer
 * @typedef {import("socket.io").Socket} SocketIoSocket
 * @typedef {{socket: SocketIoSocket, currentRoom: string | null}} UserData
 * @typedef {{groups: string[], username: string, uid: string}} SocketUserData
 */

/**
 * @param {SocketIoServer} io
 */
function updates(io) {
  io.on("connection", (socket) => {
    
  });
}

module.exports = updates;
