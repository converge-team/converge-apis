
const fs = require('fs');
const cloudinary = require('cloudinary').v2

const User = require('../model/User');
const objectify = require('../utils/objectify');
const Response = require('../utils/response')
const sockets = require('../socket.server').sockets

exports.updatePhoto = async (req, res) => {

    try {

        const start = Date.now();

        const { email, username } = req.user
        const { file } = req;

        const userSocket = sockets.find(socket => socket.username === username);

        const user = await User.findOne({ email });

        const oldPublicId = user.profile_photo_url.substring(user.profile_photo_url.lastIndexOf('/') + 1, user.profile_photo_url.lastIndexOf('.'));

        const uploadedPhoto = await cloudinary.uploader.upload(file.path);

        cloudinary.uploader.destroy(oldPublicId);

        user.profile_photo_url = uploadedPhoto.secure_url;

        fs.unlink(file.path, () => {
            user.save()
                .then(result => {

                    User.updateMany(
                        { friends: { $elemMatch: { username } } },
                        { "$set": { "friends.$.profile_photo": result.profile_photo_url } },
                        { new: true }
                    )
                        .then(() => {

                            userSocket.broadcast.emit('new_profile_photo',

                                { url: user.profile_photo_url, from: userSocket.userId }
                            );

                            Response.success({
                                res,
                                message: 'Profile photo updated',
                                data: {
                                    user: objectify(user, true)
                                }
                            })

                            console.log('time: ', Date.now() - start)
                        })

                })
                .catch(error => Response.serverErrorResponse(error, res, "Couldn't update image"));
        })
    } catch(error) {
        Response.serverErrorResponse(error, res);
    }

}