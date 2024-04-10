/**
 * @typedef {import("socket.io").Server} SocketIoServer
 * @typedef {import("socket.io").Socket} SocketIoSocket
 * @typedef {{socket: SocketIoSocket, currentRoom: string | null}} UserData
 * @typedef {{groups: string[], username: string, uid: string}} SocketUserData
 */

/**
 * @param {SocketIoServer} io
 */
function updates(io, sockets, uidMap) {
  io.on("connection", (socket) => {
    uidMap.set(socket.data.user.uid, sockets.get(socket.id));

    socket.join(socket.data.user.groups.map(group=>"online:"+group))

    socket.on("disconnect", () => {
      uidMap.delete(socket.data.user.uid);
    });
  });
}

module.exports = updates;
