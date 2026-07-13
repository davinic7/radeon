const { Router } = require('express');
const pagosController = require('../controllers/pagos.controller');

const router = Router();

router.post('/webhook', pagosController.webhook);

module.exports = router;
