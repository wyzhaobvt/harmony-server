const jwt = require("jsonwebtoken")

const failedAuthAttempts = new Map();

function authSetup(key) {
  const SIGNALING_KEY = key
  return socketAuth
  function socketAuth(socket, next) {
    let failedAuth = failedAuthAttempts.get(socket.conn.remoteAddress);
  
    if (failedAuth === undefined) {
      failedAuthAttempts.set(socket.conn.remoteAddress, 0);
      failedAuth = 0;
    }
  
    if (failedAuth > 100) {
      socket.disconnect(true);
      return;
    }
  
    const token = socket.handshake.auth.token;
  
    if (!token) {
      failedAuthAttempts.set(socket.conn.remoteAddress, failedAuth + 1);
      return next(new Error("unauthorized event"));
    }
  
    jwt.verify(token, SIGNALING_KEY, (err, data) => {
      if (err) {
        failedAuthAttempts.set(socket.conn.remoteAddress, failedAuth + 1);
        return next(new Error("unauthorized event"));
      }
      failedAuthAttempts.delete(socket.conn.remoteAddress);
      socket.data.user = data
      next();
    });
  }
}

module.exports = authSetup