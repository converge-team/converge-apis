require('dotenv').config();

const express          = require('express');
const http             = require('http');
const fs               = require('fs')
const path             = require('path');
const helmet           = require('helmet');
const bodyParser       = require('body-parser');
const mongoose         = require('mongoose');
const cors             = require('cors');
const socketAuth       = require('./middlewares/socketAuth');
const SocketServer     = require('./socket');
const User = require('./model/User');

const app              = express();
const PORT             = process.env.PORT || 8000;

const server           = http.Server(app);
const socketServer     = new SocketServer(server, socketAuth);

//routes
const authRouter = require('./routes/auth');
const messagesRouter = require('./routes/messages');
const searchRouter = require('./routes/search');
const updateRouter = require('./routes/update');

app.use(helmet());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(cors());

app.use(express.static(path.join(process.cwd(), 'public')))

app.use('/auth', authRouter )
app.use('/message', messagesRouter);
app.use('/search', searchRouter)
app.use('/update', updateRouter);

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


mongoose.connect(process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, (err, db) => {
    if(err) console.log('DB Error: ', err)
    if(!err && db) console.log('DB connected');

    // auth(app, User)
    server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
})

module.exports = {
    httpserver: server
}