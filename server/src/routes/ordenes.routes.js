const { Router } = require('express');
const ordenesController = require('../controllers/ordenes.controller');
const { protegerRuta } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/', ordenesController.crear);
router.get('/', protegerRuta, ordenesController.listar);
router.get('/:id', protegerRuta, ordenesController.obtener);
router.post('/:id/reenviar-email', protegerRuta, ordenesController.reenviarEmail);

module.exports = router;
