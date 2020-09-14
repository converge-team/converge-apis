const jwt = require('jsonwebtoken');
const User = require('../model/User')

module.exports = (socket, next) => {
    const { token } = socket.request._query;
    jwt.verify(token, process.env.JWT_KEY, async (error, decoded) => {
        const user = await User.findOne({ api_token: token });
        if(error) return next(error);

        if(!decoded || !user) return next(new Error('Invalid Token')); 
        socket.request.user = decoded;
        return next();
    })
}