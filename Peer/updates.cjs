/**
 * @param {import("socket.io").Server} io
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
