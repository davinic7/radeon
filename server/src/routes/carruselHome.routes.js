const { Router } = require('express');
const carruselHomeController = require('../controllers/carruselHome.controller');
const { protegerRuta } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = Router();

router.get('/', carruselHomeController.listar);
router.post('/', protegerRuta, upload.single('imagen'), carruselHomeController.crear);
router.post('/desde-foto', protegerRuta, carruselHomeController.crearDesdeFoto);
router.put('/:id', protegerRuta, carruselHomeController.actualizar);
router.delete('/:id', protegerRuta, carruselHomeController.eliminar);

module.exports = router;
