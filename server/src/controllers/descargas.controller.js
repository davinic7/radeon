const catchAsync = require('../utils/catchAsync');
const descargaService = require('../services/descarga.service');

const obtener = catchAsync(async (req, res) => {
  const resultado = await descargaService.resolverDescarga(req.params.token);
  res.json(resultado);
});

module.exports = { obtener };
