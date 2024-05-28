const express = require("express");
const router = express.Router()

router.get("/load", async (req, res) => {
  const {username,peerUsername} = req.query
  const userId = await findUserId(req,username);
  const peerUserId = await findUserId(req,peerUsername);
    try {
   const messages = await req.db.query(
    `SELECT * FROM userschats
    WHERE deleted = false 
    AND ((userSender = ? AND userReciever = ?)
        OR (userSender = ? AND userReciever = ?))
    ORDER BY sentAt ASC;`,
    [userId, peerUserId, peerUserId, userId]
   );
   res.json({ success: true, data: messages})
}catch(error){
res.status(500).json({error:'Fail to fetch chat messages'})
   }
});

router.get("/loadlatest", async (req, res) => {
  const {username,peerUsername} = req.query
  const userId = await findUserId(req,username);
  const peerUserId = await findUserId(req,peerUsername);
    try {
   const messages = await req.db.query(
    `SELECT * FROM userschats
    WHERE (userSender = ? AND userReciever = ?)
    OR (userSender = ? AND userReciever = ?)
    ORDER BY sentAt DESC
    LIMIT 1;`,
    [userId, peerUserId, peerUserId, userId]
   );
   res.json({ success: true, data: messages})
}catch(error){
res.status(500).json({error:'Fail to fetch chat messages'})
   }
});

router.post("/send", async(req,res)=>{
    const {userSender,userReciever,message} = req.body
    const senderId = await findUserId(req,userSender);
    const recieverId = await findUserId(req,userReciever);
    try{
        await req.db.query(
        `INSERT INTO userschats (userSender,userReciever,message,sentAt,isFile,deleted)
        VALUES(?,?,?,NOW(),0,0)`,
        [senderId, recieverId, message]
        )
        res.json({success:true,message:'Message sent successfully'})
    }
    catch(error){
      console.error("Error inserting message:", error);
      res.status(500).json({error:'Fail to update messages to database'})
    }
    
})


router.put("/edit", async (req, res) => {
  try {
    const {userChatId,message,userSender} = req.body
    if (!userSender) {
      res.status(400).json({ success: false, message: "Error: Missing userSender" });
      return;
    }
    const senderId = await findUserId(req, userSender);
    if (!senderId) {
      res.status(404).json({ success: false, message: "Error: UserSender not found" });
      return;
    }
    if (!userChatId) {
      res
        .status(403)
        .json({ success: false, message: "Error: Missing chatID" });
      return;
    }
   const response = await req.db.query(
      `UPDATE userschats SET message = :message
      WHERE id=:id AND userSender = :userSender AND deleted = false;`,
      {
        id:userChatId,
        message,
        userSender:senderId
      }
    );
    res.json({ success: true});
  } catch (error) {
    res.status(500).json({ success: false, message: "Fail to update message" });
  }
});
router.put("/delete", async (req, res) => {
  try {
    const { userChatId, userSender } = req.body;

    // Check if userSender is provided
    if (!userSender) {
      return res.status(400).json({ success: false, message: "Error: Missing userSender" });
    }

    // Find the ID of the sender
    const senderId = await findUserId(req, userSender);
    if (!senderId) {
      return res.status(404).json({ success: false, message: "Error: UserSender not found" });
    }

    // Check if userChatId is provided
    if (!userChatId) {
      return res.status(403).json({ success: false, message: "Error: Missing chatID" });
    }

    // Update the database to mark the message as deleted
    const response = await req.db.query(
      `UPDATE userschats SET deleted = true
      WHERE id=:id AND userSender = :userSender AND deleted = false;`,
      {
        id: userChatId,
        userSender:senderId
      }
    );
    // Send success response
    res.json({ success: true });
  } catch (error) {
    // Handle errors
    console.error("Error deleting message:", error);
    res.status(500).json({ success: false, message: "Failed to delete message" });
  }
});


//Functions
//retrieves users id from the stored cookie
async function findUserId(req,username) {
  const [[queriedUser]] = await req.db.query(
    `SELECT * FROM users WHERE username=:username AND deleted = 0`,
    {
     username:username,
    //  userSender:senderId
    }
  );
  return queriedUser.id;
}



module.exports = router