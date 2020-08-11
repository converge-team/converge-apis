
const emailValidator = require('email-validator');
const dns = require('dns');
const Response = require('../utils/response')

const checkEmailValidity = (req, res, next) => {
    if(process.env.NODE_ENV === 'production') {
        const { email } = req.body

        if(emailValidator.validate(email)) {
            let hostname = email.substring(email.indexOf('@') + 1);
            
            dns.lookup(hostname, (err, address, family) => {
                if(address && family) {
                    return next();
                }
                return Response.failure({ res, readMessage: "Invalid email address", statusCode: 400 });
            })
        } else {
            return Response.failure({ res, readMessage: "Invalid email address", statusCode: 400 });
        }
    } else 
        next();

}

module.exports = checkEmailValidity