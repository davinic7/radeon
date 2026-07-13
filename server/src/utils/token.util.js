const crypto = require('crypto');

function generarTokenAleatorio(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = { generarTokenAleatorio };
