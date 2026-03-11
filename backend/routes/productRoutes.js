// backend/routes/productRoutes.js
const router = require('express').Router();
const ctrl   = require('../controllers/productController');
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

router.get('/',     optionalAuth, ctrl.getAll);
router.get('/:id',  ctrl.getOne);

router.post('/',      auth, adminOnly, ctrl.create);
router.put('/:id',    auth, adminOnly, ctrl.update);
router.delete('/:id', auth, adminOnly, ctrl.remove);

module.exports = router;