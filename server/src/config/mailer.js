const nodemailer = require('nodemailer');
const env = require('./env');

const transporter = nodemailer.createTransport({
  host: env.mailer.host,
  port: env.mailer.port,
  secure: env.mailer.secure,
  auth: {
    user: env.mailer.user,
    pass: env.mailer.pass,
  },
});

module.exports = transporter;
