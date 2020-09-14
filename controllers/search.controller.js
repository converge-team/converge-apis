
const User = require('../model/User');

const Response = require('../utils/response');

exports.searchForPerson = (req, res) => {
    const { keyword } = req.query;

    User.find({ username: { $ne: req.user.username, $in: [new RegExp(keyword, 'gi')] } })
        .select({password: 0, __v: 0, api_token: 0, friends: 0, pushSubscription: 0 })
        .then(docs => {
            Response.success({
                res,
                message: "Search results",
                data: {
                    result: docs
                }
            })
        })
}

exports.getFriendDetails = (req, res) => {
    const { id } = req.query;
    User.findById(id)
        .select({ password: 0, __v: 0, api_token: 0, lastSeen: 0, friends: 0, pushSubscription: 0 })
        .then(result => {
            Response.success({
                res,
                message: 'Details',
                data: {
                    person: result
                }
            });
        })
        .catch(error => {
            Response.failure({
                res,
                statusCode: 400,
                error,
                readMessage: 'Server Error'
            })
        })
}