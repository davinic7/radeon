const fs = require('fs/promises');
const path = require('path');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { Configuracion } = require('../models');
const storageService = require('../services/storage.service');
const watermarkService = require('../services/watermark.service');

// Foto de muestra (ya en el repo, la misma del hero de index.html) sobre la
// que se compone la marca de agua actual para la vista previa -- asi el
// fotografo ve como queda de verdad (imagen custom o patron de texto de
// fallback) sin tener que subir una foto de prueba a un evento.
const RUTA_FOTO_MUESTRA = path.join(__dirname, '..', '..', '..', 'img', 'RM-213.jpg');

const listar = catchAsync(async (req, res) => {
  const configuraciones = await Configuracion.findAll({ order: [['clave', 'ASC']] });
  res.json(configuraciones);
});

const actualizar = catchAsync(async (req, res) => {
  const { valor } = req.body;
  if (valor === undefined) throw new ApiError(400, 'valor es requerido.');

  const configuracion = await Configuracion.findOne({ where: { clave: req.params.clave } });
  if (!configuracion) throw new ApiError(404, 'Configuracion no encontrada.');

  configuracion.valor = valor;
  await configuracion.save();
  res.json(configuracion);
});

const subirMarcaDeAgua = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No se recibio ninguna imagen.');
  }
  if (req.file.mimetype !== 'image/png') {
    throw new ApiError(400, 'La marca de agua debe ser una imagen PNG.');
  }

  const url = await storageService.subirPreview({
    key: 'configuracion/marca-agua.png',
    buffer: req.file.buffer,
    contentType: 'image/png',
  });

  const [configuracion] = await Configuracion.findOrCreate({
    where: { clave: 'marca_agua_imagen_url' },
    defaults: {
      valor: url,
      descripcion: 'URL publica de la imagen usada como marca de agua sobre los previews',
    },
  });

  configuracion.valor = url;
  await configuracion.save();

  res.json(configuracion);
});

// Genera al vuelo (no persiste nada) la foto de muestra con la marca de
// agua actualmente configurada aplicada, y la devuelve como imagen directa
// -- mismo pipeline (generarPreview) que corre de verdad al subir fotos en
// fotos.controller.js, asi la vista previa nunca se desincroniza de como
// van a salir las previews reales.
const previsualizarMarcaDeAgua = catchAsync(async (req, res) => {
  const configuraciones = await Configuracion.findAll({
    where: { clave: ['marca_agua_texto', 'marca_agua_imagen_url'] },
  });
  const textoMarcaDeAgua = configuraciones.find((c) => c.clave === 'marca_agua_texto')?.valor;
  const urlImagenMarcaDeAgua = configuraciones.find((c) => c.clave === 'marca_agua_imagen_url')?.valor;

  const bufferMuestra = await fs.readFile(RUTA_FOTO_MUESTRA);
  const preview = await watermarkService.generarPreview(bufferMuestra, {
    textoMarcaDeAgua,
    urlImagenMarcaDeAgua: urlImagenMarcaDeAgua || undefined,
  });

  res.set('Content-Type', 'image/jpeg');
  res.set('Cache-Control', 'no-store');
  res.send(preview);
});

module.exports = { listar, actualizar, subirMarcaDeAgua, previsualizarMarcaDeAgua };
