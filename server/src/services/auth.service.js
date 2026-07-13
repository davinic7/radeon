const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');
const { firmarToken } = require('../utils/jwt.util');
const { Usuario } = require('../models');

async function login(email, password) {
  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario || !usuario.activo) {
    throw new ApiError(401, 'Credenciales invalidas.');
  }

  const passwordValido = await bcrypt.compare(password, usuario.passwordHash);
  if (!passwordValido) {
    throw new ApiError(401, 'Credenciales invalidas.');
  }

  const token = firmarToken({ id: usuario.id, rol: usuario.rol });

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    },
  };
}

module.exports = { login };
