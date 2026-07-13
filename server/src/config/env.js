require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4000',

  db: {
    host: required('DB_HOST'),
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: required('DB_NAME'),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
  },

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    nombre: process.env.ADMIN_NOMBRE || 'Administrador RIDEON',
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT || undefined,
    region: process.env.S3_REGION || 'auto',
    accessKeyId: required('S3_ACCESS_KEY_ID'),
    secretAccessKey: required('S3_SECRET_ACCESS_KEY'),
    bucketOriginals: required('S3_BUCKET_ORIGINALS'),
    bucketPreviews: required('S3_BUCKET_PREVIEWS'),
    publicBaseUrl: required('S3_PUBLIC_BASE_URL'),
  },

  watermark: {
    text: process.env.WATERMARK_TEXT || 'RIDEON FOTO DEPORTIVA',
  },

  mercadoPago: {
    accessToken: required('MP_ACCESS_TOKEN'),
    publicKey: process.env.MP_PUBLIC_KEY,
    webhookSecret: required('MP_WEBHOOK_SECRET'),
  },

  download: {
    tokenExpirationHours: parseInt(process.env.DOWNLOAD_TOKEN_EXPIRATION_HOURS, 10) || 48,
  },

  mailer: {
    host: required('SMTP_HOST'),
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: required('SMTP_USER'),
    pass: required('SMTP_PASS'),
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
  },
};
