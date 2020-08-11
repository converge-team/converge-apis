const jwt = require('jsonwebtoken');
const User = require('../model/User');
const Response = require('../utils/response');
const bcrypt = require('bcryptjs');
const emailValidator = require('email-validator')
const crypt = require('../utils/crypt');
const verifyToken = require('../middlewares/auth');
const sendMail = require('../utils/sendmail');


exports.register = async (req, res) => {

    try {

        const { username, email, first_name, last_name, gender, password } = req.body;

        let userThere = await User.findOne({ username });
    
        if(userThere)
            return Response.failure({ res, statusCode: 400, readMessage: "The username is already registered" });
        

        let newUser = new User({
            username,
            email,
            first_name,
            last_name,
            gender,
            password: bcrypt.hashSync(password, 12),
            lastSeen: new Date(),
            api_token: 'null'
        });

        let objToSign = Object.assign({}, newUser.toObject());
        delete objToSign.friends;
        delete objToSign.api_token;
        delete objToSign.password;
        delete objToSign.__v;
        

        newUser.save()
            .then(async result => {
                let cipher = await crypt.createCipher(JSON.stringify({email: objToSign.email, username: objToSign.username}));
                let verificationUrl = `${req.protocol}://${req.headers.host}/auth/verify-email/${cipher}`;

                sendMail({
                    to: result.email,
                    from: 'judgegodwins@gmail.com',
                    subject: 'Account Verification',
                    html: `<a href="${verificationUrl}" style="text-align: center;"><button>Verify-Email</button></a>`        
                },
                (error, data) => {
                    if(error) return Response.failure({ res, error, readMessage: "Something went wrong while creating the user", statusCode: 500});
                    console.log(data);
                    Response.success({
                        res,
                        message: "User registered successfully. Check your email for a verification link",
                        statusCode: 200,
                        data: {
                            user: result
                        }
                    });
                })
            })
            .catch(error => Response.failure({ res, error, readMessage: "Something went wrong while creating the user", statusCode: 500}))

    } catch(error) {
        Response.failure({ res, error, statusCode: 500, readMessage: "Internal Server Error" })
    }
}

exports.login = (req, res) => {
    const { username_or_email, password } = req.body;
    const which = (() => {
        if(emailValidator.validate(username_or_email)) {
            return { email: username_or_email }
        } else {
            return { username: username_or_email }
        }
    })();

    // console.log(which)

    User.findOne(which)
        .then(user => {
            if(!user) return Response.failure({res, readMessage: "User not found", statusCode: 404});
            if(!user.is_verified) return Response.failure({res, readMessage: "Account not verified. Please check your mailbox for a verification mail", statusCode: 404})

            bcrypt.compare(password, user.password, (error, result) => {
                if(error) return Response.failure({ res, error, statusCode: 400, readMessage: "Username or password incorrect" });

                if(!result) return Response.failure({ res, statusCode: 400, readMessage: "Username or password incorrect" });
                
                const objToSign = Object.assign({}, user.toObject(), );
                delete objToSign.friends;
                delete objToSign.api_token;
                delete objToSign.password;
                delete objToSign.__v;
                delete objToSign.pushSubscription;

                let token = jwt.sign(
                    objToSign,
                    process.env.JWT_KEY,
                    {
                        expiresIn: '20d'
                    }
                );

                user.api_token = token;
                user.save()
                    .then(result => {
                        Response.success({ 
                            res,
                            statusCode: 200,
                            message: "Successfully logged in",
                            data: {
                                user: result,
                                api_token: result.api_token
                            }
                        })
                    })
                    .catch(error => Response.failure({ res, error, statusCode: 500, readMessage: "Something went wrong" }))
                
            })

        })
        .catch(error => Response.failure(
            { res, error, statusCode: 500, readMessage: "Something went wrong" }
        ))

}


exports.verifyEmail = (req, res) => {
    let stringifiedInfo = crypt.decipherHash(req.params.encryptedInfo);
    let info = JSON.parse(stringifiedInfo);
    console.log('info >>> ', info);
    User.findOne({ email: info.email })
        .then(user => {
            if(!user) return Response.failure({ res, statusCode: 400, readMessage: "User not found" });
            user.is_verified = true;
            
            const objToSign = Object.assign({}, user.toObject(), );
            delete objToSign.friends;
            delete objToSign.api_token;
            delete objToSign.password;
            delete objToSign.__v;
            delete objToSign.pushSubscription;


            const token = jwt.sign(
                objToSign,
                process.env.JWT_KEY,
                {
                    expiresIn: '20d'
                }
            );

            user.api_token = token;

            user.save()
                .then(result => {
                    Response.success({
                        res,
                        statusCode: 200,
                        message: "Cheers! Your account has been verified.",
                        data: {
                            user: result,
                            api_token: result.api_token
                        }
                    })  
                })

        })
}
