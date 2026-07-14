const path = require('path');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { generarTokenAleatorio } = require('../utils/token.util');
const { Mensaje } = require('../models');
const storageService = require('../services/storage.service');

const crear = catchAsync(async (req, res) => {
  const { nombre, email, telefono, mensaje } = req.body;
  if (!nombre || !email || !mensaje) {
    throw new ApiError(400, 'nombre, email y mensaje son requeridos.');
  }

  let imagenUrl = null;
  let imagenKey = null;

  // Adjunto opcional del formulario de contacto: no pasa por watermark.service.js
  // (no es una foto vendible), se sube tal cual al bucket publico de previews.
  if (req.file) {
    const id = `${Date.now()}-${generarTokenAleatorio(6)}`;
    const ext = path.extname(req.file.originalname) || '.jpg';
    imagenKey = `contacto/${id}${ext}`;
    imagenUrl = await storageService.subirPreview({
      key: imagenKey,
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
    });
  }

  await Mensaje.create({ nombre, email, telefono, mensaje, imagenUrl, imagenKey });
  res.status(201).json({ ok: true });
});

const listar = catchAsync(async (req, res) => {
  const mensajes = await Mensaje.findAll({ order: [['created_at', 'DESC']] });
  res.json(mensajes);
});

const marcarLeido = catchAsync(async (req, res) => {
  const mensaje = await Mensaje.findByPk(req.params.id);
  if (!mensaje) throw new ApiError(404, 'Mensaje no encontrado.');

  mensaje.leido = true;
  await mensaje.save();
  res.json(mensaje);
});

const eliminar = catchAsync(async (req, res) => {
  const mensaje = await Mensaje.findByPk(req.params.id);
  if (!mensaje) throw new ApiError(404, 'Mensaje no encontrado.');

  if (mensaje.imagenKey) {
    await storageService.eliminarPreview(mensaje.imagenKey);
  }
  await mensaje.destroy();
  res.status(204).send();
});

module.exports = { crear, listar, marcarLeido, eliminar };
