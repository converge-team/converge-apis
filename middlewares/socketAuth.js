const jwt = require('jsonwebtoken');

module.exports = (socket, next) => {
    const { token } = socket.request._query;
    jwt.verify(token, process.env.JWT_KEY, (error, decoded) => {
        if(error) return next(error);
        if(!decoded) return next(new Error('Invalid Token')); 
        socket.request.user = decoded;
        return next();
    })
}