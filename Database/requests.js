require('dotenv').config();
const express = require('express');
const router = express.Router()
const { sockets } = require("../Peer/sockets.cjs");

router.use((req, res, next) => {
  req.socket = sockets.get(req.user.email).socket;
  next();
});

//Functions
//retrieves users id from the stored cookie
async function findUID(userObj, req) {
    const [[queriedUser]] = await req.db.query(
        `SELECT * FROM users WHERE email = :userEmail AND password = :userPW AND deleted = 0`,
        {
            "userEmail": userObj.email,
            "userPW": userObj.securePassword
        }
    );
    return queriedUser.id
}

//finds a target id from an email
async function findTargetUID(targetEmail, req) {
    const [[queriedUser]] = await req.db.query(
        `SELECT * FROM users WHERE email = :userEmail AND deleted = 0`,
        {
            "userEmail": targetEmail,
        }
    );
    return queriedUser?.id
}

//finds team id from uid
async function findTeamID(teamUID, teamName, req) {
    const [[queriedTeam]] = await req.db.query(
        `SELECT * FROM teams WHERE uid = :uid and name = :teamName`,
        {
            uid: teamUID,
            teamName: teamName
        }
    );

    return queriedTeam.id
}

//checks if user is the owner of the team, outputs true or false
async function verifyTeamOwner(teamUID, userID, req) {
    const [queryList] = await req.db.query(`
    SELECT * FROM teams where uid = :uid AND ownerID = :ownerID AND deleted = false`,
        {
            uid: teamUID,
            ownerID: userID
        })

    if (queryList.length) {
        return true
    }
    else {
        return false
    }
}

//checks if the uid exists in the database and outputs true or false in response
async function UIDChecker(uid, req) {
    const [dupeList] = await req.db.query(
        `SELECT * FROM requests
        WHERE uid = :uid AND deleted = false`,
        {
            uid: uid
        }
    )
    if (dupeList.length) {
        return true
    }
    else {
        return false
    }
}
// checks if a user is part of a team or has an invite to a team
async function checkUserInTeam(teamUID, teamName, userID, req) {
    const teamID = await findTeamID(teamUID, teamName, req)
    const [memberList] = await req.db.query(`
      SELECT * FROM teamslinks where teamID = :teamID AND addUser = :userID AND deleted = false`,
      {
        teamID: teamID,
        userID: userID
      }
    )
    const [ownerList] = await req.db.query(`
      SELECT * FROM teams where id = :teamID AND ownerID = :userID AND deleted = false`,
      {
        teamID: teamID,
        userID: userID
      }
    )
    const [inviteList] = await req.db.query(`
      SELECT * FROM requests where recieverID = :userID AND operation = "addToTeam" AND deleted = false`, 
      {
        userID: userID
      }
    )
    const teamInvites = inviteList.some(invite=>{
      const team = JSON.parse(invite.data)
      if (team.teamUID === teamUID && team.teamName === teamName) {
        return true
      }
    })

    if (teamInvites) {
      return {
        message: "User already invited to team",
        result: true
      }
    } else if (memberList.length || ownerList.length) {
      return {
        message: "User is already in the team",
        result: true
      }
    } else {
      return {
        message: "User is not in the team",
        result: false
      }
    }
}

/**
 * Checks if the user is already friends with the target or has a pending friend request
 * @param {number} targetID 
 * @param {number} userID 
 * @param {express.Request} req 
 * @returns {{result: boolean, message: string}}
 * @example
 * checkUserFriendsWithTarget(targetID, userID, req) // result: true -> currently friends / pending friend request
 * checkUserFriendsWithTarget(targetID, userID, req) // result: false -> not friends / no pending friend request
 */
