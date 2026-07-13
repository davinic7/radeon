const ApiError = require('../utils/ApiError');
const { generarTokenAleatorio } = require('../utils/token.util');
const { DescargaToken, Orden, OrdenItem, Foto } = require('../models');
const env = require('../config/env');
const storageService = require('./storage.service');

async function crearTokenDescarga(ordenId) {
  const token = generarTokenAleatorio();
  const expiraEn = new Date(
    Date.now() + env.download.tokenExpirationHours * 60 * 60 * 1000
  );

  await DescargaToken.create({ ordenId, token, expiraEn });

  return { token, expiraEn };
}

async function resolverDescarga(token) {
  const descargaToken = await DescargaToken.findOne({ where: { token } });

  if (!descargaToken) {
    throw new ApiError(404, 'Enlace de descarga invalido.');
  }
  if (new Date(descargaToken.expiraEn) < new Date()) {
    throw new ApiError(410, 'Este enlace de descarga expiro.');
  }

  const orden = await Orden.findByPk(descargaToken.ordenId, {
    include: [{ model: OrdenItem, as: 'items', include: [{ model: Foto, as: 'foto' }] }],
  });

  if (!orden || orden.estado !== 'aprobada') {
    throw new ApiError(403, 'La orden asociada a este enlace no esta aprobada.');
  }

  descargaToken.usadoEn = new Date();
  await descargaToken.save();

  const fotos = await Promise.all(
    orden.items.map(async (item) => ({
      fotoId: item.foto.id,
      dorsal: item.foto.dorsal,
      url: await storageService.generarUrlDescargaOriginal(item.foto.originalKey),
    }))
  );

  return { ordenId: orden.id, fotos };
}

module.exports = { crearTokenDescarga, resolverDescarga };
