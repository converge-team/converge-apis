require('dotenv').config();

const express          = require('express');
const http             = require('http');
const fs               = require('fs')
const path             = require('path');
const helmet           = require('helmet');
const bodyParser       = require('body-parser');
const socketio         = require('socket.io');
const socketioJwt      = require('socketio-jwt');
const session          = require('express-session');
const MongoStore       = require('connect-mongo')(session);
// const passport         = require('passport');
const passportSocketIo = require('passport.socketio');
const cookieParser     = require('cookie-parser');
const webPush          = require('web-push');
const mongoose         = require('mongoose');
const flash            = require('express-flash-messages');
const cors             = require('cors');
const jwt              = require('jsonwebtoken');
const socketAuth       = require('./middlewares/socketAuth');

const app              = express();
const PORT             = process.env.PORT || 8000;

const server           = http.Server(app)

const io               = socketio(server);

//routes
const authRoutes = require('./routes/auth');
const messagesRoutes = require('./routes/messages');

app.use(helmet());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(flash());

app.use(cors());

io.use(socketAuth);

// io.use(passportSocketIo.authorize({
//     key: 'connect.sid',
//     secret: process.env.SESSION_SECRET,
//     store: sessionStore,
//     cookieParser: cookieParser
// }));

app.use(express.static(path.join(process.cwd(), 'public')))
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))
app.use('/auth', authRoutes )
app.use('/message', messagesRoutes);

//push subscription

app.post('/subscribepush', (req, res) => {
    const subscription = req.body;
    const subToString = JSON.stringify(subscription);
    
    User.findById(req.user._id, (err, user) => {
        user.pushSubscription = JSON.stringify(subscription);
        user.save((err, data) => {
            if(err) console.error(err);
            res.send('success');
        })
    })
})

app.get('/test', (req, res) => {
    res.render('test')
})


const routes = require('./routes/router');
const auth = require('./auth');
const socket = require('./socket').socketConnection;
const User = require('./model/User');


mongoose.connect(process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, (err, db) => {
    if(err) console.log('DB Error: ', err)
    if(!err && db) console.log('DB connected');

    // auth(app, User)
    routes(app, User);
    socket(io, User, app);
    server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
})

module.exports = {
    httpserver: server
}