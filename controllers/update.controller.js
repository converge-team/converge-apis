
const cloudinary = require('cloudinary').v2

const User = require('../model/User');
const objectify = require('../utils/objectify');
const Response = require('../utils/response')
const sockets = require('../socket.server').sockets

exports.updatePhoto = async (req, res) => {
    const { email, username } = req.user
    const { file } = req;

    const userSocket = sockets.find(socket => socket.username === username);

    const uploadedPhoto = await cloudinary.uploader.upload(file.path);
    User.findOneAndUpdate({ email }, {profile_photo_url: uploadedPhoto.secure_url}, { new: true, useFindAndModify: false })
        .then(user => {

            userSocket.broadcast.emit('new_profile_photo',
                
                { url: user.profile_photo_url, from: userSocket.userId}
            )

            Response.success({ 
                res,
                message: 'Profile photo updated',
                data: {
                    user: objectify(user, true)
                }
            })

        })
}