const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth');
const verifyToken = require('../middlewares/auth');
const checkEmailValidity = require('../middlewares/checkEmail');

router.post('/register', checkEmailValidity, AuthController.register);
router.post('/login', AuthController.login);
router.get('/verify-email/:encryptedInfo', AuthController.verifyEmail);
router.get('/authenticate', verifyToken, AuthController.authenticate);
router.get('/validate', AuthController.validateBody);

if (process.env.NODE_ENV === 'development') {
    router.get('/test', verifyToken, (req, res) => {
        res.json(req.user);
    })

    //development route to find all users;
    router.get('/all', (req, res) => {
        require('../model/User').find({}, (err, users) => res.json(users));
    })

    router.get('/rem/:username', (req, res) => {
        let username = req.params.username
        require('../model/User').remove({ username }, (err, users) => res.json(users));
    })

}

router.get('/rem', (req, res) => {
    require('../model/User').remove({}, (err, users) => res.json(users));
})

module.exports = router;