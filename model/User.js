const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var uniqueArrayPlugin = require('mongoose-unique-array');

const MessageSchema = new Schema({
    _id: false,
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['sent', 'received']
    },
    time: Date
})

var friendSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    friends_status: Boolean,
    lastSeen: Date,
    profile_photo: String,
    messages: [MessageSchema]
})




var userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female']
    },
    lastSeen: Date,
    friends: [friendSchema],
    pushSubscription: String,
    profile_photo_url: String,
    old_photo_url: String
})

userSchema.plugin(uniqueArrayPlugin);

module.exports = mongoose.model('User', userSchema);