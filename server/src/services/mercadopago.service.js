const crypto = require('crypto');
const { Preference, Payment } = require('mercadopago');
const mpClient = require('../config/mercadopago');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

async function crearPreferencia(orden, items) {
  const preference = new Preference(mpClient);

  const respuesta = await preference.create({
    body: {
      items: items.map((item) => ({
        id: String(item.fotoId),
        title: `Foto evento - dorsal ${item.dorsal}`,
        quantity: 1,
        unit_price: Number(item.precioUnitario),
        currency_id: 'ARS',
      })),
      payer: { email: orden.clienteEmail },
      external_reference: String(orden.id),
      back_urls: {
        success: `${env.frontendUrl}/index.html?pago=exito`,
        pending: `${env.frontendUrl}/index.html?pago=pendiente`,
        failure: `${env.frontendUrl}/index.html?pago=fallo`,
      },
      auto_return: 'approved',
      notification_url: `${env.frontendUrl}/api/pagos/webhook`,
    },
  });

  return respuesta;
}

async function obtenerPago(paymentId) {
  const payment = new Payment(mpClient);
  return payment.get({ id: paymentId });
}

/**
 * Valida la firma del webhook de Mercado Pago segun el esquema x-signature / x-request-id.
 * https://www.mercadopago.com.ar/developers/es/docs/checkout-api/additional-content/security/signature
 */
function validarFirmaWebhook(req) {
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  const dataId = req.query['data.id'];

  if (!xSignature || !xRequestId || !dataId) {
    throw new ApiError(400, 'Faltan cabeceras de firma del webhook.');
  }

  const partes = Object.fromEntries(
    xSignature.split(',').map((parte) => {
      const [clave, valor] = parte.split('=');
      return [clave.trim(), valor && valor.trim()];
    })
  );

  const { ts, v1 } = partes;
  if (!ts || !v1) {
    throw new ApiError(400, 'Firma del webhook malformada.');
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmacEsperado = crypto
    .createHmac('sha256', env.mercadoPago.webhookSecret)
    .update(manifest)
    .digest('hex');

  // Comparacion a tiempo constante: `!==` sobre strings compara caracter a
  // caracter y corta apenas encuentra la primera diferencia, lo que en
  // teoria permite a un atacante ir adivinando la firma byte a byte
  // midiendo cuanto tarda cada intento (timing attack). `timingSafeEqual`
  // siempre tarda lo mismo sin importar en que posicion difieren los
  // buffers. Ambos strings son hex de digest SHA-256 (64 chars = 32 bytes),
  // pero se valida el largo antes de todos modos porque timingSafeEqual
  // tira si los buffers no miden lo mismo (un v1 malformado no deberia
  // voltear el servidor con un 500).
  const bufferEsperado = Buffer.from(hmacEsperado, 'hex');
  const bufferRecibido = Buffer.from(v1, 'hex');
  const firmaValida =
    bufferEsperado.length === bufferRecibido.length &&
    crypto.timingSafeEqual(bufferEsperado, bufferRecibido);

  if (!firmaValida) {
    throw new ApiError(401, 'Firma del webhook invalida.');
  }
}

module.exports = { crearPreferencia, obtenerPago, validarFirmaWebhook };
