const { Router } = require('express');
const contactoController = require('../controllers/contacto.controller');
const { protegerRuta } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = Router();

router.post('/', upload.single('imagen'), contactoController.crear);
router.get('/', protegerRuta, contactoController.listar);
router.put('/:id/leido', protegerRuta, contactoController.marcarLeido);
router.delete('/:id', protegerRuta, contactoController.eliminar);

module.exports = router;
