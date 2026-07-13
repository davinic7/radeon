/**
 * Pipeline de marca de agua para las previews publicas.
 *
 * DONDE VIVE EN EL FLUJO: `fotos.controller.js` (subir) llama a
 * `generarPreview()` para CADA foto de un lote, antes de subir nada al
 * bucket. El buffer devuelto es lo unico que llega al bucket publico de
 * previews; el original (sin marca) va aparte al bucket privado y jamas
 * pasa por aca (ver storageService.subirOriginal en el controller).
 *
 * QUE HAY HOY: resize a `PREVIEW_MAX_WIDTH`, overlay (imagen subida desde
 * Configuracion > marca de agua, o un patron de texto diagonal generado en
 * SVG si no hay imagen custom) y compresion a JPEG. Es sincrono por foto
 * (una llamada a `generarPreview` = una foto procesada), asi que subir un
 * lote grande escala linealmente con la cantidad de archivos.
 *
 * EXTENSIONES PENSADAS PERO NO IMPLEMENTADAS (para cuando haga falta):
 *   - Marca de agua por evento (hoy es una unica config global en toda la
 *     cuenta) -- agregaria una columna `marcaAguaImagenUrl` a `Evento` y
 *     este servicio recibiria el evento en vez de leer la Configuracion
 *     global.
 *   - Opacidad/posicion configurables desde el dashboard (hoy `0.35` alpha
 *     y `gravity: 'center'` estan hardcodeados aca abajo).
 *   - Procesar el lote con un limite de concurrencia (p-limit o similar)
 *     si en producción se suben lotes de cientos de fotos por evento y
 *     `Promise.all` sin limite empieza a saturar CPU/memoria del proceso.
 */
const sharp = require('sharp');
const env = require('../config/env');

const PREVIEW_MAX_WIDTH = 1600;
const PREVIEW_JPEG_QUALITY = 78;

function escaparXml(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function construirSvgMarcaDeAguaTexto(texto, width, height) {
  const textoSeguro = escaparXml(texto);
  const tileSize = Math.max(Math.round(width / 4), 260);
  const fontSize = Math.round(tileSize / 9);

  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="marca" width="${tileSize}" height="${tileSize}" patternUnits="userSpaceOnUse"
                 patternTransform="rotate(-30)">
          <text x="0" y="${tileSize / 2}" font-family="sans-serif" font-size="${fontSize}"
                fill="rgba(255,255,255,0.35)" stroke="rgba(0,0,0,0.25)" stroke-width="1">
            ${textoSeguro}
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#marca)" />
    </svg>
  `);
}

/**
 * Genera un buffer JPEG comprimido con marca de agua a partir del buffer original.
 * Usa la imagen de marca de agua subida desde el dashboard (urlImagenMarcaDeAgua) si existe,
 * o un patron de texto repetido en diagonal en caso contrario.
 */
async function generarPreview(bufferOriginal, { textoMarcaDeAgua, urlImagenMarcaDeAgua } = {}) {
  const imagenBase = sharp(bufferOriginal).rotate();
  const metadata = await imagenBase.metadata();

  const anchoOriginal = metadata.width || PREVIEW_MAX_WIDTH;
  const altoOriginal = metadata.height || PREVIEW_MAX_WIDTH;
  const width = Math.min(anchoOriginal, PREVIEW_MAX_WIDTH);
  // BUG CRITICO (ver auditoria): antes esto se sacaba con
  // `redimensionada.clone().metadata()`, pero sharp es lazy -- `.metadata()`
  // sobre un pipeline con un `.resize()` todavia pendiente devuelve las
  // dimensiones del buffer ORIGINAL, no las del resultado ya redimensionado.
  // En cualquier foto donde `width` quedara mas chico que el ancho original
  // (el caso normal: casi toda camara/celular sube fotos mas anchas que
  // PREVIEW_MAX_WIDTH), `height` terminaba siendo el alto ORIGINAL -- mas
  // grande que la imagen ya redimensionada -- y el overlay compuesto mas
  // abajo quedaba mas grande que la base. Sharp tira duro en ese caso
  // ("Image to composite must have same dimensions or smaller"): CUALQUIER
  // subida de foto fallaba con 500. Se calcula el alto resultante a mano
  // a partir de la relacion de aspecto en vez de volver a preguntarle al
  // pipeline.
  const height = Math.round((width / anchoOriginal) * altoOriginal);
  const redimensionada = imagenBase.resize({ width, withoutEnlargement: true });

  // Si hay una imagen de marca de agua personalizada cargada desde el
  // dashboard, se intenta usar esa; si la URL no responde (bucket caido,
  // el admin borro el archivo a mano, etc.) se cae al patron de texto en
  // vez de tirar la subida completa -- perder la marca "linda" un rato es
  // mucho mejor que un fotografo no pueda subir fotos de un evento en vivo
  // por una URL de configuracion rota. El error se loguea igual para que
  // no pase desapercibido.
  let overlayBuffer;
  let usarImagenPersonalizada = Boolean(urlImagenMarcaDeAgua);

  if (usarImagenPersonalizada) {
    try {
      const respuesta = await fetch(urlImagenMarcaDeAgua);
      if (!respuesta.ok) {
        throw new Error(`Respuesta ${respuesta.status} al pedir la imagen de marca de agua`);
      }
      const bufferImagenMarcaDeAgua = Buffer.from(await respuesta.arrayBuffer());
      overlayBuffer = await sharp(bufferImagenMarcaDeAgua)
        .resize({ width, height, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();
    } catch (error) {
      console.error('No se pudo aplicar la marca de agua personalizada, se usa el patron de texto:', error);
      usarImagenPersonalizada = false;
    }
  }

  if (!usarImagenPersonalizada) {
    overlayBuffer = construirSvgMarcaDeAguaTexto(
      textoMarcaDeAgua || env.watermark.text,
      width,
      height || width
    );
  }

  return redimensionada
    .composite([{ input: overlayBuffer, gravity: 'center' }])
    .jpeg({ quality: PREVIEW_JPEG_QUALITY })
    .toBuffer();
}

module.exports = { generarPreview };
