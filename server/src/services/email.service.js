const transporter = require('../config/mailer');
const env = require('../config/env');

async function enviarEmailDescarga({ destinatario, nombreCliente, ordenId, urlDescarga, horasExpiracion }) {
  await transporter.sendMail({
    from: env.mailer.from,
    to: destinatario,
    subject: `RIDEON FOTO DEPORTIVA - Tus fotos de la orden #${ordenId}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#8C0303;">Gracias por tu compra${nombreCliente ? `, ${nombreCliente}` : ''}!</h2>
        <p>Tu pago fue aprobado y tus fotos en alta resolucion ya estan listas para descargar.</p>
        <p>
          <a href="${urlDescarga}" style="background:#8C0303;color:#fff;padding:12px 20px;
             border-radius:6px;text-decoration:none;display:inline-block;">
            Descargar mis fotos
          </a>
        </p>
        <p style="color:#666;font-size:14px;">
          Este enlace es personal y expira en ${horasExpiracion} horas. Si expira, escribinos desde la
          seccion de contacto para volver a generarlo.
        </p>
      </div>
    `,
  });
}

module.exports = { enviarEmailDescarga };
