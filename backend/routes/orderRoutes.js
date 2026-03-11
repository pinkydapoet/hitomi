// backend/routes/orderRoutes.js
const router = require('express').Router();
const ctrl   = require('../controllers/orderController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/',                    ctrl.getOrders);
router.post('/',                   ctrl.checkout);
router.get('/:id',                 ctrl.getOrder);
router.post('/validate-coupon',    ctrl.validateCoupon);

module.exports = router;