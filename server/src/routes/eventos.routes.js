const { Router } = require('express');
const eventosController = require('../controllers/eventos.controller');
const { protegerRuta } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = Router();

router.get('/', eventosController.listar);
router.get('/:id', eventosController.obtener);
router.post(
  '/',
  protegerRuta,
  upload.fields([
    { name: 'portada', maxCount: 1 },
    { name: 'logo', maxCount: 1 },
  ]),
  eventosController.crear
);
router.put('/:id/portada', protegerRuta, upload.single('imagen'), eventosController.subirPortada);
router.put('/:id/logo', protegerRuta, upload.single('imagen'), eventosController.subirLogo);
router.put('/:id', protegerRuta, eventosController.actualizar);
router.delete('/:id', protegerRuta, eventosController.eliminar);

module.exports = router;
