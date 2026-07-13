const catchAsync = require('../utils/catchAsync');
const { Orden } = require('../models');
const mercadopagoService = require('../services/mercadopago.service');
const descargaService = require('../services/descarga.service');
const emailService = require('../services/email.service');
const env = require('../config/env');

const webhook = catchAsync(async (req, res) => {
  // Se responde 200 rapido para que Mercado Pago no reintente indefinidamente,
  // incluso si el evento no es del tipo que nos interesa procesar.
  const tipo = req.query.type || req.body.type;
  if (tipo !== 'payment') {
    return res.sendStatus(200);
  }

  mercadopagoService.validarFirmaWebhook(req);

  const paymentId = req.query['data.id'];
  const pago = await mercadopagoService.obtenerPago(paymentId);

  const ordenId = pago.external_reference;
  const orden = await Orden.findByPk(ordenId);

  if (!orden) {
    return res.sendStatus(200);
  }

  // Idempotencia: si ya estaba aprobada (o el mismo pago ya fue procesado), no reprocesar.
  if (orden.estado === 'aprobada' || orden.mpPaymentId === String(pago.id)) {
    return res.sendStatus(200);
  }

  if (pago.status === 'approved') {
    orden.estado = 'aprobada';
    orden.mpPaymentId = String(pago.id);
    await orden.save();

    const { token, expiraEn } = await descargaService.crearTokenDescarga(orden.id);
    const urlDescarga = `${env.frontendUrl}/api/descargas/${token}`;
    const horasExpiracion = env.download.tokenExpirationHours;

    await emailService.enviarEmailDescarga({
      destinatario: orden.clienteEmail,
      nombreCliente: orden.clienteNombre,
      ordenId: orden.id,
      urlDescarga,
      horasExpiracion,
    });
  } else if (pago.status === 'rejected') {
    orden.estado = 'rechazada';
    orden.mpPaymentId = String(pago.id);
    await orden.save();
  }

  res.sendStatus(200);
});

module.exports = { webhook };
