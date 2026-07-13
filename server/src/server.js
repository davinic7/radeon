const app = require('./app');
const env = require('./config/env');
const sequelize = require('./config/database');

// Red de seguridad a nivel de proceso: `catchAsync` + `error.middleware.js`
// ya cubren cualquier error sincrono o async que ocurra DENTRO de un
// handler de ruta (ver esos archivos), pero un rechazo de promesa sin
// `.catch()` en cualquier otro lugar (un `setInterval`, un callback de una
// libreria, un webhook mal armado) no pasa por Express en absoluto -- desde
// Node 15, un unhandledRejection no atrapado termina el proceso entero por
// default. Se loguea y se sigue corriendo en vez de crashear: mejor un
// error visible en los logs que toda la API caida por una promesa suelta.
// `uncaughtException` (codigo sincrono fuera de cualquier request) es mas
// serio -- el proceso puede quedar en un estado inconsistente -- asi que
// ahi se loguea y se sale con codigo de error para que el orquestador
// (pm2, systemd, docker) lo reinicie limpio en vez de seguir sirviendo
// pedidos con estado potencialmente corrupto.
process.on('unhandledRejection', (razon) => {
  console.error('Promesa rechazada sin manejar:', razon);
});
process.on('uncaughtException', (error) => {
  console.error('Excepcion no capturada, cerrando el proceso:', error);
  process.exit(1);
});

async function iniciar() {
  try {
    await sequelize.authenticate();
    console.log('Conexion a la base de datos establecida correctamente.');

    app.listen(env.port, () => {
      console.log(`Servidor RIDEON FOTO DEPORTIVA escuchando en el puerto ${env.port}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
}

iniciar();