async function checkUserFriendsWithTarget(targetID, userID, req) {
  // check if the users are already friends
  const [friendList] = await req.db.query(`
    SELECT * FROM usersLinks where ((userID1 = :userID AND userID2 = :targetID) OR (userID1 = :targetID AND userID2 = :userID)) AND deleted = false`,
    {
      userID: userID,
      targetID: targetID
    }
  )

  // check if the user has already sent a friend request to the target
  const [friendRequestList] = await req.db.query(`
    SELECT * FROM requests where ((recieverID = :userID AND senderID = :targetID) OR (recieverID = :targetID AND senderID = :userID)) AND operation = "addFriend" AND deleted = false`,
    {
      userID: userID,
      targetID: targetID
    }
  )

  if (friendList.length) {
    return {
      message: "Already friends with this user",
      result: true,
    }
  } else if (friendRequestList.length) {
    return {
      message: "Friend request is already pending",
      result: true,
    }
  } else {
    return {
      message: "Users are not friends",
      result: false,
    }
  }
}

//Endpoints
router.post("/createTeamRequest", async function (req, res) {
    try {
        const userID = await findUID(req.user, req)
        const targetID = await findTargetUID(req.body.targetEmail, req)
        let requestUID = Array.from(Array(254), () => Math.floor(Math.random() * 36).toString(36)).join("")
        const isUserInTeam = await checkUserInTeam(req.body.teamUID, req.body.teamName, targetID, req)
        if (isUserInTeam.result) {
            res.status(400).json({ success: false, message: isUserInTeam.message })
            return
        }
        const dataRaw = { teamName: req.body.teamName, teamUID: req.body.teamUID }
        const data = JSON.stringify(dataRaw)

        //duplicate checking
        while (await UIDChecker(requestUID, req)) {
            requestUID = Array.from(Array(254), () => Math.floor(Math.random() * 36).toString(36)).join('')
        }

        await req.db.query(`
        INSERT INTO requests (uid , senderID , recieverID , data , operation , status , deleted)
        VALUES (:uid , :senderID , :recieverID ,:data , "addToTeam" , "pending" , false);`,
            {
                uid: requestUID,
                senderID: userID,
                recieverID: targetID,
                data: data
            })

        res.status(200).json({ success: true })
    } catch (error) {
        console.log(error);
        res.status(500)
    }
})

router.get("/loadIncomingTeamRequest", async function (req, res) {
    try {
        const userID = await findUID(req.user, req);

        const [requestList] = await req.db.query(
            `SELECT requests.uid , requests.timeCreated, users.username , users.email, requests.data AS team
            FROM requests LEFT JOIN users on requests.SenderID = users.id
            WHERE requests.status = "pending" AND requests.deleted = false AND requests.recieverID = :userID AND requests.operation = "addToTeam";`,
            {
                userID: userID
            }
        )

        res.status(200).json({ success: true, data: requestList })
    } catch (error) {
        console.log(error);
        res.status(500)
    }
})

router.post("/resolveIncomingTeamRequest", async function (req, res) {
    try {
        //Accept/Deny Check
        const acceptedCheck = req.body.accepted

        //Deny Resolve
        if (!acceptedCheck) {
            await req.db.query(
                `UPDATE requests
                SET status = "declined" , deleted = true , timeResolved = now()
                WHERE uid = :requestUID AND deleted = false`,
                {
                    requestUID: req.body.requestUID
                }
            )
            res.status(200).json({ success: true })
            return
        }

        //Accept Resolve
        else {
            const [[reqDataRaw]] = await req.db.query(
                `SELECT recieverID , data FROM requests WHERE uid = :requestUID`
                ,
                {
                    requestUID : req.body.requestUID
                }
            );
            
            const {teamUID , teamName} = JSON.parse(reqDataRaw.data)
            const targetID = reqDataRaw.recieverID
            const teamID = await findTeamID(teamUID , teamName, req)

            await req.db.query(
                `INSERT INTO teamsLinks(teamID , addUser , deleted) 
                VALUES(:teamID , :addUser , false);`,
                {
                    addUser: targetID,
                    teamID: teamID
                }
            )
            await req.db.query(
                `UPDATE requests
                SET status = "accepted" , deleted = true , timeResolved = now()
                WHERE uid = :requestUID AND deleted = false`,
                {
                    requestUID: req.body.requestUID
                }
            )

            res.status(200).json({ "success": true })
        }
    } catch (error) {
        console.log(error);
        res.status(500)
    }
})

