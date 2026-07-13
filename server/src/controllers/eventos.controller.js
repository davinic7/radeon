const path = require('path');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { Evento } = require('../models');
const storageService = require('../services/storage.service');
const env = require('../config/env');

const listar = catchAsync(async (req, res) => {
  const where = {};
  if (req.query.activo !== undefined) {
    where.activo = req.query.activo === 'true';
  }
  const eventos = await Evento.findAll({ where, order: [['fecha', 'DESC']] });
  res.json(eventos);
});

const obtener = catchAsync(async (req, res) => {
  const evento = await Evento.findByPk(req.params.id);
  if (!evento) throw new ApiError(404, 'Evento no encontrado.');
  res.json(evento);
});

// Key deterministica (siempre el mismo path para un evento+tipo dado): subir
// una portada/logo nueva pisa el archivo anterior en el bucket en vez de ir
// acumulando huerfanos cada vez que el fotografo la cambia.
async function subirImagenEvento(eventoId, file, tipo) {
  const ext = path.extname(file.originalname) || '.jpg';
  const key = `eventos/${eventoId}/${tipo}${ext}`;
  return storageService.subirPreview({ key, buffer: file.buffer, contentType: file.mimetype });
}

// Inversa de subirPreview: de la URL publica guardada en el evento, vuelve a
// la key del bucket para poder borrarla. Devuelve null si la URL no viene de
// nuestro bucket de previews (no deberia pasar, pero evita un delete con key
// invalida si algun dato viejo tuviera otra cosa cargada).
function keyDesdeUrl(url) {
  const prefijo = `${env.s3.publicBaseUrl.replace(/\/$/, '')}/`;
  return url && url.startsWith(prefijo) ? url.slice(prefijo.length) : null;
}

const crear = catchAsync(async (req, res) => {
  const { nombre, fecha, ubicacion, descripcion } = req.body;
  if (!nombre || !fecha) {
    throw new ApiError(400, 'nombre y fecha son requeridos.');
  }

  const evento = await Evento.create({
    nombre,
    fecha,
    ubicacion,
    descripcion,
    usuarioId: req.usuario.id,
  });

  // Portada/logo son opcionales (llegan como multipart, ver upload.fields en
  // la ruta) y recien se pueden subir aca abajo porque la key determinista
  // usa el id del evento, que no existe hasta que termina el create() de
  // arriba.
  const portada = req.files?.portada?.[0];
  const logo = req.files?.logo?.[0];
  if (portada) evento.portadaUrl = await subirImagenEvento(evento.id, portada, 'portada');
  if (logo) evento.logoUrl = await subirImagenEvento(evento.id, logo, 'logo');
  if (portada || logo) await evento.save();

  res.status(201).json(evento);
});

const actualizar = catchAsync(async (req, res) => {
  const evento = await Evento.findByPk(req.params.id);
  if (!evento) throw new ApiError(404, 'Evento no encontrado.');

  const { nombre, fecha, ubicacion, descripcion, portadaUrl, logoUrl, activo } = req.body;
  await evento.update({ nombre, fecha, ubicacion, descripcion, portadaUrl, logoUrl, activo });

  res.json(evento);
});

// Subir/reemplazar portada o logo de un evento que ya existe (los que se
// crearon antes de que "Crear galeria" tuviera estos campos, o para
// cambiarlas despues). Mismo patron que configuraciones.controller.js
// (subirMarcaDeAgua): un solo archivo por request, en un endpoint dedicado
// -- asi el PUT /:id generico sigue aceptando JSON plano sin pelearse con
// multer (lo usa alternarEvento() del dashboard para el toggle activo).
const subirPortada = catchAsync(async (req, res) => {
  const evento = await Evento.findByPk(req.params.id);
  if (!evento) throw new ApiError(404, 'Evento no encontrado.');
  if (!req.file) throw new ApiError(400, 'No se recibio ninguna imagen.');

  evento.portadaUrl = await subirImagenEvento(evento.id, req.file, 'portada');
  await evento.save();
  res.json(evento);
});

const subirLogo = catchAsync(async (req, res) => {
  const evento = await Evento.findByPk(req.params.id);
  if (!evento) throw new ApiError(404, 'Evento no encontrado.');
  if (!req.file) throw new ApiError(400, 'No se recibio ninguna imagen.');

  evento.logoUrl = await subirImagenEvento(evento.id, req.file, 'logo');
  await evento.save();
  res.json(evento);
});

const eliminar = catchAsync(async (req, res) => {
  const evento = await Evento.findByPk(req.params.id);
  if (!evento) throw new ApiError(404, 'Evento no encontrado.');

  const keys = [evento.portadaUrl, evento.logoUrl].map(keyDesdeUrl).filter(Boolean);
  await Promise.all(keys.map((key) => storageService.eliminarPreview(key)));

  await evento.destroy();
  res.status(204).send();
});

module.exports = { listar, obtener, crear, actualizar, subirPortada, subirLogo, eliminar };
