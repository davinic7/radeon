const path = require('path');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { generarTokenAleatorio } = require('../utils/token.util');
const { ImagenCarruselHome, Foto } = require('../models');
const storageService = require('../services/storage.service');

const listar = catchAsync(async (req, res) => {
  const where = {};
  if (req.query.destacado !== undefined) {
    where.destacado = req.query.destacado === 'true';
  }
  const imagenes = await ImagenCarruselHome.findAll({ where, order: [['id', 'ASC']] });
  res.json(imagenes);
});

const crear = catchAsync(async (req, res) => {
  const { titulo, url } = req.body;
  if (!titulo || !url) {
    throw new ApiError(400, 'titulo y url son requeridos.');
  }
  if (!req.file) {
    throw new ApiError(400, 'No se recibio ninguna imagen.');
  }

  // Mismo esquema de key que fotos.controller.js: timestamp + sufijo
  // aleatorio para que dos subidas en el mismo milisegundo no se pisen.
  const id = `${Date.now()}-${generarTokenAleatorio(6)}`;
  const ext = path.extname(req.file.originalname) || '.jpg';
  const key = `carrusel-home/${id}${ext}`;

  // Banner promocional del propio fotografo, no una preview de una foto
  // vendible -- no pasa por watermark.service.js, se sube tal cual al
  // bucket publico de previews (mismo bucket, no hace falta uno nuevo).
  const imagenUrl = await storageService.subirPreview({
    key,
    buffer: req.file.buffer,
    contentType: req.file.mimetype,
  });

  const item = await ImagenCarruselHome.create({
    imagenUrl,
    imagenKey: key,
    titulo,
    url,
    destacado: true,
    usuarioId: req.usuario.id,
  });

  res.status(201).json(item);
});

// Alternativa a crear(): en vez de subir un archivo nuevo, toma una foto ya
// cargada a un evento (por id) y la copia a su PROPIA key dentro de
// carrusel-home/ -- nunca comparte archivo con la foto de origen, para que
// borrar la foto del evento (o este item del carrusel, cada uno con su
// eliminar() propio) no rompa al otro.
const crearDesdeFoto = catchAsync(async (req, res) => {
  const { fotoId, titulo, url } = req.body;
  if (!fotoId || !titulo || !url) {
    throw new ApiError(400, 'fotoId, titulo y url son requeridos.');
  }

  const foto = await Foto.findByPk(fotoId);
  if (!foto) throw new ApiError(404, 'Foto no encontrada.');

  const respuestaImagen = await fetch(foto.previewUrl);
  if (!respuestaImagen.ok) {
    throw new ApiError(502, 'No se pudo copiar la imagen de la foto elegida.');
  }
  const buffer = Buffer.from(await respuestaImagen.arrayBuffer());
  const contentType = respuestaImagen.headers.get('content-type') || 'image/jpeg';

  const id = `${Date.now()}-${generarTokenAleatorio(6)}`;
  const key = `carrusel-home/${id}.jpg`;
  const imagenUrl = await storageService.subirPreview({ key, buffer, contentType });

  const item = await ImagenCarruselHome.create({
    imagenUrl,
    imagenKey: key,
    titulo,
    url,
    destacado: true,
    usuarioId: req.usuario.id,
  });

  res.status(201).json(item);
});

const actualizar = catchAsync(async (req, res) => {
  const item = await ImagenCarruselHome.findByPk(req.params.id);
  if (!item) throw new ApiError(404, 'Imagen no encontrada.');

  const { destacado } = req.body;
  await item.update({ destacado });

  res.json(item);
});

const eliminar = catchAsync(async (req, res) => {
  const item = await ImagenCarruselHome.findByPk(req.params.id);
  if (!item) throw new ApiError(404, 'Imagen no encontrada.');

  await storageService.eliminarPreview(item.imagenKey);
  await item.destroy();

  res.status(204).send();
});

module.exports = { listar, crear, crearDesdeFoto, actualizar, eliminar };
