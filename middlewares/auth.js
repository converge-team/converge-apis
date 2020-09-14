const jwt = require('jsonwebtoken');
const Response = require('../utils/response');
const User = require('../model/User');

const verifyToken = (req, res, next) => {
    const token = req.headers['x-access-token'];

    if(!token) return Response.failure({res, statusCode: 400, readMessage: "You must provide a token for authentication"});

    jwt.verify(token, process.env.JWT_KEY, async function(error, decoded) {
        const user = await User.findOne({ api_token: token });
        console.log('user: ', user)
        if(error) return Response.failure({res, error, statusCode: 500, readMessage: "Internal Server Error"})
        if(!decoded || !user) {
            return Response.failure({
                res,
                statusCode: 400,
                readMessage: "Invalid token"
            })
        }
        req.user = decoded;
        next()
    });

}

module.exports = verifyToken;