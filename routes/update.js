const router = require('express').Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const updateController = require('../controllers/update.controller');
const auth = require('../middlewares/auth');

router.use(auth);

router.post('/profile-photo', upload.single('profile-photo'), updateController.updatePhoto);

module.exports = router;