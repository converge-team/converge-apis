const User = require('../model/User')
const Response = require('../utils/response');

exports.getMessages = (req, res) => {
    User.findById(req.user._id, (err, user) => {
        if(!user) res.send('no-user')

        let allMessages = {};

        user.friends.forEach((friend) => {
            allMessages[friend._id] = friend;
        })
        
        Response.success({
            res, 
            message: "Messages",
            statusCode: 200,
            data: {
                messages: allMessages
            }
        })
    });
}

exports.getMessageForUser = (req, res) => {
    let { id } = req.query;
    User.findById(req.user._id)
        .then(user => {
            if(!user) 
                return Response.failure({
                    res, 
                    readMessage: "User not found",
                    statusCode: 400,
                })

            let friend = user.friends.find(friend => friend._id == id);
            Response.success({
                res,
                message: "Message for friend",
                statusCode: 200,
                data: {
                    messages: friend
                }
            })
        })
        .catch(error => 
            Response.failure({
                res, 
                error,
                readMessage: "Server Error",
                statusCode: 400,    
            })
        )
}

exports.getFriendAndLastMessage = (req, res) => {
    User.findById(req.user._id)
        .then(user => {
            if(!user) 
                return Response.failure({
                    res, 
                    readMessage: "User not found",
                    statusCode: 400,
                });

            let friendWithMessage = [];
            user.friends.forEach(friend => {
                let friendToPush = Object.assign({}, friend.toObject())
                friendToPush.lastMessage = friendToPush.messages[friendToPush.messages.length-1];
                delete friendToPush.messages;
                friendWithMessage.push(friendToPush)
            });

            Response.success({
                res,
                message: "Friends with last message",
                statusCode: 200,
                data: {
                    friends: friendWithMessage
                }
            })

        })
        .catch(error => {
            Response.failure({
                res, 
                error,
                readMessage: "Server Error",
                statusCode: 400,    
            })
        })
}