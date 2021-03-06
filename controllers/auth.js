const jwt = require('jsonwebtoken');
const User = require('../model/User');
const Response = require('../utils/response');
const bcrypt = require('bcryptjs');
const emailValidator = require('email-validator')
const crypt = require('../utils/crypt');
const verifyToken = require('../middlewares/auth');
const sendMail = require('../utils/sendmail');
const objectify = require('../utils/objectify');

exports.register = async (req, res) => {

    try {

        const { username, email, first_name, last_name, gender, password } = req.body;

        let userThere = await User.findOne({ username }) || await User.findOne({ email });

        if (userThere)
            return Response.failure({ res, statusCode: 400, readMessage: "The username is already registered" });


        let newUser = new User({
            username,
            email,
            first_name,
            last_name,
            // gender,
            password: bcrypt.hashSync(password, 12),
            lastSeen: new Date(),
            api_token: 'null'
        });

        let objToSign = objectify(newUser);

        let token = jwt.sign(
            objToSign,
            process.env.JWT_KEY,
            {
                expiresIn: '20d'
            }
        );

        newUser.api_token = token

        let cipher = await crypt.createCipher(JSON.stringify({ email: objToSign.email, username: objToSign.username }));
        let verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${cipher}`;

        sendMail({
            to: objToSign.email,
            from: 'welome@convrge.live',
            subject: 'Account Verification',
            html: `<a href="${verificationUrl}" style="text-align: center;"><button>Verify-Email</button></a>`
        },
            (error, data) => {
                if (error) return Response.failure({ res, error, readMessage: "Something went wrong while creating the user", statusCode: 500 });
                console.log(data);
                newUser.save()
                    .then(async result => {
                        Response.success({
                            res,
                            message: "User registered successfully. Check your email for the verification link",
                            statusCode: 200,
                            data: {
                                user: result,
                                token: token
                            }
                        });
                    })
                    .catch(error => {
                        Response.failure({ res, error, readMessage: "Something went wrong while creating the user", statusCode: 500 })
                    })
            })


    } catch (error) {
        Response.failure({ res, error, statusCode: 500, readMessage: "Internal Server Error" })
    }
}

exports.login = (req, res) => {
    const { username_or_email, password } = req.body;
    const which = (() => {
        if (emailValidator.validate(username_or_email)) {
            return { email: username_or_email }
        } else {
            return { username: username_or_email }
        }
    })();

    // console.log(which)

    User.findOne(which)
        .then(user => {
            if (!user) return Response.failure({ res, readMessage: "User not found", statusCode: 404 });
            if (!user.is_verified) return Response.failure({ res, readMessage: "Account not verified. Please check your mailbox for a verification mail", statusCode: 404 })

            bcrypt.compare(password, user.password, (error, result) => {
                if (error) return Response.failure({ res, error, statusCode: 400, readMessage: "Username or password incorrect" });

                if (!result) return Response.failure({ res, statusCode: 400, readMessage: "Username or password incorrect" });

                const objToSign = objectify(user);

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
                                user: objectify(result, true),
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

    User.findOne({ email: info.email })
        .then(user => {
            if (!user) return Response.failure({ res, statusCode: 400, readMessage: "User not found" });
            user.is_verified = true;

            const objToSign = objectify(user);


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
                            user: objectify(result, true),
                            api_token: result.api_token
                        }
                    })
                })

        })
}

exports.authenticate = async (req, res) => {
    const user = await User.findOne({ email: req.user.email })
    if (req.user) return Response.success({ res, statusCode: 200, message: "Authenticated", data: { user } })
}

exports.validateBody = async (req, res) => {
    try {
        const { field, value } = req.query;

        const success = () => (
            Response.success({
                res,
                statusCode: 200,
                message: "valid",
            })
        )

        const failure = (message) => (
            Response.failure(
                { res, statusCode: 200, readMessage: message }
            )
        );

        const user = await User.findOne({ [field]: value });
        const emailValid = await emailValidator.validate(value);

        if (user) {
            return failure('Not available');
        } else {
            if (field === 'email') {
                if (emailValid) return success();
                else return failure("Not valid");
            } else {
                return success();
            }
        }
    } catch (error) {
        Response.failure(
            { res, error, statusCode: 500, readMessage: "Something went wrong" }
        );
    }

}