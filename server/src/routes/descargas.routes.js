const { Router } = require('express');
const descargasController = require('../controllers/descargas.controller');

const router = Router();

router.get('/:token', descargasController.obtener);

module.exports = router;
