const nodemailer = require('nodemailer');
const nodemailMailgun = require('nodemailer-mailgun-transport');
const Response = require('../utils/response');

const sendMail = ({ from, to, subject, text = null, html }, cb) => {
    var success = false;
    const auth = {
        auth: {
            api_key: process.env.MAILGUN_API_KEY,
            domain: process.env.EMAIL_DOMAIN
        }
    }

    const transporter = nodemailer.createTransport(nodemailMailgun(auth));

    const mailOptions = { from, to, subject, html }

    transporter.sendMail(mailOptions, (error, data) => {
        success = true;
        cb(error, data);
    });

    return success;
}

module.exports = sendMail;