const { Router } = require('express');
const configuracionesController = require('../controllers/configuraciones.controller');
const { protegerRuta, requerirRol } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = Router();

router.get('/', protegerRuta, configuracionesController.listar);
router.get('/marca-agua/preview', protegerRuta, configuracionesController.previsualizarMarcaDeAgua);
router.put(
  '/marca-agua/imagen',
  protegerRuta,
  requerirRol('admin'),
  upload.single('imagen'),
  configuracionesController.subirMarcaDeAgua
);
router.put('/:clave', protegerRuta, requerirRol('admin'), configuracionesController.actualizar);

module.exports = router;
