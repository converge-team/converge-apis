const router = require('express').Router();

const SearchController = require('../controllers/search.controller')
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/', SearchController.searchForPerson);
router.get('/details', SearchController.getFriendDetails);

module.exports = router;