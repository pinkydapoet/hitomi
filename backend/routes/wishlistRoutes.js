// backend/routes/wishlistRoutes.js
const router = require('express').Router();
const ctrl   = require('../controllers/wishlistController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/',              ctrl.getWishlist);
router.post('/',             ctrl.addItem);
router.delete('/:productId', ctrl.removeItem);

module.exports = router;