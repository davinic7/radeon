const { Router } = require('express');
const fotosController = require('../controllers/fotos.controller');
const { protegerRuta } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = Router();

router.get('/buscar', fotosController.buscar);
router.get('/evento/:eventoId', protegerRuta, fotosController.listarPorEvento);
router.post('/upload', protegerRuta, upload.array('fotos', 50), fotosController.subir);
router.delete('/:id', protegerRuta, fotosController.eliminar);

module.exports = router;
