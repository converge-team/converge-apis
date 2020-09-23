const webPush = require('web-push');
const socketio = require('socket.io');
const socketAuth = require('./middlewares/socketAuth');

const User = require('./model/User')

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


class SocketServer {

    constructor(socketAuth) {
        this.users = [];

        this.io = null;

        this.handleSocketConnection = this.handleSocketConnection.bind(this);


        this.sockets = []
    }

    startSocketServer(httpServer) {
        this.io =   socketio(httpServer);
        this.io.use(socketAuth);

        this.handleSocketConnection();

    }

    handleSocketConnection() {
        this.io.on('connection', (socket) => {

            console.log('we have a new connection')
            console.log(socket.id)
    
            socket.username = socket.request.user.username;
            socket.userId = socket.request.user._id
            socket.status = 'online';


            this.sockets.push(socket)
    
            this.users.push({
                name: socket.username,
                id: socket.id,
                status: socket.status
            });
    
            console.log('this.users: ', this.users)
    
            // socket.id = socket.request.user.id;
    
            socket.broadcast.emit('connected', {
                username: socket.username,
                status: socket.status
            });
    
            socket.on('bring_status', (data, callback) => {
                let person = this.users.find((x) => {
                    return x.name == data.username;
                });
    
                if (!person) {
    
                    User.findOne({ username: data.username }).select({ password: 0, id: 0 }).exec((err, user) => {
                        callback({ username: data.username, time: user.lastSeen }, true)
                    })
    
                } else {
    
                    callback({username: person.name, id: person.id }, false);
                }
    
            })
    
    
            socket.broadcast.emit('online', { username: socket.request.user.username, id: socket.id })
    
    
            // User.findOne({username: socket.username}, (err, user) => {
            //     user.friends.forEach((friend) => {
            //         for(let person of this.users) {
            //             if(friend.username === person.name) {
            //                 socket.join(person.id);
            //                 socket.to(person.id).emit('online', {username: socket.username});
            //             }
            //         }
            //     })
            // })
    
            socket.on('disconnect', () => {
                console.log("user gone", socket.id)
    
                User.findOne({ username: socket.request.user.username }, (err, user) => {
                    user.lastSeen = new Date();
                    user.save((err, data) => {
                        socket.broadcast.emit('offline', { username: socket.request.user.username, time: data.lastSeen });
    
                        this.users.splice(this.users.indexOf(this.users.filter((x) => {
                            return x.id === socket.id;
                        })[0]), 1);
                    })
                })
    
            });
    
            var currentJoined
            socket.on('join', ({friend, socketId}) => {
    
                socket.join(socketId);
    
            })
    
            socket.on('read', (data) => {
                console.log('user has read')
                console.log(data.username, ' has read')
                socket.to(currentJoined).emit('read', { username: data.username })
            })
    
            socket.on('typing', ({socketId}) => {
    
                socket.to(socketId).emit('typing', { username: socket.request.user.username })
            })
    
            socket.on('stop_typing', ({socketId}) => {
                socket.to(socketId).emit('stop_typing', { username: socket.request.user.username })
            })
            // socket.on('delivered', (data) => {
            //     let target = this.users.find((x) => {
            //         return x.name == data.otherUser;
            //     }).id;
            //     socket.join(target);
            //     socket.to(target).emit('delivered', {username: data.receivingUser})
            // })
    
    
            // io.to(socket.id).emit('handle', handle)
            socket.on('new_message', (data) => {
                let senderFullname;
    
                User.findOne({ username: socket.request.user.username }).select({ password: 0 }).exec((err, sender) => {
    
                    senderFullname = sender.first_name + ' ' + sender.last_name
    
                    User.findOne({ username: data.toUser }).select({ password: 0 }).exec((err, receiver) => {
    
                        let movingFriend = indexOfFriend(sender, receiver.username);
    
                        function indexOfFriend(owner, findee) {
                            return owner.friends.find((x) => {
                                return x.username === findee;
                            });
                        }
    
                        if (movingFriend) {
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
                                _id: receiver._id,
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
                                _id: sender._id,
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
                        }
    
                        sender.save((err, d) => {
                            if (err) console.log(err);
                            receiver.save((err, d1) => {
                                if (err) console.log(err)
                                socket.to(data.socketId).emit('new_msg', {
                                    userId: socket.userId,
                                    fullname: sender.first_name + ' ' + sender.last_name,
                                    message: { content: data.message, time: new Date(), type: "received" }
                                })
                            })
                        })
    
                        if (receiver.pushSubscription) {
    
                            const pushSubscription = JSON.parse(receiver.pushSubscription);
    
                            const payload = JSON.stringify({ "title": senderFullname, "message": data.message });
    
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
    
        })
    }

}

const socketServer = new SocketServer(socketAuth);

module.exports = socketServer;