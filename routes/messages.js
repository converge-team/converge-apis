const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const messageController = require('../controllers/messages.controller');


router.use(auth);
router.get('/', messageController.getMessages);
router.get('/individual', messageController.getMessageForUser);

module.exports = router;