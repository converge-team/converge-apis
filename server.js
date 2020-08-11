require('dotenv').config();

const express          = require('express');
const http             = require('http');
const fs               = require('fs')
const path             = require('path');
const helmet           = require('helmet');
const bodyParser       = require('body-parser');
const socketio         = require('socket.io');
const session          = require('express-session');
const MongoStore       = require('connect-mongo')(session);
const passport         = require('passport');
const passportSocketIo = require('passport.socketio');
const cookieParser     = require('cookie-parser');
const webPush          = require('web-push');
const mongoose         = require('mongoose');
const flash            = require('express-flash-messages');
const cors             = require('cors');

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

const sessionStore = new MongoStore({
    mongooseConnection: mongoose.connection
});

var sess = {
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    httpOnly: false,
    cookie: {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 30
    }
};

app.use(session(sess));

app.use(passport.initialize());

app.use(passport.session());
app.use(cors());

io.use(passportSocketIo.authorize({
    key: 'connect.sid',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    passport: passport,
    cookieParser: cookieParser
}));

app.use(express.static(path.join(process.cwd(), 'public')))
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))
app.use('/auth', authRoutes)
app.use('/messages', messagesRoutes);

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

// const nodemailer = require("nodemailer");

// // async..await is not allowed in global scope, must use a wrapper
// async function main() {
//   // Generate test SMTP service account from ethereal.email
//   // Only needed if you don't have a real mail account for testing
//   let testAccount = await nodemailer.createTestAccount();

//   // create reusable transporter object using the default SMTP transport
//   let transporter = nodemailer.createTransport({
//     host: "smtp.ethereal.email",
//     port: 587,
//     secure: false, // true for 465, false for other ports
//     auth: {
//       user: testAccount.user, // generated ethereal user
//       pass: testAccount.pass // generated ethereal password
//     }
//   });

//   // send mail with defined transport object
//   let info = await transporter.sendMail({
//     from: '"converge" judgegodwins@gmail.com', // sender address
//     to: "thronggodwins@gmail.com", // list of receivers
//     subject: "Hello ✔", // Subject line
//     text: "Hello world?", // plain text body
//     html: "<b>Hello world?</b>" // html body
//   });

//   console.log("Message sent: %s", info.messageId);
//   // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

//   // Preview only available when sending through an Ethereal account
//   console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
//   // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
//}

app.get('/send', (req,res) => main().catch(console.error));


const routes = require('./routes/router');
const auth = require('./auth');
const socket = require('./socket').socketConnection;
const User = require('./model/User');


mongoose.connect(process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, (err, db) => {
    if(err) console.log('DB Error: ', err)
    if(!err && db) console.log('DB connected');

    auth(app, User)
    routes(app, User);
    socket(io, User, app);
    server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
})

module.exports = {
    httpserver: server
}