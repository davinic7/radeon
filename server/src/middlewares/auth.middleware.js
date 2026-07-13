const ApiError = require('../utils/ApiError');
const { verificarToken } = require('../utils/jwt.util');
const { Usuario } = require('../models');

const protegerRuta = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No autenticado: falta el token Bearer.');
    }

    const token = authHeader.split(' ')[1];

    // El catch de mas abajo envolvia CUALQUIER error de este bloque (incluida
    // una caida de conexion a la base de datos en el findByPk de aca abajo)
    // en un generico "Token invalido o expirado" 401 -- eso disfrazaba
    // problemas reales de infraestructura como si fueran sesiones vencidas,
    // tanto para el usuario (mensaje enganoso) como para quien mira los logs
    // (un 500 de Postgres no debia verse jamas como un 401 de auth). Solo la
    // verificacion del JWT en si misma es lo que realmente corresponde
    // traducir a "token invalido/expirado"; el resto de errores de este
    // bloque ya son ApiError con su propio mensaje/codigo, o son un error
    // inesperado que debe llegar tal cual al error handler central (que lo
    // loguea y responde 500, ver error.middleware.js).
    let payload;
    try {
      payload = verificarToken(token);
    } catch {
      throw new ApiError(401, 'Token invalido o expirado.');
    }

    const usuario = await Usuario.findByPk(payload.id);
    if (!usuario || !usuario.activo) {
      throw new ApiError(401, 'Usuario no encontrado o inactivo.');
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    next(error);
  }
};

const requerirRol =
  (...roles) =>
  (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return next(new ApiError(403, 'No tenes permisos para esta accion.'));
    }
    next();
  };

module.exports = { protegerRuta, requerirRol };
