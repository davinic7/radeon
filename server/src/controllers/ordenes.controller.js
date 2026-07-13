const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { Orden, OrdenItem, Foto, Configuracion } = require('../models');
const mercadopagoService = require('../services/mercadopago.service');
const descargaService = require('../services/descarga.service');
const emailService = require('../services/email.service');
const env = require('../config/env');

const crear = catchAsync(async (req, res) => {
  const { clienteEmail, clienteNombre, fotoIds } = req.body;

  if (!clienteEmail || !Array.isArray(fotoIds) || fotoIds.length === 0) {
    throw new ApiError(400, 'clienteEmail y fotoIds (array no vacio) son requeridos.');
  }

  const fotos = await Foto.findAll({ where: { id: fotoIds } });
  if (fotos.length !== fotoIds.length) {
    throw new ApiError(404, 'Alguna de las fotos seleccionadas no existe.');
  }

  const configuracionPrecio = await Configuracion.findOne({
    where: { clave: 'precio_foto_default' },
  });
  const precioDefault = configuracionPrecio ? Number(configuracionPrecio.valor) : 0;

  const items = fotos.map((foto) => ({
    fotoId: foto.id,
    dorsal: foto.dorsal,
    precioUnitario: foto.precio !== null ? Number(foto.precio) : precioDefault,
  }));

  const total = items.reduce((acc, item) => acc + item.precioUnitario, 0);

  const orden = await Orden.create({
    clienteEmail,
    clienteNombre,
    total,
    estado: 'pendiente',
  });

  await OrdenItem.bulkCreate(
    items.map((item) => ({
      ordenId: orden.id,
      fotoId: item.fotoId,
      precioUnitario: item.precioUnitario,
    }))
  );

  const preferencia = await mercadopagoService.crearPreferencia(orden, items);

  orden.mpPreferenceId = preferencia.id;
  await orden.save();

  res.status(201).json({
    ordenId: orden.id,
    total: orden.total,
    checkoutUrl: preferencia.init_point,
  });
});

const obtener = catchAsync(async (req, res) => {
  const orden = await Orden.findByPk(req.params.id, {
    include: [{ model: OrdenItem, as: 'items', include: [{ model: Foto, as: 'foto' }] }],
  });
  if (!orden) throw new ApiError(404, 'Orden no encontrada.');
  res.json(orden);
});

const listar = catchAsync(async (req, res) => {
  const where = {};
  if (req.query.estado) where.estado = req.query.estado;

  const ordenes = await Orden.findAll({
    where,
    include: [{ model: OrdenItem, as: 'items' }],
    order: [['created_at', 'DESC']],
  });

  res.json(ordenes);
});

// Reenvio manual del email de descarga, para soporte tecnico cuando un
// cliente dice no haber recibido el original (email en spam, typo
// corregido, etc.). Reusa el mismo par crearTokenDescarga+enviarEmailDescarga
// que dispara el webhook de Mercado Pago al aprobar el pago (ver
// pagos.controller.js) -- emite un token de descarga nuevo en vez de
// reciclar uno viejo para no alargar la ventana de expiracion original.
const reenviarEmail = catchAsync(async (req, res) => {
  const orden = await Orden.findByPk(req.params.id);
  if (!orden) throw new ApiError(404, 'Orden no encontrada.');
  if (orden.estado !== 'aprobada') {
    throw new ApiError(400, 'Solo se puede reenviar el email de ordenes aprobadas.');
  }

  const { token } = await descargaService.crearTokenDescarga(orden.id);
  const urlDescarga = `${env.frontendUrl}/api/descargas/${token}`;

  await emailService.enviarEmailDescarga({
    destinatario: orden.clienteEmail,
    nombreCliente: orden.clienteNombre,
    ordenId: orden.id,
    urlDescarga,
    horasExpiracion: env.download.tokenExpirationHours,
  });

  res.json({ ok: true });
});

module.exports = { crear, obtener, listar, reenviarEmail };
