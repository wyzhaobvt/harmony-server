function userChatSocket(io) {
  const users = {};
  io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("set username", (username) => {
      console.log(`User ${username} connected with socket ID: ${socket.id}`);
      users[username] = socket.id;
    });
    socket.on("disconnect", (username) => {
      console.log(`${username} disconnected`);
      Object.keys(users).forEach((username) => {
        if (users[username] === socket.id) {
          delete users[username];
          console.log(users);
        }
      });
    });

    socket.on("chat message", (data) => {
      const { recipient, message } = data;
      const recipientSocketId = users[recipient];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("chat message", message);
        console.log(`Message sent to ${recipient}: ${message}`);
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
        console.log(`Message sent to ${recipient}: ${message}`);
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
        console.log(`Delete Message from ${recipient}`);
      } else {
        console.log(
          `Recipient ${recipient} not found or failed to update message`
        );
      }
    });

  });

 
}

module.exports = userChatSocket;
