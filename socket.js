const webPush = require('web-push');

const publicVapidKey = 'BOrQPL1CeyjJNJydzDcDjUozdvYjJFCeZLPUgvtl3Bp33kgUFzd8lvuvs79hFdgpbSPjb9N_kTDq265juEbPGLk',
      privateVapidKey = process.env.VAPID_KEY;

const webPushOptions = {
    gcmAPIKey: process.env.GCMAPIKEY,
    TTL: 60,
    vapidDetails: {
        subject: 'mailto: judgegodwins@gmail.com',
        publicKey: publicVapidKey,
        privateKey: privateVapidKey
    }
}


function socketConnection(io, Model, app) {
    const payload = 'New Notification';


    const users = [];

    io.on('connection', (socket) => {
        console.log('we have a new connection')
        console.log(socket.id)

        socket.username = socket.request.user.username;
        socket.status = 'online';

        users.push({
            name: socket.username,
            id: socket.id,
            status: socket.status
        });

        console.log('users: ', users)

        // socket.id = socket.request.user.id;

        socket.broadcast.emit('connected', {
            username: socket.username,
            status: socket.status
        });

        socket.on('bring_status', (data, callback) => {
            let person = users.find((x) => {
                return x.name == data.username;
            });
            
            if(!person) {

                Model.findOne({username: data.username}).select({password: 0, id: 0}).exec((err, user) => {
                    callback(user.lastSeen, true)
                })

            } else {

                callback(person.status, false);
            }

        })

        
        socket.broadcast.emit('online', {username: socket.request.user.username})


        // Model.findOne({username: socket.username}, (err, user) => {
        //     user.friends.forEach((friend) => {
        //         for(let person of users) {
        //             if(friend.username === person.name) {
        //                 socket.join(person.id);
        //                 socket.to(person.id).emit('online', {username: socket.username});
        //             }
        //         }
        //     })
        // })

        socket.on('disconnect', ()=>{
            console.log("user gone", socket.id)
            
            socket.broadcast.emit('disconnected', {username: socket.request.user.username, time: new Date()})

            Model.findOne({username: socket.request.user.username}, (err, user) => {
                user.lastSeen = new Date();
                user.save((err, data) => {
                    if(err) console.log(err);
                })
            })

            users.splice(users.indexOf(users.filter((x) => {
                return x.id === socket.id;
            })[0]), 1);


        });


        socket.on('backbutton', (data) => {
            console.log('backbutton clicked');
        })

        var currentJoined
        socket.on('join', (data) => {
            let friend = users.find((user) => {
                return user.name === data.friend;
            });

            if(friend) {
                socket.join(friend.id);
                currentJoined = friend.id;
                console.log('joined friend')
            } else {
                currentJoined = null;
                console.log('couldn\'t join')
            }

            console.log('currentJoined on join: ', currentJoined);
            console.log(users)
        })

        socket.on('read', (data) => {
            console.log('user has read')
            console.log(data.username, ' has read')
            socket.to(currentJoined).emit('read', {username: data.username})
        })

        socket.on('typing', data => {
            
            socket.to(currentJoined).emit('typing', {username: data.username})
        })
        
        socket.on('stop_typing', data => {
            socket.to(currentJoined).emit('stop_typing', {username: data.username})
        })
        // socket.on('delivered', (data) => {
        //     let target = users.find((x) => {
        //         return x.name == data.otherUser;
        //     }).id;
        //     socket.join(target);
        //     socket.to(target).emit('delivered', {username: data.receivingUser})
        // })


        // io.to(socket.id).emit('handle', handle)
        socket.on('new_message', (data) => {

            let senderFullname;

            console.log('to: ', data.toUser)
            Model.findOne({username: socket.request.user.username}).select({password: 0}).exec((err, sender) => {

                senderFullname = sender.first_name + ' ' + sender.last_name

                Model.findOne({username: data.toUser}).select({password: 0}).exec((err, receiver) => {

                    let movingFriend = indexOfFriend(sender, receiver.username);

                    function indexOfFriend(owner, findee) {
                        return owner.friends.filter((x) => {
                            return x.username === findee;
                        })[0];
                    }
                    
                    if(movingFriend) {
                        sender.friends[sender.friends.indexOf(indexOfFriend(sender, receiver.username))].messages.push({
                            content: data.message,
                            type: 'sent',
                            time: new Date()
                        })

                        
                        receiver.friends[receiver.friends.indexOf(indexOfFriend(receiver, sender.username))].messages.push({
                            content: data.message,
                            type: 'received',
                            time: new Date()
                        })
                    } else {
                        sender.friends.push({
                            username: receiver.username,
                            first_name: receiver.first_name,
                            last_name: receiver.last_name,
                            friends_status: false,
                            messages: [{
                                content: data.message,
                                type: 'sent',
                                time: new Date()
                            }]
                        })

                        receiver.friends.push({
                            username: sender.username,
                            first_name: sender.first_name,
                            last_name: sender.last_name,
                            friends_status: false,
                            messages: [{
                                content: data.message,
                                type: 'received',
                                time: new Date()
                            }]
                        })


                        let user1 = users.filter((x) => {
                            return x.name == sender.username;
                        })[0].id,
                            user2;
                        try {
                            user2 = users.filter((x) => {
                                return x.name == receiver.username;
                            })[0].id;
                            emitNewMsg(sender, user1, receiver);
                            emitNewMsg(receiver, user2, sender);
                        } catch(err) {
                            console.log(err);
                            emitNewMsg(receiver, user2, sender);
                        }
                        
                        console.log('user1: ', user1);

                        console.log('user2: ', user2)

                        function emitNewMsg(user, userSocket, otherUser) {
                            console.log('emitting new msgs', );
                            let userIndex = user.friends.find((x) => {
                                return x.username === otherUser.username;
                            });
                            console.log('socket: ', socket);
                            console.log('userIndex: ', userIndex);
                            console.log('socket rooms: ', socket.rooms);

                            socket.join(userSocket);
                            console.log('socket rooms after joining: ', socket.rooms);
                            socket.to(userSocket).emit('add_new_messages', {
                                username: otherUser.username,
                                messages: user.friends[user.friends.indexOf(userIndex)].messages
                            })

                        }


                    }



                    sender.save((err, d) => {
                        if(err) console.log(err);
                        receiver.save((err, d1) => {
                            if(err) console.log(err)
                            socket.to(currentJoined).emit('new_msg', {
                                username: socket.username, 
                                fullname: sender.first_name + ' ' + sender.last_name, 
                                message: data.message
                            })
                        })
                    })

                    if(receiver.pushSubscription) {

                        const pushSubscription = JSON.parse(receiver.pushSubscription);

                        const payload = JSON.stringify({"title": senderFullname, "message": data.message });

                        webPush.sendNotification(
                            pushSubscription,
                            payload,
                            webPushOptions
                        )
                        .catch(err => {
                            console.error('push error: ', err);
                        })
                    }

                })

            })

        })

        // socket.on('save_message', (data) => {
        //     Model.findOne({username: socket.request.user.username}, (err, user) => {
        //         user.friends.forEach((friend) => {
        //             if(friend.username === data.username) {
                        
        //                 friend.messages.push({
        //                     content: data.message,
        //                     type: 'received'
        //                 });

        //             }
        //         })

        //         user.save((err, data) => {
        //             if(err) console.log(err);
        //         });
        //     })
        // })
        socket.on('suscribe', (data) => {
            console.log(data.username, ' ', 'trying to reconnect')
            users.forEach((user) => {
                if(user.name === data.username) {
                    socket.join(user.id)
                    console.log(user.id, ' -> ', socket.id)
                }
            })
        })

    })
}


function areFriends(user1, user2, Model) {
    let truthOne, truthTwo

    let check = (user, otherUser, truth) => {

        user.friends.forEach((friend) => {
            if(friend.username == otherUser && friend.friend_status == true) {
                truth = true
            } else {
                truth = false;
            }
        })
    }

    Model.findOne({username: user1}, (err, user) => {
        if(err) console.log(err);

        check(user, user2, truthOne);

        Model.findOne({username: user2}, (err, user) => {
            check(user, user1, truthTwo);
        })
    })
    if(truthOne == truthTwo) return true;
    else return false;
}

module.exports = {
    socketConnection: socketConnection,
    areFriends: areFriends
}