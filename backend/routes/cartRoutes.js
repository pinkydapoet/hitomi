// backend/routes/cartRoutes.js
const router = require('express').Router();
const ctrl   = require('../controllers/cartController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/',        ctrl.getCart);
router.post('/',       ctrl.addItem);
router.put('/:id',     ctrl.updateItem);
router.delete('/:id',  ctrl.removeItem);
router.delete('/',     ctrl.clearCart);

module.exports = router;