//Friends List Endpoints
router.post("/createFriendRequest", async function (req, res) {
    try {
        const userID = await findUID(req.user, req)
        let requestUID = Array.from(Array(254), () => Math.floor(Math.random() * 36).toString(36)).join("")
        const targetID = await findTargetUID(req.body.targetEmail, req)
        const isUserFriendsWithTarget = await checkUserFriendsWithTarget(targetID, userID, req)

        if (isUserFriendsWithTarget.result) {
            res.status(400).json({ success: false, message: isUserFriendsWithTarget.message })
            return
        }

        if (!targetID) {
            res.status(400).json({ success: false, message: "Target user not found" })
            return
        }

        //duplicate checking
        while (await UIDChecker(requestUID, req)) {
            requestUID = Array.from(Array(254), () => Math.floor(Math.random() * 36).toString(36)).join('')
        }

        await req.db.query(`
          INSERT INTO requests (uid , senderID , recieverID , operation , status , deleted)
          VALUES (:uid , :senderID , :recieverID , "addFriend" , "pending" , false);`,
          {
              uid: requestUID,
              senderID: userID,
              recieverID: targetID,
          }
        )

        const receivingSocket = sockets.get(req.body.targetEmail).socket
        receivingSocket.emit("update:new_friend_request", {username: req.user.username || req.user.email})

        res.status(200).json({ success: true })
    } catch (error) {
        console.log(error);
        res.status(500)
    }
})

router.get("/loadIncomingFriendRequest", async function (req, res) {
    try {
        const userID = await findUID(req.user, req);

        const [requestList] = await req.db.query(
            `SELECT requests.uid , requests.timeCreated, users.username , users.email, users.profileURL
            FROM requests LEFT JOIN users on requests.SenderID = users.id
            WHERE requests.status = "pending" AND requests.deleted = false AND requests.recieverID = :userID AND requests.operation = "addFriend";`,
            {
                userID: userID
            }
        )

        res.status(200).json({ success: true, data: requestList })
    } catch (error) {
        console.log(error);
        res.status(500)
    }
})

router.post("/resolveIncomingFriendRequest", async function (req, res) {
    try {
        //Accept/Deny Check
        const acceptedCheck = req.body.accepted

        const [[{senderID: targetID}]] = await req.db.query(
          `SELECT senderID FROM requests WHERE uid = :requestUID`,
          {
            requestUID: req.body.requestUID
          }
        )

        
        const [[{email: targetEmail}]] = await req.db.query(
          `SELECT email FROM users WHERE id = :targetID`,
          {
            targetID: targetID
          }
        )

        //Deny Resolve
        if (!acceptedCheck) {
            await req.db.query(
                `UPDATE requests
                SET status = "declined" , deleted = true , timeResolved = now()
                WHERE uid = :requestUID AND deleted = false`,
                {
                    requestUID: req.body.requestUID
                }
            )

            req.socket.to(sockets.get(targetEmail).socket.id).emit("update:reject_friend_request", {username: req.user.username || req.user.email})

            res.status(200).json({ success: true })
            return
        }

        //Accept Resolve
        else {
            const [[reqDataRaw]] = await req.db.query(
                `SELECT senderID , recieverID FROM requests WHERE uid = :requestUID`
                ,
                {
                    requestUID : req.body.requestUID
                }
            );
            
            const senderID = reqDataRaw.senderID
            const targetID = reqDataRaw.recieverID

            await req.db.query(
                `INSERT INTO usersLinks(userID1 , userID2 , deleted) 
                VALUES(:sender , :reciever , false);`,
                {
                    sender : senderID,
                    reciever : targetID
                }
            )
            await req.db.query(
                `UPDATE requests
                SET status = "accepted" , deleted = true , timeResolved = now()
                WHERE uid = :requestUID AND deleted = false`,
                {
                    requestUID: req.body.requestUID
                }
            )

            req.socket.to(sockets.get(targetEmail).socket.id).emit("update:accept_friend_request", {username: req.user.username || req.user.email})

            req.socket.emit("update:accept_friend_request", {username: req.user.username || req.user.email})

            res.status(200).json({ "success": true })
        }
    } catch (error) {
        console.log(error);
        res.status(500)
    }
})


//router
module.exports = router