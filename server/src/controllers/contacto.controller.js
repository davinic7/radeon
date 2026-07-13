const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { Mensaje } = require('../models');

const crear = catchAsync(async (req, res) => {
  const { nombre, email, telefono, mensaje } = req.body;
  if (!nombre || !email || !mensaje) {
    throw new ApiError(400, 'nombre, email y mensaje son requeridos.');
  }

  await Mensaje.create({ nombre, email, telefono, mensaje });
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

  await mensaje.destroy();
  res.status(204).send();
});

module.exports = { crear, listar, marcarLeido, eliminar };
