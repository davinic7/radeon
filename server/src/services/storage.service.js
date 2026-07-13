const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3');
const env = require('../config/env');

async function subirArchivo({ bucket, key, buffer, contentType }) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return key;
}

async function subirOriginal({ key, buffer, contentType }) {
  return subirArchivo({ bucket: env.s3.bucketOriginals, key, buffer, contentType });
}

async function subirPreview({ key, buffer, contentType }) {
  await subirArchivo({ bucket: env.s3.bucketPreviews, key, buffer, contentType });
  return `${env.s3.publicBaseUrl.replace(/\/$/, '')}/${key}`;
}

async function generarUrlDescargaOriginal(key, expiraEnSegundos = 900) {
  const command = new GetObjectCommand({ Bucket: env.s3.bucketOriginals, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: expiraEnSegundos });
}

async function eliminarOriginal(key) {
  await s3Client.send(new DeleteObjectCommand({ Bucket: env.s3.bucketOriginals, Key: key }));
}

async function eliminarPreview(key) {
  await s3Client.send(new DeleteObjectCommand({ Bucket: env.s3.bucketPreviews, Key: key }));
}

module.exports = {
  subirOriginal,
  subirPreview,
  generarUrlDescargaOriginal,
  eliminarOriginal,
  eliminarPreview,
};
