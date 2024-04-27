function userChatSocket(io) {
  const users = {};
  io.on("connection", (socket) => {

    socket.on("set username", (username) => {
      users[username] = socket.id;
    });
    socket.on("disconnect", (username) => {
      Object.keys(users).forEach((username) => {
        if (users[username] === socket.id) {
          delete users[username];
        }
      });
    });

    socket.on("chat message", (data) => {
      const { recipient, message } = data;
      const recipientSocketId = users[recipient];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("chat message", message);
      } else {
        console.log(
          `Recipient ${recipient} not found or failed to send message`
        );
      }
    });

    socket.on("edit message", (data) => {
      const { recipient, message, messageId } = data;
      const recipientSocketId = users[recipient];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("edit message", { messageId, message });
      } else {
        console.log(
          `Recipient ${recipient} not found or failed to update message`
        );
      }
    });

    socket.on("delete message", (data) => {
      const { recipient,messageId } = data;
      const recipientSocketId = users[recipient];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("delete message", { messageId});
      } else {
        console.log(
          `Recipient ${recipient} not found or failed to update message`
        );
      }
    });

  });

 
}

module.exports = userChatSocket;
