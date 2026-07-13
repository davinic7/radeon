const jwt = require('jsonwebtoken');
const env = require('../config/env');

function firmarToken(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

function verificarToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

module.exports = { firmarToken, verificarToken };
