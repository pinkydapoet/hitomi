// backend/routes/userRoutes.js
const router = require('express').Router();
const ctrl   = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/profile',      ctrl.getProfile);
router.put('/profile',      ctrl.updateProfile);
router.put('/address',      ctrl.updateAddress);
router.put('/password',     ctrl.changePassword);

module.exports = router;