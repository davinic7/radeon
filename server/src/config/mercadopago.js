const { MercadoPagoConfig } = require('mercadopago');
const env = require('./env');

const mpClient = new MercadoPagoConfig({
  accessToken: env.mercadoPago.accessToken,
});

module.exports = mpClient;
