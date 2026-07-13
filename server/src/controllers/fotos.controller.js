const path = require('path');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { generarTokenAleatorio } = require('../utils/token.util');
const { Foto, Evento, Configuracion } = require('../models');
const watermarkService = require('../services/watermark.service');
const storageService = require('../services/storage.service');

const subir = catchAsync(async (req, res) => {
  const { eventoId, dorsal } = req.body;
  if (!eventoId || !dorsal) {
    throw new ApiError(400, 'eventoId y dorsal son requeridos.');
  }
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'No se recibio ninguna imagen.');
  }

  const evento = await Evento.findByPk(eventoId);
  if (!evento) throw new ApiError(404, 'Evento no encontrado.');

  const configuraciones = await Configuracion.findAll({
    where: { clave: ['marca_agua_texto', 'marca_agua_imagen_url'] },
  });
  const textoMarcaDeAgua = configuraciones.find((c) => c.clave === 'marca_agua_texto')?.valor;
  const urlImagenMarcaDeAgua = configuraciones.find(
    (c) => c.clave === 'marca_agua_imagen_url'
  )?.valor;

  const fotosCreadas = await Promise.all(
    req.files.map(async (file) => {
      // Nombre de archivo: timestamp (ms) + sufijo aleatorio criptografico,
      // no un contador ni el nombre original del archivo. Dos motivos:
      //   1) Colisiones: esta funcion sube TODO un lote en paralelo
      //      (Promise.all), asi que varias fotos del mismo dorsal pueden
      //      procesarse en el mismo milisegundo -- el sufijo random evita
      //      que se pisen aunque `Date.now()` se repita entre ellas.
      //   2) El nombre original del archivo (`file.originalname`, ej.
      //      "IMG_0props002.jpg" de la camara) nunca se usa como key: dos
      //      fotografos (o el mismo, en dos tandas) subiendo con el mismo
      //      nombre de camara al mismo dorsal pisarian el original del
      //      otro en el bucket si se usara tal cual.
      // El timestamp al frente ademas ordena los archivos cronologicamente
      // si alguien navega el bucket a mano desde la consola de MinIO/S3.
      const id = `${Date.now()}-${generarTokenAleatorio(6)}`;
      const ext = path.extname(file.originalname) || '.jpg';
      const originalKey = `eventos/${eventoId}/${dorsal}/${id}-original${ext}`;
      const previewKey = `eventos/${eventoId}/${dorsal}/${id}-preview.jpg`;

      // Pipeline de marca de agua (ver watermark.service.js): siempre corre
      // ANTES de subir nada, nunca se guarda un preview sin marca. Usa la
      // imagen de marca de agua cargada desde el dashboard
      // (Configuracion.marca_agua_imagen_url) si existe, o cae a un patron
      // de texto diagonal generado en SVG. Los originales (`subirOriginal`,
      // abajo) NUNCA pasan por este pipeline -- van intactos al bucket
      // privado, la marca de agua es solo para las previews publicas.
      const previewBuffer = await watermarkService.generarPreview(file.buffer, {
        textoMarcaDeAgua,
        urlImagenMarcaDeAgua: urlImagenMarcaDeAgua || undefined,
      });

      await storageService.subirOriginal({
        key: originalKey,
        buffer: file.buffer,
        contentType: file.mimetype,
      });

      const previewUrl = await storageService.subirPreview({
        key: previewKey,
        buffer: previewBuffer,
        contentType: 'image/jpeg',
      });

      return Foto.create({
        eventoId,
        dorsal,
        previewKey,
        previewUrl,
        originalKey,
      });
    })
  );

  res.status(201).json(fotosCreadas);
});

// Listado admin: todas las fotos de un evento sin exigir dorsal (a
// diferencia de `buscar`, que es publica y requiere dorsal exacto). La usa
// el dashboard para la vista "entrar al evento" -> ver toda su galeria, con
// el filtro de dorsal aplicado en el cliente sobre este mismo array.
const listarPorEvento = catchAsync(async (req, res) => {
  const evento = await Evento.findByPk(req.params.eventoId);
  if (!evento) throw new ApiError(404, 'Evento no encontrado.');

  const fotos = await Foto.findAll({
    where: { eventoId: req.params.eventoId },
    attributes: ['id', 'eventoId', 'dorsal', 'previewUrl'],
    order: [['dorsal', 'ASC'], ['id', 'ASC']],
  });

  res.json(fotos);
});

const buscar = catchAsync(async (req, res) => {
  const { eventoId, dorsal } = req.query;
  if (!eventoId) {
    throw new ApiError(400, 'eventoId es requerido como query param.');
  }

  // `dorsal` es opcional: sin el, galeria.html usa este mismo endpoint para
  // traer la galeria COMPLETA de un evento (al tocar una tarjeta de
  // "Eventos pasados"), en vez de solo las fotos de un dorsal puntual.
  const where = { eventoId };
  if (dorsal) where.dorsal = dorsal;

  const fotos = await Foto.findAll({
    where,
    attributes: ['id', 'eventoId', 'dorsal', 'previewUrl', 'precio'],
    order: dorsal ? [['id', 'ASC']] : [['dorsal', 'ASC'], ['id', 'ASC']],
  });

  const configuracionPrecio = await Configuracion.findOne({
    where: { clave: 'precio_foto_default' },
  });
  const precioDefault = configuracionPrecio ? Number(configuracionPrecio.valor) : 0;

  const fotosConPrecio = fotos.map((foto) => ({
    ...foto.toJSON(),
    precio: foto.precio !== null ? Number(foto.precio) : precioDefault,
  }));

  res.json(fotosConPrecio);
});

const eliminar = catchAsync(async (req, res) => {
  const foto = await Foto.findByPk(req.params.id);
  if (!foto) throw new ApiError(404, 'Foto no encontrada.');

  await storageService.eliminarOriginal(foto.originalKey);
  await storageService.eliminarPreview(foto.previewKey);
  await foto.destroy();

  res.status(204).send();
});

module.exports = { subir, buscar, listarPorEvento, eliminar };
