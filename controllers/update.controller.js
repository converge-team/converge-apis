
const User = require('../model/User');

exports.updatePhoto = (req, res) => {
    const { file } = req;

    console.log('file: ',file);
}